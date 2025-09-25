import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { buscarClientes } from '../services/geminiService';
import type { ClientePotencial } from '../types';
import { Spinner } from '../components/Spinner';
import { ClientCard } from '../components/ClientCard';
import { generarEmail } from '../services/geminiService';
import { useGmailDraft } from '../hooks/useGmailDraft';

// --- Modals ---
const EmailModal: React.FC<{
  cliente: ClientePotencial | null;
  onClose: () => void;
}> = ({ cliente, onClose }) => {
  const { perfil, addEmail } = useAppContext();
  const [emailContent, setEmailContent] = useState({ asunto: '', cuerpo: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { createDraft, status: draftStatus, message: draftMessage } = useGmailDraft();

  const handleGenerateEmail = async () => {
    if (!cliente) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await generarEmail(cliente, perfil);
      setEmailContent(JSON.parse(result));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveAndClose = () => {
    if (!cliente) return;
    addEmail({ destinatario: cliente, cuerpo: JSON.stringify(emailContent) });
    onClose();
  };

  React.useEffect(() => {
    if (cliente) {
      handleGenerateEmail();
    } else {
        setEmailContent({ asunto: '', cuerpo: '' });
        setError('');
        setIsLoading(false);
    }
  }, [cliente]);

  if (!cliente) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <h3 className="p-5 border-b dark:border-gray-700 text-xl font-bold">Generar Email para {cliente.nombreEmpresa}</h3>
        <div className="p-6 overflow-y-auto flex-grow">
          {isLoading && <Spinner message="Generando email personalizado..." />}
          {error && <p className="text-red-500">{error}</p>}
          {!isLoading && !error && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-gray-700 dark:text-gray-300">Asunto:</label>
                <input type="text" value={emailContent.asunto} onChange={(e) => setEmailContent(p => ({...p, asunto: e.target.value}))} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label className="font-semibold text-gray-700 dark:text-gray-300">Cuerpo:</label>
                <textarea value={emailContent.cuerpo} onChange={(e) => setEmailContent(p => ({...p, cuerpo: e.target.value}))} rows={10} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 font-mono text-sm" />
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex justify-between items-center">
            <div>
                 {draftMessage && <p className={`text-sm ${draftStatus === 'success' ? 'text-green-600' : 'text-red-500'}`}>{draftMessage}</p>}
            </div>
            <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300">Cerrar</button>
                <button onClick={() => createDraft({ to: cliente.contacto.email, subject: emailContent.asunto, body: emailContent.cuerpo })} disabled={!emailContent.cuerpo || draftStatus === 'loading'} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                    Crear Borrador en Gmail
                </button>
                <button onClick={handleSaveAndClose} disabled={!emailContent.cuerpo} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400">
                    Guardar y Cerrar
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const PromptModal: React.FC<{
  cliente: ClientePotencial | null;
  onClose: () => void;
}> = ({ cliente, onClose }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!cliente) return;
    navigator.clipboard.writeText(cliente.promptSolucion).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (!cliente) return null;

  return (
     <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-bold">Prompt de Solución para {cliente.nombreEmpresa}</h3>
          <button onClick={handleCopy} className="px-3 py-1 text-sm font-semibold rounded-md flex items-center transition-colors bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600">
            {isCopied ? "¡Copiado!" : "Copiar"}
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow bg-gray-50 dark:bg-gray-900/80">
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-200">{cliente.promptSolucion}</pre>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---
export const Busqueda: React.FC = () => {
  const { perfil, addProspectos } = useAppContext();
  const [filtros, setFiltros] = useState({ pais: '', probabilidadMin: '80' });
  const [resultados, setResultados] = useState<ClientePotencial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saveMessage, setSaveMessage] = useState('');

  const [clienteParaEmail, setClienteParaEmail] = useState<ClientePotencial | null>(null);
  const [clienteParaPrompt, setClienteParaPrompt] = useState<ClientePotencial | null>(null);

  const isFormValid = filtros.pais && filtros.probabilidadMin && perfil.nombre;

  const handleSelectProspecto = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(prev => prev.size === resultados.length ? new Set() : new Set(resultados.map(p => p.id)));
  };

  const handleSaveSelected = () => {
    const selectedProspectos = resultados.filter(p => selectedIds.has(p.id));
    if (selectedProspectos.length > 0) {
      addProspectos(selectedProspectos);
      setSaveMessage(`${selectedProspectos.length} propuesta(s) guardada(s) en "Mis Prospectos".`);
      setSelectedIds(new Set());
      setTimeout(() => setSaveMessage(''), 5000);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
        setError('Por favor, completa todos los campos y configura tu perfil.');
        return;
    }
    
    setIsLoading(true);
    setError('');
    setResultados([]);
    setSelectedIds(new Set());

    try {
      const probMin = parseInt(filtros.probabilidadMin, 10);
      if (isNaN(probMin) || probMin < 1 || probMin > 100) {
        setError("La probabilidad mínima debe ser un número entre 1 y 100.");
        setIsLoading(false);
        return;
      }
      const clientes = await buscarClientes(filtros.pais, probMin);
      setResultados(clientes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al buscar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8 mb-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Generador de Propuestas de IA</h2>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label htmlFor="pais" className="block text-sm font-medium text-gray-700 dark:text-gray-300">País</label>
            <input type="text" id="pais" value={filtros.pais} onChange={e => setFiltros(prev => ({ ...prev, pais: e.target.value}))} placeholder="Ej: Guatemala, México" className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
          </div>
          <div>
            <label htmlFor="probabilidadMin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Probabilidad Mín. (%)</label>
            <input 
              type="number" 
              id="probabilidadMin" 
              name="probabilidadMin"
              value={filtros.probabilidadMin} 
              onChange={e => setFiltros(prev => ({ ...prev, probabilidadMin: e.target.value }))} 
              placeholder="Ej: 80" 
              min="1" 
              max="100"
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
              required 
            />
          </div>
          <button type="submit" disabled={!isFormValid || isLoading} className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
            {isLoading ? 'Generando...' : 'Generar Prospectos'}
          </button>
        </form>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        {!perfil.nombre && <p className="text-yellow-600 mt-4">Advertencia: Debes configurar tu perfil para poder generar correos.</p>}
      </div>

      {isLoading && <Spinner message="Investigando empresas y generando propuestas de IA..." />}

      {resultados.length > 0 && (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-4">
                  <div className="text-lg font-semibold text-gray-800 dark:text-white">
                      <span>{selectedIds.size} de {resultados.length} seleccionados</span>
                  </div>
                  <button onClick={handleSelectAll} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700">
                      {selectedIds.size === resultados.length ? 'Deseleccionar' : 'Seleccionar Todos'}
                  </button>
              </div>
              <button onClick={handleSaveSelected} disabled={selectedIds.size === 0} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
                  Guardar en "Mis Prospectos"
              </button>
            </div>
             {saveMessage && <p className="text-center text-green-600 dark:text-green-400 mb-4">{saveMessage}</p>}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {resultados.map((cliente) => (
                <ClientCard 
                  key={cliente.id} 
                  cliente={cliente} 
                  isSelected={selectedIds.has(cliente.id)}
                  onSelect={handleSelectProspecto}
                  onGenerateEmail={setClienteParaEmail}
                  onShowPrompt={setClienteParaPrompt}
                />
            ))}
            </div>
        </div>
      )}
    </div>
    <EmailModal cliente={clienteParaEmail} onClose={() => setClienteParaEmail(null)} />
    <PromptModal cliente={clienteParaPrompt} onClose={() => setClienteParaPrompt(null)} />
    </>
  );
};