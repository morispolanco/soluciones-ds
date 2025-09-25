import type { PerfilUsuario, ClientePotencial } from '../types';

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NAME = "deepseek/deepseek-chat-v3.1:free";
const OPENROUTER_API_KEY = "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";

const getHeaders = () => {
  if (!OPENROUTER_API_KEY) {
    throw new Error("La clave de API de OpenRouter no está configurada.");
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    // OpenRouter requiere estos encabezados para los modelos gratuitos
    'HTTP-Referer': 'https://aistudio.google.com', 
    'X-Title': 'ServiceMatch',
  };
};

export const buscarClientes = async (pais: string, probabilidadMin: number): Promise<ClientePotencial[]> => {
  try {
    const systemInstruction = "Eres un consultor experto en soluciones de IA para B2B. Tu trabajo es identificar necesidades empresariales y proponer aplicaciones de IA específicas. Debes responder ÚNICAMENTE con un array JSON válido.";
    const miServicio = "Crear aplicaciones personalizadas basadas en grandes modelos de lenguaje para solucionar necesidades específicas de industrias o comercios.";

    const prompt = `
    Mi servicio es: "${miServicio}".
    Busca hasta 30 empresas en '${pais}' que sean excelentes prospectos para mi servicio.
    **CRITERIO CLAVE**: Los resultados deben ser de industrias pequeñas o medianas. No incluyas grandes corporaciones ni grandes comercios.

    Para cada empresa, DEBES realizar las siguientes tareas:
    1.  **Encontrar un Contacto Relevante**: Usando búsquedas web, identifica un gerente, director o encargado. Obtén su nombre, cargo y un email que sea personal o de su puesto directo. Es CRÍTICO que el email NO sea genérico (ej: 'info@', 'contacto@', 'ventas@', 'soporte@', 'gerencia@'). Si no puedes encontrar un email de contacto válido y no genérico, descarta a la empresa y busca otra.
    2.  **Identificar una Necesidad Concreta**: Analiza el modelo de negocio de la empresa e identifica un problema específico, una ineficiencia o una oportunidad de mejora que puedan tener. Sé muy concreto. Esto será el 'analisisNecesidad'.
    3.  **Proponer una Solución de IA**: Diseña un concepto para una aplicación de IA personalizada que resuelva la necesidad identificada. Describe la aplicación y sus beneficios clave. Esto será la 'solucionPropuesta'.
    4.  **Crear un Prompt de Solución**: Escribe un prompt técnico y detallado para un LLM que pueda generar un prototipo o una especificación detallada de la solución de IA propuesta. Esto será el 'promptSolucion'.
    5.  **Estimar Probabilidad de Aceptación**: Asigna una puntuación entre ${probabilidadMin} y 100 que represente la probabilidad de que la empresa esté interesada en esta propuesta ('probabilidadContratacion'). La probabilidad debe ser realista y justificada por la necesidad y la solución.

    REGLAS ESTRICTAS:
    - **Enfócate EXCLUSIVAMENTE en empresas pequeñas o medianas.** Evita grandes corporaciones, cadenas de retail o empresas multinacionales conocidas.
    - Todos los campos son OBLIGATORIOS, especialmente el email de contacto no genérico.
    - La respuesta DEBE ser EXCLUSIVAMENTE un array JSON válido, empezando con '[' y terminando con ']'. No incluyas texto explicativo ni marcadores de código.
    - Ordena el resultado final de mayor a menor 'probabilidadContratacion'.

    La estructura de cada objeto JSON debe ser:
    {
      "id": "string (un UUID v4 único para cada prospecto)",
      "nombreEmpresa": "string",
      "paginaWeb": "string",
      "contacto": { "nombre": "string", "cargo": "string", "email": "string", "telefono": "string", "emailVerificado": "boolean" },
      "ubicacion": "string (ciudad/país, ej: '${pais}')",
      "sector": "string (la industria de la empresa)",
      "direccionCompleta": "string",
      "analisisNecesidad": "string (La necesidad específica que identificaste)",
      "solucionPropuesta": "string (La descripción de la aplicación de IA que propones)",
      "promptSolucion": "string (El prompt técnico para desarrollar la solución)",
      "probabilidadContratacion": "number (entre ${probabilidadMin} y 100)",
      "calificacion": { "puntuacion": "number", "reseñas": "number" }
    }
    `;

    const apiResponse = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: prompt }
            ]
        })
    });

    if (!apiResponse.ok) {
        const errorBody = await apiResponse.json().catch(() => apiResponse.text());
        console.error("API Error:", errorBody);
        const errorMessage = errorBody?.error?.message || JSON.stringify(errorBody);
        throw new Error(`Error de la API (${apiResponse.status}): ${errorMessage}`);
    }

    const data = await apiResponse.json();
    
    if (!data.choices?.[0]?.message?.content) {
        console.error("Respuesta inesperada de la API:", data);
        throw new Error("La respuesta de la API no tiene el formato esperado.");
    }

    let jsonText = data.choices[0].message.content.trim();
    
    const startIndex = jsonText.indexOf('[');
    const endIndex = jsonText.lastIndexOf(']');
    
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      jsonText = jsonText.substring(startIndex, endIndex + 1);
    } else {
      const markdownMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
      if (markdownMatch && markdownMatch[1]) {
        jsonText = markdownMatch[1];
      } else {
        console.error("No se encontró un array JSON válido en la respuesta:", jsonText);
        throw new Error("La respuesta del modelo no contenía un array JSON válido. La respuesta fue: " + jsonText.substring(0, 150) + "...");
      }
    }
    
    const clientes = JSON.parse(jsonText) as ClientePotencial[];
    return clientes;
  } catch (error) {
    console.error("Error al buscar clientes:", error);
    if (error instanceof SyntaxError) {
      console.error("Respuesta recibida no es JSON válido.");
      throw new Error("La respuesta del modelo no tuvo un formato JSON válido. Intenta ajustar la búsqueda.");
    }
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("No se pudieron obtener los prospectos. Inténtalo de nuevo.");
  }
};

