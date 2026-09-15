import React from 'react';
import { BookOpen, ReceiptText, Settings, CheckCircle2 } from 'lucide-react';
import { PerfilAbogado } from '../types';

export interface HeaderPrincipalProps {
  vistaActual: 'home' | 'wizard' | 'config-leyes' | 'config-honorarios' | 'config-general';
  onNavegar: (vista: 'home' | 'wizard' | 'config-leyes' | 'config-honorarios' | 'config-general') => void;
  perfilAbogado: PerfilAbogado;
  sesionActiva: boolean;
  notificacion?: string | null;
}

export const HeaderPrincipal: React.FC<HeaderPrincipalProps> = ({
  vistaActual,
  onNavegar,
  perfilAbogado,
  sesionActiva,
  notificacion,
}) => {
  const formatearNombreAbogado = (nombre: string) => {
    if (!nombre) return 'Dr. Abogado Titular';
    const nombreLimpio = nombre.trim();
    if (nombreLimpio.toLowerCase().startsWith('dr.') || nombreLimpio.toLowerCase().startsWith('dra.')) {
      return nombreLimpio;
    }
    return `Dr. ${nombreLimpio}`;
  };

  return (
    <header className="bg-slate-900 text-white px-6 py-2.5 flex items-center justify-between border-b border-slate-800 shrink-0 z-20 shadow-xs select-none">
      {/* 1. Nombre de la aplicación */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          id="hdr-btn-logo-inicio"
          onClick={() => onNavegar('home')}
          className="flex items-center gap-2.5 hover:opacity-90 transition cursor-pointer text-left focus:outline-none"
          title="Ir al inicio de Gestor de Bienes"
        >
          <div className="w-7 h-7 rounded bg-white text-slate-950 flex items-center justify-center font-serif font-bold text-base shadow-xs">
            §
          </div>
          <h1 className="text-sm font-bold tracking-wider uppercase font-serif text-slate-50 flex items-center gap-2">
            Gestor de Bienes
          </h1>
        </button>
      </div>

      {/* 2. Navegación Principal Única y Perfil Profesional */}
      <div className="flex items-center gap-2">
        {/* Botón 1: Leyes */}
        <button
          type="button"
          id="hdr-btn-leyes"
          onClick={() => onNavegar('config-leyes')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
            vistaActual === 'config-leyes'
              ? 'bg-white text-slate-950 border-white shadow-xs'
              : 'bg-slate-800/80 text-slate-200 hover:text-white hover:bg-slate-800 border-slate-700'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Leyes</span>
        </button>

        {/* Botón 2: Honorarios y Costos */}
        <button
          type="button"
          id="hdr-btn-honorarios"
          onClick={() => onNavegar('config-honorarios')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
            vistaActual === 'config-honorarios'
              ? 'bg-white text-slate-950 border-white shadow-xs'
              : 'bg-slate-800/80 text-slate-200 hover:text-white hover:bg-slate-800 border-slate-700'
          }`}
        >
          <ReceiptText className="w-3.5 h-3.5" />
          <span>Honorarios y Costos</span>
        </button>

        {/* Botón 3: Configuración */}
        <button
          type="button"
          id="hdr-btn-configuracion"
          onClick={() => onNavegar('config-general')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
            vistaActual === 'config-general'
              ? 'bg-white text-slate-950 border-white shadow-xs'
              : 'bg-slate-800/80 text-slate-200 hover:text-white hover:bg-slate-800 border-slate-700'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Configuración</span>
        </button>

        {/* Separador vertical */}
        <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

        {/* Perfil del Abogado con prefijo "Dr." */}
        <button
          type="button"
          id="hdr-btn-perfil-usuario"
          onClick={() => onNavegar('config-general')}
          className="hidden sm:inline-flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer"
          title="Ver perfil profesional del abogado"
        >
          <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center text-[10px] font-bold">
            {perfilAbogado.nombre ? perfilAbogado.nombre.charAt(0).toUpperCase() : 'D'}
          </div>
          <span className="truncate max-w-[150px]">
            {formatearNombreAbogado(perfilAbogado.nombre)}
          </span>
          {sesionActiva && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Sesión activa" />}
        </button>
      </div>

      {/* Notificación flotante superior tipo toast */}
      {notificacion && (
        <div className="text-xs bg-emerald-950 text-emerald-300 px-3 py-1 rounded-full border border-emerald-700/60 flex items-center gap-1.5 animate-fadeIn fixed bottom-4 right-4 shadow-lg z-50">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{notificacion}</span>
        </div>
      )}
    </header>
  );
};
