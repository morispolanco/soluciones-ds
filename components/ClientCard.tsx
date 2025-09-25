
import React from 'react';
import { Link } from 'react-router-dom';
import type { ClientePotencial } from '../types';

interface ClientCardProps {
  cliente: ClientePotencial;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onGenerateEmail: (cliente: ClientePotencial) => void;
  onShowPrompt: (cliente: ClientePotencial) => void;
  showCheckbox?: boolean;
}

export const ClientCard: React.FC<ClientCardProps> = ({ cliente, isSelected, onSelect, onGenerateEmail, onShowPrompt, showCheckbox = true }) => {
  
  const getScoreColor = (score: number) => {
    if (score > 89) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  };
  
  return (
    <div onClick={() => onSelect(cliente.id)} className={`relative bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 flex flex-col h-full cursor-pointer transition-all duration-300 ${isSelected ? 'ring-2 ring-blue-500 shadow-xl' : 'hover:shadow-xl hover:-translate-y-1'}`}>
      
      {showCheckbox && (
         <div className="absolute top-4 right-4 z-10">
            <input
                type="checkbox"
                checked={isSelected}
                readOnly
                aria-hidden="true"
                className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
            />
        </div>
      )}
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-4">
          <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">{cliente.nombreEmpresa}</h3>
          <p className="font-semibold text-gray-800 dark:text-gray-200">{cliente.contacto.nombre} - <span className="font-normal text-sm">{cliente.contacto.cargo}</span></p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{cliente.contacto.email}</p>
        </div>
        <div className="text-center flex-shrink-0">
            <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full ${getScoreColor(cliente.probabilidadContratacion)}`}>
                {cliente.probabilidadContratacion}%
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Aceptación</p>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-4 mb-4 flex-grow">
        <div>
          <h4 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Necesidad Detectada</h4>
          <p className="mt-1 text-gray-700 dark:text-gray-300 text-sm line-clamp-3 bg-yellow-50 dark:bg-gray-700/50 p-2 rounded-md">{cliente.analisisNecesidad}</p>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">Solución Propuesta</h4>
          <p className="mt-1 text-gray-700 dark:text-gray-300 text-sm line-clamp-3 bg-blue-50 dark:bg-gray-900/50 p-2 rounded-md">{cliente.solucionPropuesta}</p>
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="mt-auto border-t border-gray-200 dark:border-gray-700 pt-4 flex items-center justify-between gap-2">
        <Link to={`/prospecto/${cliente.id}`} onClick={e => e.stopPropagation()} className="font-semibold text-sm text-blue-600 hover:text-blue-700">
            Ver Detalles &rarr;
        </Link>
        <div className="flex gap-2">
            <button onClick={(e) => { e.stopPropagation(); onShowPrompt(cliente); }} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
                Ver Prompt
            </button>
            <button onClick={(e) => { e.stopPropagation(); onGenerateEmail(cliente); }} className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                Generar Email
            </button>
        </div>
      </div>
    </div>
  );
};
