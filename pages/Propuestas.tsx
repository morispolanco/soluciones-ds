
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import type { ClientePotencial, EmailGenerado } from '../types';
import { Link } from 'react-router-dom';

interface Propuesta {
  prospecto: ClientePotencial;
  email: EmailGenerado;
}

const ProposalCard: React.FC<{ propuesta: Propuesta }> = ({ propuesta }) => {
  const { prospecto, email } = propuesta;
  const [isPromptVisible, setIsPromptVisible] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-4">
          <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">{prospecto.nombreEmpresa}</h3>
          <p className="font-semibold text-gray-800 dark:text-gray-200">{prospecto.contacto.nombre}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{prospecto.contacto.email}</p>
        </div>
        <div className="text-right ml-4 flex-shrink-0">
          <p className="text-xs text-gray-500 dark:text-gray-400">Email Generado</p>
          <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
            {new Date(email.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Prompt Section */}
      <div className="space-y-2 mb-4 flex-grow">
        <h4 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Propuesta de Prompt de IA</h4>
        <div className="mt-1 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-md flex flex-col">
            {isPromptVisible && (
                 <pre className="whitespace-pre-wrap font-mono text-xs text-gray-600 dark:text-gray-300 p-3 max-h-40 overflow-y-auto">
                    {prospecto.promptSolucion}
                </pre>
            )}
            <button 
                onClick={() => setIsPromptVisible(!isPromptVisible)} 
                className="w-full text-center px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-b-md flex items-center justify-center gap-1"
            >
                {isPromptVisible ? (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                    Ocultar Prompt
                    </>
                ) : (
                    <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    Mostrar Prompt
                    </>
                )}
            </button>
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="mt-auto border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-end">
        <Link to={`/prospecto/${prospecto.id}`} className="font-semibold text-sm text-blue-600 hover:text-blue-700">
            Ver Detalles Completos &rarr;
        </Link>
      </div>
    </div>
  );
};


export const Propuestas: React.FC = () => {
  const { prospectos, emails } = useAppContext();

  const propuestas = useMemo(() => {
    const prospectosMap = new Map(prospectos.map(p => [p.id, p]));
    const latestEmails = new Map<string, EmailGenerado>();

    emails.forEach(email => {
      const prospectoId = email.destinatario.id;
      const existingEmail = latestEmails.get(prospectoId);
      if (!existingEmail || new Date(email.fecha) > new Date(existingEmail.fecha)) {
        latestEmails.set(prospectoId, email);
      }
    });

    const combinedData: Propuesta[] = [];
    latestEmails.forEach((email, prospectoId) => {
      const prospecto = prospectosMap.get(prospectoId);
      if (prospecto) {
        combinedData.push({ prospecto, email });
      }
    });

    return combinedData.sort((a, b) => new Date(b.email.fecha).getTime() - new Date(a.email.fecha).getTime());
  }, [prospectos, emails]);

  if (propuestas.length === 0) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">No hay propuestas con email generado</h2>
          <p className="text-gray-500 dark:text-gray-400">Cuando generes un email para un prospecto, su ficha aparecerá aquí.</p>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Puedes generar emails desde la página de 'Búsqueda' o 'Prospectos'.</p>
          <Link to="/busqueda" className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">
            Buscar Prospectos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Fichas de Propuestas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {propuestas.map((propuesta) => (
          <ProposalCard key={propuesta.prospecto.id} propuesta={propuesta} />
        ))}
      </div>
    </div>
  );
};
