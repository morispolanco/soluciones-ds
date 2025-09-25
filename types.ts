
export interface PerfilUsuario {
  nombre: string;
  email: string;
  paginaWeb: string;
}

export interface ClientePotencial {
  id: string;
  nombreEmpresa: string;
  paginaWeb: string;
  contacto: {
    nombre: string;
    cargo: string;
    email: string;
    telefono: string;
    emailVerificado: boolean;
  };
  ubicacion: string;
  sector: string;
  direccionCompleta: string;
  analisisNecesidad: string;
  solucionPropuesta: string;
  promptSolucion: string;
  probabilidadContratacion: number;
  calificacion: {
    puntuacion: number;
    reseñas: number;
  };
  fechaAgregado: string;
}

export interface EmailGenerado {
  id: string;
  destinatario: ClientePotencial;
  cuerpo: string;
  fecha: string;
}

export interface LlamadaRegistrada {
  id: string;
  prospectoId: string;
  fecha: string; // ISO string date
  resultado: 'Interesado' | 'No Interesado' | 'Buzón de voz' | 'Seguimiento' | 'Contacto realizado' | 'Otro';
  notas: string;
}

// FIX: Add Servicio interface to resolve missing type error in pages/Servicios.tsx
export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
}

export interface User {
  id: string;
  nombre: string;
  email: string;
}
