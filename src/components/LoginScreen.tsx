import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Sparkles, Info, Shield } from 'lucide-react';
import { PerfilAbogado } from '../types';

interface LoginScreenProps {
  perfil: PerfilAbogado;
  onIniciarSesion: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  perfil,
  onIniciarSesion,
}) => {
  const [emailLogin, setEmailLogin] = useState<string>(
    perfil.correo || 'alejandro.restrepo@gestordebienes.legal'
  );
  const [passwordLogin, setPasswordLogin] = useState<string>('••••••••');
  const [mostrarPassword, setMostrarPassword] = useState<boolean>(false);
  const [recordarSesion, setRecordarSesion] = useState<boolean>(true);
  const [errorLogin, setErrorLogin] = useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailLogin.trim()) {
      setErrorLogin('Por favor ingrese su correo electrónico profesional o nombre de usuario.');
      return;
    }
    setErrorLogin(null);
    onIniciarSesion();
  };

  const handleAccesoRapido = () => {
    setEmailLogin(perfil.correo || 'alejandro.restrepo@gestordebienes.legal');
    setPasswordLogin('abogado2026');
    setErrorLogin(null);
    onIniciarSesion();
  };

  return (
    <div className="min-h-screen w-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Logo y Nombre de la Aplicación */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white font-serif font-bold text-2xl shadow-sm">
            §
          </div>
          <h1 className="text-xl font-bold tracking-wider uppercase font-serif text-slate-900">
            Gestor de Bienes
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Sistema Notarial y Judicial de Partición Patrimonial
          </p>
        </div>

        {/* Tarjeta de Inicio de Sesión Profesional */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="text-center space-y-1.5 border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Inicio de Sesión Profesional
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              Ingrese las credenciales del abogado para gestionar expedientes patrimoniales y firmar liquidaciones oficiales.
            </p>
          </div>

          {errorLogin && (
            <div className="p-3 bg-slate-50 border border-slate-400 rounded-lg text-xs text-slate-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
              <span>{errorLogin}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-standalone-email"
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-slate-700" />
                <span>Correo Electrónico o Usuario</span>
              </label>
              <input
                id="login-standalone-email"
                type="text"
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
                placeholder="abogado@despacho.legal"
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="login-standalone-password"
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-slate-700" />
                <span>Contraseña o PIN de Seguridad</span>
              </label>
              <div className="relative">
                <input
                  id="login-standalone-password"
                  type={mostrarPassword ? 'text' : 'password'}
                  value={passwordLogin}
                  onChange={(e) => setPasswordLogin(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-300 rounded-lg pl-3.5 pr-9 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 cursor-pointer"
                  title={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {mostrarPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={recordarSesion}
                  onChange={(e) => setRecordarSesion(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span>Recordar sesión en este equipo</span>
              </label>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="submit"
                id="btn-iniciar-sesion"
                className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Iniciar Sesión</span>
              </button>

              <button
                type="button"
                id="btn-acceso-rapido"
                onClick={handleAccesoRapido}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-2 px-4 rounded-lg text-xs transition-colors border border-slate-300 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                <span>Acceso Rápido como {perfil.nombre || 'Abogado Titular'}</span>
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 text-center leading-relaxed">
            Almacenamiento local seguro en el navegador. La información del abogado se incorpora automáticamente en la carátula y el pie de firma de los reportes PDF.
          </div>
        </div>

        {/* Footer institucional discreto */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
          <span>Acceso restringido a profesionales del derecho • C.C. y C.G.P.</span>
        </div>
      </div>
    </div>
  );
};