export const generarEmail = async (cliente: ClientePotencial, perfil: PerfilUsuario): Promise<string> => {
  try {
    const systemInstruction = "Eres un redactor experto en correos B2B para venta de soluciones de IA. Tu única función es devolver un objeto JSON con las claves 'asunto' y 'cuerpo'. Nunca escribas nada fuera del objeto JSON.";
    const miServicio = "crear aplicaciones personalizadas basadas en grandes modelos de lenguaje para solucionar necesidades específicas de industrias o comercios.";

    const prompt = `
    Mi servicio es: ${miServicio}.
    Estoy escribiendo un correo en frío a ${cliente.contacto.nombre} (${cliente.contacto.cargo}) de ${cliente.nombreEmpresa}.

    Basado en mi investigación, he identificado una necesidad específica para su empresa:
    **Necesidad Identificada**: "${cliente.analisisNecesidad}"

    Mi propuesta de solución de IA personalizada para ellos es:
    **Solución Propuesta**: "${cliente.solucionPropuesta}"

    Tu tarea es redactar un borrador de correo electrónico B2B altamente personalizado y convincente en español.

    **REGLAS ESTRICTAS PARA EL CORREO:**
    1.  **Asunto**: Corto, intrigante y personalizado. Debe hacer referencia a su negocio o a la solución propuesta. (ej: "Una idea de IA para [área de negocio] en ${cliente.nombreEmpresa}").
    2.  **Cuerpo:**
        -   **Saludo**: "Estimado/a ${cliente.contacto.nombre}:".
        -   **Introducción (Párrafo 1)**: Demuestra que entiendes su negocio. Menciona brevemente su empresa y el motivo de tu contacto.
        -   **Conexión y Solución (Párrafo 2)**: Presenta de forma clara y concisa la necesidad que identificaste ("${cliente.analisisNecesidad}"). Inmediatamente después, introduce tu solución personalizada ("${cliente.solucionPropuesta}") como la respuesta directa a esa necesidad. Explica 1 o 2 beneficios clave.
        -   **Llamada a la acción (Párrafo 3)**: Propón una llamada exploratoria de 15 minutos para discutir cómo tu solución de IA podría beneficiarlos.
        -   **Despedida y Firma**: Finaliza con "Atentamente," y luego la firma con los datos del remitente, cada uno en una nueva línea:
            ${perfil.nombre}
            ${perfil.email}
            ${perfil.paginaWeb}
    
    **FORMATO DE SALIDA OBLIGATORIO:**
    Tu respuesta DEBE ser EXCLUSIVamente un objeto JSON válido. No incluyas texto, explicaciones o marcadores de formato. La respuesta debe empezar con '{' y terminar con '}'.
    
    La estructura JSON debe ser:
    {
      "asunto": "string",
      "cuerpo": "string"
    }
    `;

    const apiResponse = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" }
        })
    });
    
    if (!apiResponse.ok) {
        const errorBody = await apiResponse.json().catch(() => apiResponse.text());
        console.error("API Error:", errorBody);
        const errorMessage = errorBody?.error?.message || JSON.stringify(errorBody);
        throw new Error(`Error de la API (${apiResponse.status}): ${errorMessage}`);
    }

    const data = await apiResponse.json();

    if (!data.choices?.[0]?.message?.content) {
        console.error("Respuesta inesperada de la API:", data);
        throw new Error("La respuesta de la API no tiene el formato esperado.");
    }

    let jsonText = data.choices[0].message.content.trim();
    
    const startIndex = jsonText.indexOf('{');
    const endIndex = jsonText.lastIndexOf('}');

    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        jsonText = jsonText.substring(startIndex, endIndex + 1);
    } else {
        console.error("No se encontró un objeto JSON válido en la respuesta:", jsonText);
        throw new Error("La respuesta del modelo para el email no contenía un objeto JSON válido.");
    }

    return jsonText;
  } catch (error) {
    console.error("Error al generar el email:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("No se pudo generar el correo. Inténtalo de nuevo.");
  }
};