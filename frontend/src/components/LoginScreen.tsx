import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Info,
  Shield,
  KeyRound,
  Copy,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { PerfilAbogado } from '../types';
import { iniciarSesionEnBackend, recuperarAccesoEnBackend } from '../utils/api';
import { guardarTokenSesion, guardarPerfilAbogado } from '../utils/storage';

interface LoginScreenProps {
  perfil: PerfilAbogado;
  onIniciarSesion: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  perfil,
  onIniciarSesion,
}) => {
  const [emailLogin, setEmailLogin] = useState<string>('');
  const [pinLogin, setPinLogin] = useState<string>('');
  const [mostrarPin, setMostrarPin] = useState<boolean>(false);
  const [recordarSesion, setRecordarSesion] = useState<boolean>(false);
  const [errorLogin, setErrorLogin] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);

  // Recuperación de acceso
  const [modoRecuperacion, setModoRecuperacion] = useState<boolean>(false);
  const [codigoRecuperacion, setCodigoRecuperacion] = useState<string>('');
  const [nuevoPin, setNuevoPin] = useState<string>('');
  const [mostrarNuevoPin, setMostrarNuevoPin] = useState<boolean>(false);
  const [exitoRecuperacion, setExitoRecuperacion] = useState<string | null>(null);

  // Código de recuperación generado al crear la cuenta (se muestra una única vez)
  const [codigoMostrar, setCodigoMostrar] = useState<string | null>(null);
  const [codigoCopiado, setCodigoCopiado] = useState<boolean>(false);

  const handlePinChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>> = setPinLogin,
  ) => {
    const rawVal = e.target.value;
    // Filtrar para aceptar estrictamente dígitos numéricos y limitar a 6 dígitos
    const digitsOnly = rawVal.replace(/\D/g, '').slice(0, 6);
    setter(digitsOnly);
    if (errorLogin) setErrorLogin(null);
  };

  const handlePinKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    valorActual: string = pinLogin,
  ) => {
    // Permitir teclas de navegación, control y edición estándar
    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Enter',
      'Home',
      'End',
    ];
    if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
      return;
    }
    // Bloquear inmediatamente si no es un dígito
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    // Bloquear si ya tiene 6 dígitos y no hay selección de texto para reemplazar
    const input = e.currentTarget;
    const hasSelection = (input.selectionEnd ?? 0) - (input.selectionStart ?? 0) > 0;
    if (valorActual.length >= 6 && !hasSelection) {
      e.preventDefault();
    }
  };

  const autenticar = async (correo: string, pin: string) => {
    setErrorLogin(null);
    if (!correo.trim()) {
      setErrorLogin('Por favor ingrese su correo electrónico profesional o nombre de usuario.');
      return;
    }
    if (!pin) {
      setErrorLogin('Por favor ingrese el PIN de seguridad.');
      return;
    }

    setEnviando(true);
    try {
      const resultado = await iniciarSesionEnBackend(correo, pin);
      // Persistir la sesión del backend para futuras peticiones autenticadas
      guardarTokenSesion(resultado.token);
      guardarPerfilAbogado(resultado.abogado);
      if (resultado.codigoRecuperacion) {
        setCodigoMostrar(resultado.codigoRecuperacion);
      } else {
        onIniciarSesion();
      }
    } catch (e) {
      setErrorLogin(e instanceof Error ? e.message : 'No se pudo iniciar sesión con el servidor.');
    } finally {
      setEnviando(false);
    }
  };

  const recuperar = async (correo: string, codigo: string, pinNuevo: string) => {
    setErrorLogin(null);
    setExitoRecuperacion(null);
    if (!correo.trim()) {
      setErrorLogin('Ingrese el correo de la cuenta para recuperar el acceso.');
      return;
    }
    if (!codigo.trim()) {
      setErrorLogin('Ingrese el código de recuperación.');
      return;
    }
    if (pinNuevo && !/^\d{6}$/.test(pinNuevo)) {
      setErrorLogin('El nuevo PIN debe tener exactamente 6 dígitos.');
      return;
    }

    setEnviando(true);
    try {
      const resultado = await recuperarAccesoEnBackend(correo, codigo, pinNuevo || undefined);
      setExitoRecuperacion(resultado.mensaje);
      setCodigoRecuperacion('');
      setNuevoPin('');
      setPinLogin('');
      setModoRecuperacion(false);
    } catch (e) {
      setErrorLogin(e instanceof Error ? e.message : 'No se pudo recuperar el acceso.');
    } finally {
      setEnviando(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (modoRecuperacion) {
      recuperar(emailLogin, codigoRecuperacion, nuevoPin);
    } else {
      autenticar(emailLogin, pinLogin);
    }
  };

  const copiarCodigo = async () => {
    if (!codigoMostrar) return;
    try {
      await navigator.clipboard.writeText(codigoMostrar);
      setCodigoCopiado(true);
    } catch {
      setCodigoCopiado(false);
    }
  };

  const continuarTrasCodigo = () => {
    setCodigoMostrar(null);
    setCodigoCopiado(false);
    onIniciarSesion();
  };

  return (
    <div className="min-h-screen w-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo y Nombre de la Aplicación */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-slate-900 shadow-sm p-2">
            <img
              src="/icon.png"
              alt="Gestor de Bienes"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-xl font-bold tracking-wider uppercase font-serif text-slate-900">
            Gestor de Bienes
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Sistema Notarial y Judicial de Partición Patrimonial
          </p>
        </div>

        {/* Tarjeta de Inicio de Sesión Profesional */}
        <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-10 shadow-xs space-y-6">
          <div className="text-center space-y-2 border-b border-slate-100 pb-4 flex flex-col items-center">
            {perfil.fotoPerfil ? (
              <img
                src={perfil.fotoPerfil}
                alt={perfil.nombre || 'Foto del Abogado'}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 shadow-2xs mb-1"
              />
            ) : null}
            <h2 className="text-base font-bold text-slate-900 font-serif">
              {modoRecuperacion ? 'Recuperar Acceso' : 'Inicio de Sesión'}
            </h2>
            {modoRecuperacion && (
              <p className="text-[11px] text-slate-500 text-center">
                Ingrese su correo y el código de recuperación generado al crear la cuenta.
              </p>
            )}
          </div>

          {errorLogin && (
            <div className="p-3 bg-slate-50 border border-slate-400 rounded-lg text-xs text-slate-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
              <span>{errorLogin}</span>
            </div>
          )}

          {exitoRecuperacion && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <span>{exitoRecuperacion}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-standalone-email"
                className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-slate-700" />
                <span>Correo Electrónico</span>
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

            {!modoRecuperacion ? (
              <>
                {/* PIN de Seguridad (6 dígitos) */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-standalone-pin"
                    className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-700" />
                    <span>PIN de Seguridad (6 dígitos)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="login-standalone-pin"
                      type={mostrarPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={pinLogin}
                      onChange={handlePinChange}
                      onKeyDown={handlePinKeyDown}
                      placeholder="••••••"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 pr-20 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs tracking-widest"
                      autoComplete="off"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPin(!mostrarPin)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors select-none"
                      title={mostrarPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                    >
                      {mostrarPin ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Ocultar</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Mostrar</span>
                        </>
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
              </>
            ) : (
              <>
                {/* Código de recuperación */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-recuperacion-codigo"
                    className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-slate-700" />
                    <span>Código de Recuperación</span>
                  </label>
                  <input
                    id="login-recuperacion-codigo"
                    type="text"
                    value={codigoRecuperacion}
                    onChange={(e) => {
                      setCodigoRecuperacion(e.target.value.toUpperCase());
                      if (errorLogin) setErrorLogin(null);
                    }}
                    placeholder="XXXXX-XXXXX-XXXXX"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs tracking-wider"
                    autoComplete="off"
                    required
                  />
                </div>

                {/* Nuevo PIN opcional */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-recuperacion-pin"
                    className="text-xs font-bold text-slate-700 flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-700" />
                    <span>Nuevo PIN (opcional, 6 dígitos)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="login-recuperacion-pin"
                      type={mostrarNuevoPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={nuevoPin}
                      onChange={(e) => handlePinChange(e, setNuevoPin)}
                      onKeyDown={(e) => handlePinKeyDown(e, nuevoPin)}
                      placeholder="Déjelo vacío para conservar el PIN actual"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3.5 pr-20 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs tracking-widest placeholder:tracking-normal"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarNuevoPin(!mostrarNuevoPin)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors select-none"
                      title={mostrarNuevoPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                    >
                      {mostrarNuevoPin ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Ocultar</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Mostrar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="submit"
                id={modoRecuperacion ? 'btn-recuperar-acceso' : 'btn-iniciar-sesion'}
                disabled={enviando}
                className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {modoRecuperacion ? (
                  <KeyRound className="w-3.5 h-3.5" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
                <span>
                  {enviando
                    ? modoRecuperacion
                      ? 'Verificando código...'
                      : 'Verificando credenciales...'
                    : modoRecuperacion
                      ? 'Recuperar Acceso'
                      : 'Iniciar Sesión'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModoRecuperacion(!modoRecuperacion);
                  setErrorLogin(null);
                  setExitoRecuperacion(null);
                }}
                className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                {modoRecuperacion ? (
                  <>
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver al inicio de sesión</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>¿Olvidó su PIN? Recuperar acceso</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer institucional discreto */}
        <div className="text-center text-[11px] text-slate-500 flex flex-col items-center justify-center gap-1.5">
          <span className="flex items-center justify-center gap-2">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Acceso restringido a profesionales del derecho • C.C. y C.G.P.</span>
          </span>
          <span className="flex items-center justify-center gap-1.5 text-slate-600">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Herramienta de apoyo: no reemplaza la revisión de un abogado.</span>
          </span>
        </div>
      </div>

      {codigoMostrar && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-300 rounded-xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3 border-b border-slate-200 pb-3">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Guarde su código de recuperación
                </h3>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Este código se muestra una sola vez. Le permitirá recuperar el acceso si olvida
                  su PIN o la cuenta se bloquea tras 5 intentos fallidos.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-between gap-3">
              <code className="font-mono font-bold text-sm text-slate-900 tracking-wider break-all">
                {codigoMostrar}
              </code>
              <button
                type="button"
                onClick={copiarCodigo}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-300 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Copiar código"
              >
                {codigoCopiado ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 leading-relaxed">
              Guárdelo en un lugar seguro. No se volverá a mostrar y no es posible consultarlo
              nuevamente desde la aplicación.
            </p>

            <button
              type="button"
              onClick={continuarTrasCodigo}
              className="w-full bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-3.5 h-3.5" />
              <span>He guardado el código, continuar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

