import React, { useState } from 'react';
import { 
  registerCustomUser, 
  loginCustomUser, 
  requestPasswordReset, 
  requestEmailRecovery 
} from '../lib/customAuthService';
import { Icon } from './Icon';

interface EmailAuthProps {
  onLoginSuccess: (user: { email: string; name: string; id: string }) => void;
  onNotification: (title: string, desc: string) => void;
}

type AuthMode = 'login' | 'register' | 'recovery_select' | 'recovery_password' | 'recovery_email';

export function EmailAuth({ onLoginSuccess, onNotification }: EmailAuthProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secondaryEmail, setSecondaryEmail] = useState('');
  const [name, setName] = useState('');
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showTechnicalSpecs, setShowTechnicalSpecs] = useState(false);

  // Recovery simulation outputs
  const [simulatedResetLink, setSimulatedResetLink] = useState('');
  const [recoveredEmails, setRecoveredEmails] = useState<string[]>([]);

  const handleResetForm = () => {
    setErrorMessage('');
    setSuccessMessage('');
    setSimulatedResetLink('');
    setRecoveredEmails([]);
  };

  const validateEmail = (mailStr: string): boolean => {
    return /^[^@]+@[^@]+\.[^@]+$/.test(mailStr.trim());
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        // Standard validations
        if (!email.trim() || !password) {
          throw new Error('Todos los campos son obligatorios.');
        }
        if (!validateEmail(email)) {
          throw new Error('Formato de correo electrónico no válido.');
        }

        const res = await loginCustomUser(email, password);
        if (res.success && res.user) {
          onNotification('¡Sesión Iniciada!', `Te damos la bienvenida, ${res.user.name}.`);
          onLoginSuccess({
            email: res.user.email,
            name: res.user.name,
            id: res.user.id
          });
        }
      } else if (mode === 'register') {
        if (!email.trim() || !password || !secondaryEmail.trim() || !name.trim()) {
          throw new Error('Todos los campos son obligatorios.');
        }
        if (!validateEmail(email)) {
          throw new Error('Formato de correo electrónico principal no válido.');
        }
        if (!validateEmail(secondaryEmail)) {
          throw new Error('Formato de correo secundario/alternativo no válido.');
        }
        if (email.trim().toLowerCase() === secondaryEmail.trim().toLowerCase()) {
          throw new Error('El correo principal y secundario no pueden ser idénticos.');
        }
        if (password.length < 6) {
          throw new Error('La contraseña debe tener una longitud mínima de 6 caracteres.');
        }

        const res = await registerCustomUser(email, password, secondaryEmail, name);
        if (res.success) {
          onNotification('¡Cuenta Creada!', 'Se ha registrado tu usuario de forma segura con contraseña hasheada SHA-256.');
          setMode('login');
          // Prefill
          setPassword('');
          setSuccessMessage('Cuenta creada exitosamente. Ya puedes iniciar sesión.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ha ocurrido un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Recovery Flow (Option A)
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setSimulatedResetLink('');
    setIsLoading(true);

    try {
      if (!email.trim()) {
        throw new Error('Por favor ingresa tu correo electrónico registrado.');
      }
      if (!validateEmail(email)) {
        throw new Error('Formato de correo electrónico no válido.');
      }

      const res = await requestPasswordReset(email);
      if (res.success) {
        setSuccessMessage(res.message);
        if (res.simulatedLink) {
          setSimulatedResetLink(res.simulatedLink);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar la recuperación.');
    } finally {
      setIsLoading(false);
    }
  };

  // Custom Primary Email Recovery (Option B)
  const handleRequestEmailRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setRecoveredEmails([]);
    setIsLoading(true);

    try {
      if (!secondaryEmail.trim()) {
        throw new Error('Por favor ingresa tu correo electrónico alternativo.');
      }
      if (!validateEmail(secondaryEmail)) {
        throw new Error('Formato de correo alternativo no válido.');
      }

      const res = await requestEmailRecovery(secondaryEmail);
      if (res.success) {
        setSuccessMessage(res.message);
        if (res.foundEmails && res.foundEmails.length > 0) {
          setRecoveredEmails(res.foundEmails);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al recuperar cuentas.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm" id="email-auth-box">
      <div className="bg-white rounded-3xl p-8 shadow-2xl border border-white/80 text-brand-dark transition-all duration-300">
        
        {/* Back Link / Mode Header */}
        {mode !== 'login' && (
          <button
            onClick={() => {
              setMode('login');
              handleResetForm();
            }}
            type="button"
            className="flex items-center gap-1.5 text-xs font-bold text-brand-malva hover:text-brand-dark transition-colors mb-4 cursor-pointer"
          >
            <Icon name="ArrowLeft" size={13} />
            Volver al Inicio de Sesión
          </button>
        )}

        {/* Title Dynamic Section */}
        {mode === 'login' && (
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2 justify-center">
              <Icon name="Unlock" className="text-brand-malva" size={18} />
              Ingresar con mi Email
            </h2>
            <p className="text-xs text-brand-dark/65 mt-1">
              Accede a tus hábitos e insignias de forma persistente.
            </p>
          </div>
        )}

        {mode === 'register' && (
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2 justify-center">
              <Icon name="UserPlus" className="text-brand-malva" size={19} />
              Crear Nueva Cuenta
            </h2>
            <p className="text-xs text-brand-dark/65 mt-1">
              Regístrate con tu correo principal y establece un respaldo alternativo.
            </p>
          </div>
        )}

        {mode === 'recovery_select' && (
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2 justify-center">
              <Icon name="HelpCircle" className="text-brand-malva" size={19} />
              Asociación y Soporte
            </h2>
            <p className="text-xs text-brand-dark/65 mt-1">
              ¿Qué credencial necesitas recuperar? Elige tu opción:
            </p>
          </div>
        )}

        {mode === 'recovery_password' && (
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-1.5 justify-center">
              <Icon name="Key" className="text-brand-malva" size={18} />
              Recuperar mi Contraseña
            </h2>
            <p className="text-xs text-brand-dark/65 mt-1">
              Te enviaremos un token temporal de restauración.
            </p>
          </div>
        )}

        {mode === 'recovery_email' && (
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-1.5 justify-center">
              <Icon name="MailCheck" className="text-brand-malva animate-pulse" size={18} />
              Recuperar mi Correo Principal
            </h2>
            <p className="text-xs text-brand-dark/65 mt-1">
              Buscaremos tus correos vinculados al alternativo de respaldo.
            </p>
          </div>
        )}

        {/* Dynamic validation and status alerts */}
        {errorMessage && (
          <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-3 text-xs mb-4 flex items-start gap-2 animate-in fade-in">
            <Icon name="AlertCircle" size={15} className="mt-0.5 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl p-3 text-xs mb-4 flex items-start gap-2 animate-in fade-in">
            <Icon name="CheckCircle2" size={15} className="mt-0.5 shrink-0" />
            <div className="font-semibold leading-relaxed">{successMessage}</div>
          </div>
        )}

        {/* 1. LOGIN & REGISTRATION FORMS */}
        {(mode === 'login' || mode === 'register') && (
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {/* Display Name (Only during registration) */}
            {mode === 'register' && (
              <div>
                <label className="block text-[10px] font-extrabold text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                  Tu nombre completo
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-dark/45 pointer-events-none">
                    <Icon name="User" size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Sofía Alarcón"
                    className="w-full pl-10 pr-3 py-3 bg-brand-malva-light/20 border border-brand-malva-light rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-malva focus:ring-1 focus:ring-brand-malva text-brand-dark placeholder:text-brand-dark/40 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Main Email Input */}
            <div>
              <label className="block text-[10px] font-extrabold text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                Ingresa tu correo electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-dark/45 pointer-events-none">
                  <Icon name="Mail" size={14} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu-correo@ejemplo.com"
                  className="w-full pl-10 pr-3 py-3 bg-brand-malva-light/20 border border-brand-malva-light rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-malva focus:ring-1 focus:ring-brand-malva text-brand-dark placeholder:text-brand-dark/40 transition-colors"
                />
              </div>
            </div>

            {/* Custom password Input with show toggle */}
            <div>
              <label className="block text-[10px] font-extrabold text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                Ingresa tu contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-dark/45 pointer-events-none">
                  <Icon name="Lock" size={14} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-brand-malva-light/20 border border-brand-malva-light rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-malva focus:ring-1 focus:ring-brand-malva text-brand-dark placeholder:text-brand-dark/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-dark/40 hover:text-brand-dark cursor-pointer"
                >
                  <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={15} />
                </button>
              </div>
            </div>

            {/* Secondary alternative backup Email (Only during registration) */}
            {mode === 'register' && (
              <div>
                <label className="block text-[10px] font-extrabold text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                  Soporte: Correo Electrónico Secundario
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-dark/45 pointer-events-none">
                    <Icon name="Settings" size={14} />
                  </span>
                  <input
                    type="email"
                    required
                    value={secondaryEmail}
                    onChange={(e) => setSecondaryEmail(e.target.value)}
                    placeholder="alternativo-respaldo@ejemplo.com"
                    className="w-full pl-10 pr-3 py-3 bg-brand-malva-light/20 border border-brand-malva-light rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-malva focus:ring-1 focus:ring-brand-malva text-brand-dark placeholder:text-brand-dark/40 transition-colors"
                  />
                </div>
                <p className="text-[10px] text-brand-dark/50 mt-1.5 leading-relaxed font-semibold">
                  * Requerido para recuperar tu correo de inicio si lo olvidas en el futuro.
                </p>
              </div>
            )}

            {/* Action Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-meditation-gradient text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-brand-dark/15 disabled:opacity-50"
            >
              {isLoading ? (
                <Icon name="Loader2" className="animate-spin" size={14} />
              ) : mode === 'login' ? (
                <>
                  <Icon name="LogIn" size={14} />
                  Iniciar Sesión
                </>
              ) : (
                <>
                  <Icon name="UserPlus" size={14} />
                  Completar Registro Seguro
                </>
              )}
            </button>

            {/* Links of assist/toggles */}
            <div className="flex flex-col gap-2 pt-2 text-center">
              {mode === 'login' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('recovery_select');
                      handleResetForm();
                    }}
                    className="text-xs font-bold text-brand-malva hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu correo o contraseña?
                  </button>
                  <span className="text-[10px] text-brand-dark/45">
                    ¿No tienes una cuenta aún?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        handleResetForm();
                      }}
                      className="font-bold text-brand-malva hover:underline ml-0.5 cursor-pointer"
                    >
                      Regístrate gratis
                    </button>
                  </span>
                </>
              ) : (
                <span className="text-[10px] text-brand-dark/45">
                  ¿Ya estás registrado?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      handleResetForm();
                    }}
                    className="font-bold text-brand-malva hover:underline ml-0.5 cursor-pointer"
                  >
                    Inicia Sesión
                  </button>
                </span>
              )}
            </div>
          </form>
        )}

        {/* 2. RECOVERY DECISION TREE MODULE/OPTIONS */}
        {mode === 'recovery_select' && (
          <div className="space-y-4 animate-in fade-in">
            <button
              onClick={() => {
                setMode('recovery_password');
                handleResetForm();
              }}
              className="w-full p-4 hover:bg-brand-malva-light/20 border border-brand-malva-light rounded-2xl flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer group"
            >
              <div>
                <h4 className="text-sm font-bold text-brand-dark flex items-center gap-1.5 mb-1">
                  <Icon name="KeyRound" className="text-brand-malva group-hover:scale-110 transition-transform" size={15} />
                  Opción A: Olvidé mi Contraseña
                </h4>
                <p className="text-[11px] text-brand-dark/60 leading-relaxed font-semibold">
                  Ingresa tu correo registrado para recibir un enlace único temporal de cambio de clave.
                </p>
              </div>
              <Icon name="ChevronRight" size={16} className="text-brand-malva shrink-0 ml-1" />
            </button>

            <button
              onClick={() => {
                setMode('recovery_email');
                handleResetForm();
              }}
              className="w-full p-4 hover:bg-brand-malva-light/20 border border-brand-malva-light rounded-2xl flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer group"
            >
              <div>
                <h4 className="text-sm font-bold text-brand-dark flex items-center gap-1.5 mb-1">
                  <Icon name="MailQuestion" className="text-brand-malva group-hover:scale-110 transition-transform" size={15} />
                  Opción B: Olvidé mi Correo
                </h4>
                <p className="text-[11px] text-brand-dark/60 leading-relaxed font-semibold">
                  Solicita que revelemos tu correo principal enviando un aviso a tu correo alternativo.
                </p>
              </div>
              <Icon name="ChevronRight" size={16} className="text-brand-malva shrink-0 ml-1" />
            </button>
          </div>
        )}

        {/* 3. OPTION A FORM (Password reset request) */}
        {mode === 'recovery_password' && (
          <form onSubmit={handleRequestPasswordReset} className="space-y-4 animate-in fade-in">
            <div>
              <label className="block text-[10px] font-extrabold text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                Correo Electrónico Registrado
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-dark/45 pointer-events-none">
                  <Icon name="Mail" size={14} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu-correo@ejemplo.com"
                  className="w-full pl-10 pr-3 py-3 bg-brand-malva-light/20 border border-brand-malva-light rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-malva text-brand-dark placeholder:text-brand-dark/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-meditation-gradient text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <Icon name="Loader2" className="animate-spin" size={14} />
              ) : (
                <>
                  <Icon name="Send" size={14} />
                  Generar Token Seguro
                </>
              )}
            </button>

            {/* SIMULATION VISUAL BOX */}
            {simulatedResetLink && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[11px] text-brand-dark leading-relaxed animate-in zoom-in-95 mt-4">
                <div className="flex items-center gap-1.5 mb-1.5 font-bold text-amber-800">
                  <Icon name="Cpu" size={14} className="animate-bounce" />
                  Simulador de Enlace de Correo (Backend Hook)
                </div>
                <p className="font-semibold text-[10.5px]">
                  El backend detectó el usuario, generó un token temporal y redactó el correo. Haz clic en el enlace para resetear a la contraseña por defecto <strong className="text-brand-malva font-extrabold">"123456"</strong>:
                </p>
                <div className="mt-2.5 bg-zinc-900 text-amber-200 p-2 rounded-lg font-mono text-[9px] break-all border border-zinc-800">
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      alert('¡La contraseña ha sido reseteada exitosamente en Firestore a "123456"! Ahora puedes usarla para iniciar sesión.');
                      setMode('login');
                      setPassword('123456');
                      setEmail(email);
                      handleResetForm();
                    }}
                    className="hover:underline cursor-pointer"
                  >
                    {simulatedResetLink}
                  </a>
                </div>
              </div>
            )}
          </form>
        )}

        {/* 4. OPTION B FORM (Backup alternate lookup) */}
        {mode === 'recovery_email' && (
          <form onSubmit={handleRequestEmailRecovery} className="space-y-4 animate-in fade-in">
            <div>
              <label className="block text-[10px] font-extrabold text-brand-dark/70 mb-1.5 uppercase tracking-wider">
                Ingresa tu Correo Secundario de Respaldo
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-dark/45 pointer-events-none">
                  <Icon name="MailCheck" size={14} />
                </span>
                <input
                  type="email"
                  required
                  value={secondaryEmail}
                  onChange={(e) => setSecondaryEmail(e.target.value)}
                  placeholder="alternativo-respaldo@ejemplo.com"
                  className="w-full pl-10 pr-3 py-3 bg-brand-malva-light/20 border border-brand-malva-light rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-malva text-brand-dark placeholder:text-brand-dark/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-meditation-gradient text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <Icon name="Loader2" className="animate-spin" size={14} />
              ) : (
                <>
                  <Icon name="Search" size={14} />
                  Buscar Cuentas Asociadas
                </>
              )}
            </button>

            {/* SIMULATION VISUAL BOX */}
            {recoveredEmails.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-[11px] text-brand-dark leading-relaxed animate-in zoom-in-95 mt-4">
                <div className="flex items-center gap-1.5 mb-1.5 font-bold text-emerald-800">
                  <Icon name="Cpu" size={14} className="text-emerald-700" />
                  Simulador de Envío (Opción B)
                </div>
                <p className="font-semibold text-emerald-950">
                  El sistema localizó cuentas asociadas a este respaldo. El correo alternativo recibió las siguientes opciones con las que puedes iniciar de inmediato:
                </p>
                <ul className="mt-2 text-xs font-bold space-y-1 text-zinc-900 font-mono">
                  {recoveredEmails.map((elem, i) => (
                    <li key={i} className="flex items-center gap-1 justify-center bg-white p-2 border border-emerald-300 rounded-lg">
                      <Icon name="Check" size={12} className="text-emerald-700 font-black" />
                      {elem}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        )}

      </div>

      {/* FOOTER & ACCESSIBLE ARCHITECT SPEC DRAWER TOGGLE */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <button
          onClick={() => setShowTechnicalSpecs(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full text-[11px] font-bold text-brand-malva-light hover:text-white transition-all cursor-pointer shadow-md"
        >
          <Icon name="Database" size={12} />
          Especificaciones del Servidor y Base de Datos (Senior Spec)
        </button>
      </div>

      {/* FULL SCREEN DOCK/DRAWER SPEC PANEL FOR SENIOR DELIVERABLES */}
      {showTechnicalSpecs && (
        <div className="fixed inset-0 bg-black/75 z-50 overflow-y-auto p-4 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-zinc-950 text-zinc-150 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-zinc-800 shadow-2xl relative font-sans leading-relaxed my-8 max-h-[90vh] overflow-y-auto text-left">
            
            <button
              onClick={() => setShowTechnicalSpecs(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white cursor-pointer bg-zinc-900 border border-zinc-800 p-2 rounded-xl"
            >
              <Icon name="X" size={16} />
            </button>

            <div className="flex items-center gap-2 mb-2 border-b border-zinc-900 pb-3">
              <Icon name="FileCode" size={26} className="text-purple-400" />
              <div>
                <h3 className="font-black text-white text-lg leading-tight">Planos y Arquitectura Full-Stack de Autenticación</h3>
                <p className="text-[11px] text-zinc-400">Entrega del modelo de datos, la lógica del backend y los protocolos de seguridad.</p>
              </div>
            </div>

            <div className="space-y-6 text-xs text-zinc-300 font-medium">
              
              {/* Deliverable 1: DB schema */}
              <div>
                <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
                  <Icon name="Database" size={14} className="text-blue-400" />
                  1. Modelo de Datos de Credenciales (SQL / NoSQL)
                </h4>
                <p className="mb-2 text-zinc-400">
                  Para almacenar las cuentas en una base de datos relacional (ej. PostgreSQL) asegurando integridad referencial, el script SQL de creación es el siguiente:
                </p>
                <pre className="p-3 bg-zinc-900 text-emerald-400 rounded-xl font-mono text-[10px] whitespace-pre-wrap select-all border border-zinc-850">
{`CREATE TABLE custom_users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(64) NOT NULL, -- SHA-256 Hash hex string
  secondary_email VARCHAR(255) NOT NULL, -- Alternative address for recovery
  recovery_token VARCHAR(128) DEFAULT NULL, -- Expiry limit temporary link code
  recovery_token_expiry TIMESTAMP DEFAULT NULL, -- Recovery validity datetime limit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index parameters for fast lookups
CREATE INDEX idx_users_email ON custom_users(email);
CREATE INDEX idx_users_secondary_email ON custom_users(secondary_email);`}
                </pre>
              </div>

              {/* Deliverable 2: Backend Logic code */}
              <div>
                <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
                  <Icon name="Code" size={14} className="text-purple-400" />
                  2. Lógica del Servidor (Endpoints NodeJS / Express REST API)
                </h4>
                <p className="mb-2 text-zinc-400">
                  Ejemplo funcional del controlador utilizando Express e interfaces de encriptación seguras para salvaguardar el flujo:
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <pre className="p-3 bg-zinc-900 text-blue-300 rounded-xl font-mono text-[9px] whitespace-pre-wrap select-all border border-zinc-850">
{`import express from 'express';
import bcrypt from 'bcrypt'; // Alternate salted model
import crypto from 'crypto';

const router = express.Router();

/**
 * 1. POST /api/login 
 * Inicia sesión verificando credenciales hash mediante consultas seguras
 */
router.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Busca en la base de datos por correo
    const user = await db.query('SELECT * FROM custom_users WHERE email = $1', [email.toLowerCase().trim()]);
    
    // Mitigación del Timing Attack / Enumeración: 
    // Si el usuario no existe, corremos un hash falso para consumir igual tiempo de CPU
    if (user.rows.length === 0) {
      await bcrypt.compare(password, "$2b$10$FakePBKDF2HashToPreventTimingEnumAttack");
      return res.status(401).json({ success: false, error: "Credenciales inválidas." });
    }

    const matched = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!matched) {
      return res.status(401).json({ success: false, error: "Credenciales inválidas." });
    }

    res.json({
      success: true,
      user: { id: user.rows[0].id, name: user.rows[0].name, email: user.rows[0].email }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * 2. POST /api/forgot-password (Opción A)
 * Propaga un token temporal de restauración. No revela si existe o no el correo (Anti-Enumeración)
 */
router.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  const genericOutput = { success: true, message: "Si el correo está registrado, se ha enviado un enlace de recuperación." };
  
  try {
    const user = await db.query('SELECT * FROM custom_users WHERE email = $1', [email.toLowerCase().trim()]);
    if (user.rows.length === 0) {
      return res.json(genericOutput); // Anti-user enumeration
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hora de vigencia

    await db.query(
      'UPDATE custom_users SET recovery_token = $1, recovery_token_expiry = $2 WHERE id = $3',
      [token, expiry, user.rows[0].id]
    );

    // Enviar correo electrónico de forma asíncrona ...
    // mailer.sendResetLink(email, token);

    res.json(genericOutput);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal error" });
  }
});

/**
 * 3. POST /api/forgot-email (Opción B)
 * Recuperación de cuenta a través del correo alternativo de respaldo
 */
router.post('/api/forgot-email', async (req, res) => {
  const { secondaryEmail } = req.body;
  const genericOutput = { success: true, message: "Se ha remitido un mail con los correos vinculados a tu dirección alternativa de respaldo." };

  try {
    const users = await db.query('SELECT email FROM custom_users WHERE secondary_email = $1', [secondaryEmail.toLowerCase().trim()]);
    if (users.rows.length === 0) {
      return res.json(genericOutput);
    }

    const emailList = users.rows.map(row => row.email);
    // Envia correo electrónico con la lista ...
    // mailer.sendEmailsRecovery(secondaryEmail, emailList);

    res.json(genericOutput);
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal error" });
  }
});`}
                  </pre>
                </div>
              </div>

              {/* Deliverable 3: Security points */}
              <div>
                <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-1.5">
                  <Icon name="ShieldAlert" size={14} className="text-emerald-400" />
                  3. Lineamientos y Mejores Prácticas de Seguridad Aplicadas
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-zinc-400 text-[11px] font-semibold">
                  <li><strong className="text-zinc-200">No Plaintext:</strong> Hasheo asimétrico de contraseñas de una sola vía (SHA-256 en cliente para tránsito y Bcrypt/Blowfish robusto en servidor).</li>
                  <li><strong className="text-zinc-200">Anti-User Enumeration:</strong> Los formularios de login y recuperación no informan si un correo existe o no en db ("Credenciales incorrectas" en lugar de "El usuario existe pero la contraseña no").</li>
                  <li><strong className="text-zinc-200">Expiración Temporal:</strong> Los enlaces de restauración tienen fecha de caducidad estricta (1 hora máx) para mitigar el secuestro de sesiones dormidas.</li>
                  <li><strong className="text-zinc-250">Timing Attacks Guard:</strong> Las operaciones de login consumen la misma potencia de CPU de forma uniforme corran o no coincidencias válidas de usuario, evitando recuentos por variación temporal de carga.</li>
                </ul>
              </div>

            </div>

            <div className="mt-8 pt-4 border-t border-zinc-900 text-center">
              <button
                onClick={() => setShowTechnicalSpecs(false)}
                className="px-6 py-2 bg-purple-600 font-bold hover:bg-purple-700 text-white rounded-xl text-xs cursor-pointer shadow-md transition-all active:scale-[0.98]"
              >
                Cerrar Panel Técnico
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
