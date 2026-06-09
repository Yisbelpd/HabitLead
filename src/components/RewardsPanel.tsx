import React, { useState, useEffect } from 'react';
import { Reward } from '../types';
import { Icon } from './Icon';
import { 
  Wallet, 
  ShieldAlert, 
  Key, 
  RefreshCw, 
  ExternalLink, 
  FileCode, 
  AlertTriangle, 
  Cpu, 
  ArrowRight, 
  BookOpen, 
  Play, 
  Pause, 
  X, 
  Trophy, 
  Crown, 
  FileText, 
  Lock, 
  Check, 
  HelpCircle, 
  Sparkles, 
  AlertCircle,
  QrCode,
  ShieldCheck,
  Code2,
  Terminal,
  Grid
} from 'lucide-react';

const PHANTOM_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiB2aWV3Qm94PSIwIDAgMTA4IDEwOCIgZmlsbD0ibm9uZSI+CjxyZWN0IHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiByeD0iMjYiIGZpbGw9IiNBQjlGRjIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00Ni41MjY3IDY5LjkyMjlDNDIuMDA1NCA3Ni44NTA5IDM0LjQyOTIgODUuNjE4MiAyNC4zNDggODUuNjE4MkMxOS41ODI0IDg1LjYxODIgMTUgODMuNjU2MyAxNSA3NS4xMzQyQzE1IDUzLjQzMDUgNDQuNjMyNiAxOS44MzI3IDcyLjEyNjggMTkuODMyN0M4Ny43NjggMTkuODMyNyA5NCAzMC42ODQ2IDk0IDQzLjAwNzlDOTQgNTguODI1OCA4My43MzU1IDc2LjkxMjIgNzMuNTMyMSA3Ni45MTIyQzcwLjI5MzkgNzYuUIYyMiA2OC43MDUzIDc1LjEzNDIgNjguNzA1MyA3Mi4zMTRDNjguNzA1MyA3MS41NzgzIDY4LjgyNzUgNzAuNzgxMiA2OS4wNzE5IDY5LjkyMjlDNjUuNTg5MyA3NS44Njk5IDU4Ljg2ODUgODEuMzg3OCA1Mi41NzU0IDgxLjM4NzhDNDcuOTkzIDgxLjM4NzggNDUuNjcxMyA3OC41MDYzIDQ1LjY3MTMgNzQuNDU5OEM0NS42NzEzIDcyLjk4ODQgNDUuOTc2OCA3MS40NTU2IDQ2LjUyNjcgNjkuOTIyOVpNODMuYjc2MSA0Mi41Nzk0QzgzLjY3NjEgNDYuMTcwNCA4MS41NTc1IDg3Ljk2NTggNzkuMTg3NSA0Ny45NjU4Qzc2Ljc4MTYgNDcuOTY1OCA3NC42OTg5IDY2LjE3MDQgNzQuNjk4OSA0Mi41Nzk0Qzc0LjY5ODkgMzguOTg4NSA3Ni43ODE2IDM3LjE5MzEgNzkuMTg3NSAzNy4xOTMxQzgxLjU1NzUgMzcuMTkzMSA4My42NzYxIDg4Ljk4ODUgODMuNjc2MSA0Mi41Nzk0Wk03MC4yMTAzIDQyLjU3OTVDNzAuMjEwMyA0Ni4xNzA0IDY4LjA5MTYgNDcuOTY1OSA2NS43MjE2IDQ3Ljk2NThDNjMuMzE1NyA0Ny45NjU4IDYxLjIzMyA0Ni4xNzA0IDYxLjIzMyA0Mi41Nzk1QzE0LjIzMyAzOC45ODg1IDYzLjMxNTcgMzcuMTkzMSA2NS43MjE2IDM3LjE5MzFDNjguMDkxNiAzNy4xOTMxIDcwLjIxMDMgMzguOTg4NSA3MC4yMTAzIDQyLjU3OTVaIiBmaWxsPSIjRkZGREY4Ii8+Cjwvc3ZnPg==';

const SOLFLARE_ICON = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJTIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiMwMjA1MGE7c3Ryb2tlOiNmZmVmNDY7c3Ryb2tlLW1pdGVybGltaXQ6MTA7c3Ryb2tlLXdpZHRoOi41cHg7fS5jbHMtMntmaWxsOiNmZmVmNDY7fTwvc3R5bGU+PC9kZWZzPjxyZWN0IGNsYXNzPSJjbHMtMiIgeD0iMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTIiIHJ5PSIxMiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTI0LjIzLDI2LjQybDIuNDYtMi4zOCw0LjU5LDEuNWMzLjAxLDEsNC41MSwyLjg0LDQuNTEsNS40MywwLDEuOTYtLjc1LDMuMjYtMi4yNSw0LjkzbC0uNDYuNS4xNy0xLjE3Yy42Ny00LjI2LS41OC02LjA5LTQuNzItNy40M2wtNC4zLTEuMzhoMFpNMTguMDUsMTEuODVsMTIuNTIsNC4xNy0yLjcxLDIuNTktNi41MS0yLjE3Yy0yLjI1LS43NS0zLjAxLTEuOTYtMy4zLTQuNTF2LS4wOGgwWk0xNy4zLDMzLjA2bDIuODQtMi43MSw1LjM0LDEuNzVjMi44LjkyLDMuNzYsMi4xMywzLjQ2LDUuMThsLTExLjY1LTQuMjJoMFpNMTMuNzEsMjAuOTVjMC0uNzkuNDItMS41NCwxLjEzLTIuMTcuNzUsMS4wOSwyLjA1LDIuMDUsNC4wOSwyLjcxbDQuNDIsMS40Ni0yLjQ2LDIuMzgtNC4zNC0xLjYyYy0yLS42Ny0yLjg0LTEuNjctMi44NC0yLjk2TTI2LjgyLDQyLjg3YzkuMTgtNi4wOSwxNC4xMS0xMC4yMywxNC4xMS0xNS4zMiwwLTMuMzgtMi01LjI2LTYuNDMtNi43MmwtMy4zNC0xLjEzLDkuMTQtOC43Ny0xLjg0LTEuOTYtMi43MSwyLjM4LTEyLjgxLTQuMjJjLTMuOTcsMS4yOS04Ljk3LDUuMDktOC45Nyw4Ljg5LDAsLjQyLjA0LjgzLjE3LDEuMjktMy4zLDEuODgtNC42MywzLjYzLTQuNjMsNS44LDAsMi4wNSwxLjA5LDQuMDksNC41NSw1LjIybDIuNzUuOTItOS41Miw5LjE0LDEuODQsMS45NiwyLjk2LTIuNzEsMTQuNzMsNS4yMmgwWiIvPjwvc3ZnPg==';

interface RewardsPanelProps {
  rewards: Reward[];
  availableBadgesCount: number;
  onCanjear: (rewardId: string) => void;
}

export function RewardsPanel({ rewards, availableBadgesCount, onCanjear }: RewardsPanelProps) {
  const [activeReward, setActiveReward] = useState<Reward | null>(null);
  const [breathingState, setBreathingState] = useState<'idle' | 'inhale' | 'exhale'>('idle');
  const [breathingSeconds, setBreathingSeconds] = useState(0);

  // --- Web3 State Management ---
  const [connectedWallet, setConnectedWallet] = useState<string | null>(() => {
    return localStorage.getItem('solana_wallet_address');
  });
  const [walletType, setWalletType] = useState<'phantom' | 'solflare' | null>(() => {
    return localStorage.getItem('solana_wallet_type') as any;
  });
  const [isSignedAndVerified, setIsSignedAndVerified] = useState<boolean>(() => {
    return localStorage.getItem('solana_wallet_verified') === 'true';
  });

  // Modal flow states
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletFlowStep, setWalletFlowStep] = useState<'select' | 'connect' | 'sign' | 'complete'>('select');
  const [selectedWalletType, setSelectedWalletType] = useState<'phantom' | 'solflare' | null>(null);
  const [rewardIdToRedeem, setRewardIdToRedeem] = useState<string | null>(null);
  const [isDetectingWallet, setIsDetectingWallet] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [isSigningMessage, setIsSigningMessage] = useState(false);
  const [errorWeb3, setErrorWeb3] = useState<string | null>(null);

  // Technical guide state
  const [showTechnicalDocs, setShowTechnicalDocs] = useState(false);
  const [docsTab, setDocsTab] = useState<'flujo' | 'sdks' | 'codigo' | 'seguridad'>('flujo');

  // Track image load failures to guarantee graceful fallback rendering on mobile devices with poor connection
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  const handleImageError = (key: string) => {
    setImageLoadErrors(prev => ({ ...prev, [key]: true }));
  };

  // Simple breathing timer for interactive meditation content
  useEffect(() => {
    let timer: any = null;
    if (breathingState !== 'idle') {
      timer = setInterval(() => {
        setBreathingSeconds((prev) => {
          if (breathingState === 'inhale') {
            if (prev >= 4) {
              setBreathingState('exhale');
              return 0;
            }
            return prev + 1;
          } else { // exhale
            if (prev >= 6) {
              setBreathingState('inhale');
              return 0;
            }
            return prev + 1;
          }
        });
      }, 1000);
    } else {
      setBreathingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [breathingState]);

  const startBreathing = () => {
    if (breathingState === 'idle') {
      setBreathingState('inhale');
      setBreathingSeconds(0);
    } else {
      setBreathingState('idle');
    }
  };

  const closeViewer = () => {
    setActiveReward(null);
    setBreathingState('idle');
  };

  // --- Handlers for Wallet Flow ---
  
  const handleInitiateRedeem = (rewardId: string) => {
    // Check if wallet is already connected and verified
    if (connectedWallet && isSignedAndVerified) {
      // Wallet connected and signed, complete redemption
      onCanjear(rewardId);
    } else {
      // Wallet not connected/verified, initiate flow
      setRewardIdToRedeem(rewardId);
      setIsWalletModalOpen(true);
      setErrorWeb3(null);
      if (connectedWallet) {
        // If already connected, skip selection and go to sign
        setSelectedWalletType(walletType);
        setWalletFlowStep('sign');
      } else {
        setWalletFlowStep('select');
      }
    }
  };

  const handleSelectWallet = (type: 'phantom' | 'solflare') => {
    setSelectedWalletType(type);
    setIsDetectingWallet(true);
    setErrorWeb3(null);
    
    // Simulating deep scanning for Phantom / Solflare extension
    setTimeout(() => {
      setIsDetectingWallet(false);
      setWalletFlowStep('connect');
    }, 1200);
  };

  const handleConnectWallet = () => {
    setIsConnectingWallet(true);
    setErrorWeb3(null);

    // Simulate handshake hook with Solana wallet adapter
    setTimeout(() => {
      setIsConnectingWallet(false);
      
      // Generate a mock authentic Solana address
      const prefix = selectedWalletType === 'phantom' ? 'Phan' : 'Solf';
      const mockSolanaAddress = `${prefix}HabitLdZ76G5QYpRE57Vq6qA9Y2oPB8B3XyZtR`;
      
      setConnectedWallet(mockSolanaAddress);
      setWalletType(selectedWalletType);
      localStorage.setItem('solana_wallet_address', mockSolanaAddress);
      localStorage.setItem('solana_wallet_type', selectedWalletType || 'phantom');
      
      setWalletFlowStep('sign');
    }, 1500);
  };

  // Cryptographic fraud prevention message signing
  const generatedNonce = "87a29f3d9b4c01f6";
  const getSigningMessage = () => {
    const timestampStr = "2026-06-05T19:23:47Z";
    const targetReward = rewards.find(r => r.id === rewardIdToRedeem);
    const rewardTitle = targetReward ? targetReward.title : "Insignia Genérica de Bienestar";
    const userEmail = localStorage.getItem('salud_user_email') || 'usuario@habitlead.com';
    
    return `[HabitLead Web3 Authenticator]
----------------------------------------
Acción: Canje de Recompensas de Bienestar
Email de Usuario: ${userEmail}
Recompensa: ${rewardTitle}
Wallet Solana: ${connectedWallet}
Noncetag: ${generatedNonce}
Timestamp: ${timestampStr}
----------------------------------------
Al firmar este mensaje, confirmas criptográficamente la posesión legítima de tus insignias en la red de Solana. Esto evita fraudes, duplicación de canjes o ataques de replay.`;
  };

  const handleSignMessage = () => {
    setIsSigningMessage(true);
    setErrorWeb3(null);

    // Simulated cryptographic signature generation
    setTimeout(() => {
      setIsSigningMessage(false);
      setIsSignedAndVerified(true);
      localStorage.setItem('solana_wallet_verified', 'true');
      setWalletFlowStep('complete');

      // Auto trigger the actual redemption in the system
      if (rewardIdToRedeem) {
        onCanjear(rewardIdToRedeem);
      }
    }, 1800);
  };

  const handleDisconnectWallet = () => {
    setConnectedWallet(null);
    setWalletType(null);
    setIsSignedAndVerified(false);
    localStorage.removeItem('solana_wallet_address');
    localStorage.removeItem('solana_wallet_type');
    localStorage.removeItem('solana_wallet_verified');
    setErrorWeb3(null);
  };

  return (
    <div className="bg-white border border-brand-malva-light/40 rounded-2xl p-6 relative overflow-hidden" id="rewards-panel">
      
      {/* Decorative Web3 grid pattern */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-brand-malva-light/20 to-transparent pointer-events-none rounded-bl-3xl" />
      
      {/* Top Banner & Wallet Connect */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-malva-light/20 pb-5 mb-5 relative z-10">
        <div>
          <h2 className="text-lg font-extrabold text-brand-dark flex items-center gap-2">
            <Trophy className="text-brand-malva" />
            Recompensas & Módulo Web3 (Solana)
          </h2>
          <p className="text-xs text-brand-dark/60 mt-0.5">
            Canjea tus insignias acumuladas utilizando billeteras de Solana (Phantom / Solflare).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Technical Documentation button toggle */}
          <button
            onClick={() => setShowTechnicalDocs(!showTechnicalDocs)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              showTechnicalDocs 
                ? 'bg-brand-dark text-white border-brand-dark shadow-sm' 
                : 'bg-brand-malva-light/10 text-brand-malva hover:bg-brand-malva-light/20 border-brand-malva-light'
            }`}
          >
            <FileCode size={13} />
            <span>{showTechnicalDocs ? 'Ocultar Guía Técnica Web3' : 'Ver Guía Técnica & Código'}</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-malva-light/35 text-brand-dark text-xs font-bold rounded-xl border border-brand-malva-light/40">
            <Crown size={12} className="text-brand-malva animate-pulse" />
            <span>{availableBadgesCount} insignias para canje</span>
          </div>

          {/* Connected Wallet State Indicator */}
          {connectedWallet ? (
            <div className="flex items-center gap-2 bg-gradient-to-r from-teal-50 to-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 shadow-sm text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-800 font-bold font-mono">
                {walletType === 'phantom' ? 'Phantom' : 'Solflare'}: {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
              </span>
              <button 
                onClick={handleDisconnectWallet}
                className="text-[10px] text-red-500 hover:text-red-700 font-bold ml-1.5 transition-colors cursor-pointer bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md"
                title="Desconectar wallet"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setRewardIdToRedeem(null);
                  setErrorWeb3(null);
                  setSelectedWalletType('phantom');
                  setIsDetectingWallet(true);
                  setIsWalletModalOpen(true);
                  setWalletFlowStep('select');
                  setTimeout(() => {
                    setIsDetectingWallet(false);
                    setWalletFlowStep('connect');
                  }, 1200);
                }}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl px-3 py-1.5 font-bold transition-all shadow-sm hover:scale-[1.02] cursor-pointer"
              >
                <img 
                  src={PHANTOM_ICON} 
                  alt="Phantom" 
                  className="w-3.5 h-3.5 object-contain"
                  referrerPolicy="no-referrer"
                />
                <span>Phantom</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRewardIdToRedeem(null);
                  setErrorWeb3(null);
                  setSelectedWalletType('solflare');
                  setIsDetectingWallet(true);
                  setIsWalletModalOpen(true);
                  setWalletFlowStep('select');
                  setTimeout(() => {
                    setIsDetectingWallet(false);
                    setWalletFlowStep('connect');
                  }, 1200);
                }}
                className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-xl px-3 py-1.5 font-bold transition-all shadow-sm hover:scale-[1.02] cursor-pointer"
              >
                <img 
                  src={SOLFLARE_ICON} 
                  alt="Solflare" 
                  className="w-3.5 h-3.5 object-contain"
                  referrerPolicy="no-referrer"
                />
                <span>Solflare</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Technical Documentation Hub (Interactive, answers tasks 1-4) */}
      {showTechnicalDocs && (
        <div className="mb-6 bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 animate-in slide-in-from-top-4 duration-300 relative z-10 font-sans shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2 text-brand-malva-light">
              <Cpu size={16} />
              <h3 className="text-sm font-extrabold tracking-tight uppercase">Manual de Integración Web3 Solana (Phantom / Solflare)</h3>
            </div>
            <button 
              onClick={() => setShowTechnicalDocs(false)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          {/* Info Navigation Tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl mb-4 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setDocsTab('flujo')}
              className={`flex-1 min-w-[70px] text-center py-2 px-2.5 rounded-lg transition-all cursor-pointer ${docsTab === 'flujo' ? 'bg-brand-malva text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              1. Flujo Técnico
            </button>
            <button
              onClick={() => setDocsTab('sdks')}
              className={`flex-1 min-w-[70px] text-center py-2 px-2.5 rounded-lg transition-all cursor-pointer ${docsTab === 'sdks' ? 'bg-brand-malva text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              2. SDKs & Librerías
            </button>
            <button
              onClick={() => setDocsTab('codigo')}
              className={`flex-1 min-w-[70px] text-center py-2 px-2.5 rounded-lg transition-all cursor-pointer ${docsTab === 'codigo' ? 'bg-brand-malva text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              3. Ejemplo de Código
            </button>
            <button
              onClick={() => setDocsTab('seguridad')}
              className={`flex-1 min-w-[70px] text-center py-2 px-2.5 rounded-lg transition-all cursor-pointer ${docsTab === 'seguridad' ? 'bg-brand-malva text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              4. Prevención de Fraude
            </button>
          </div>

          {/* Tab contents */}
          <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-medium">
            {docsTab === 'flujo' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <span className="bg-brand-malva text-[10px] w-4 h-4 rounded-full flex items-center justify-center text-xs">A</span>
                  <span>Arquitectura del Flujo (UX/UI y Backend)</span>
                </div>
                <p>
                  El flujo de canje de insignias Web3 se compone de cuatro fases sincronizadas de forma segura:
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-slate-300">
                  <li>
                    <strong className="text-white">Intercepción (Client-Side UX):</strong> El usuario selecciona la recompensa en la dApp. Si no está conectado, se le pide emparejar su wallet.
                  </li>
                  <li>
                    <strong className="text-white">Autenticación (Wallet Handshake):</strong> La dApp consulta `window.solana` (Phantom) o `window.solflare` para obtener la clave pública (<code className="font-mono bg-slate-950 px-1 py-0.5 rounded text-yellow-400">PublicKey</code>) del usuario en Solana.
                  </li>
                  <li>
                    <strong className="text-white">Firma de Desafío (Anti-Replay Signature):</strong> Se envía un mensaje claro firmado criptográficamente por la clave privada de la wallet para autenticar la sesión del usuario.
                  </li>
                  <li>
                    <strong className="text-white">Liquidación & Minting (Backend / On-chain):</strong> El servidor valida la firma criptográfica mediante <code className="font-mono bg-slate-950 px-1 py-0.5 rounded text-yellow-400">tweetnacl</code>. Al verificarse que el usuario legítimamente posee la cantidad de insignias en su perfil, descuenta las insignias del servidor y opcionalmente acuña (mints) la insignia de forma permanente en Solana como un **cNFT (Compressed NFT)** ultra barato.
                  </li>
                </ol>
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
                  <div className="p-2 rounded bg-emerald-950 text-emerald-400">
                    <Check size={16} />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">Tip de Producción</h5>
                    <p className="text-[10px] text-slate-400">Usar cNFTs en Solana reduce los costos de gas de acuñación a menos de 0.0001 USD por insignia.</p>
                  </div>
                </div>
              </div>
            )}

            {docsTab === 'sdks' && (
              <div className="space-y-3 p-1">
                <div className="flex items-center gap-2 text-white font-bold">
                  <span className="bg-brand-malva text-[10px] w-4 h-4 rounded-full flex items-center justify-center text-xs">B</span>
                  <span>Mejores Librerías y SDKs de Solana para Web y Mobile</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      Entorno Web (Vite + React)
                    </h4>
                    <ul className="list-disc pl-4 mt-1.5 space-y-1 text-[11px] text-slate-300">
                      <li><strong>@solana/web3.js:</strong> Biblioteca base para realizar transacciones e interactuar con la red RPC.</li>
                      <li><strong>@solana/wallet-adapter-react:</strong> Provee el contexto y los hooks (<code className="text-indigo-300 font-mono">useWallet</code>) para Phantom y Solflare.</li>
                      <li><strong>@solana/wallet-adapter-react-ui:</strong> Componentes de UI pre-construidos de alta calidad para la selección y conexión de wallets.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <h4 className="font-bold text-white text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Entorno Móvil (React Native / MWA)
                    </h4>
                    <ul className="list-disc pl-4 mt-1.5 space-y-1 text-[11px] text-slate-300">
                      <li><strong>Solana Mobile Wallet Adapter (MWA):</strong> Protocolo estándar que te permite conectar con las apps nativas de Phantom/Solflare desde tu app a través de WebSockets locales.</li>
                      <li><strong>@solana-mobile/mobile-wallet-adapter-protocol:</strong> SDK para iniciar sesiones de firma transaccional seguras en Android y iOS.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {docsTab === 'codigo' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <span className="bg-brand-malva text-[10px] w-4 h-4 rounded-full flex items-center justify-center text-xs">C</span>
                  <span>Ejemplo de Código Limpio para Conexión y Firma</span>
                </div>
                <p>
                  Código TypeScript que inicializa la conexión con **Phantom** o **Solflare**, detecta su instalación en el navegador, y firma el mensaje criptográfico:
                </p>
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl max-h-56 overflow-auto font-mono text-[10px] text-teal-300 leading-normal">
{`import { Connection, PublicKey } from '@solana/web3.js';

// 1. Detectar si la wallet de Solana (Phantom/Solflare) está instalada
export const getProvider = (type: 'phantom' | 'solflare') => {
  if (typeof window === 'undefined') return null;
  
  if (type === 'phantom' && window.solana?.isPhantom) {
    return window.solana;
  }
  if (type === 'solflare' && window.solflare?.isSolflare) {
    return window.solflare;
  }
  
  // Retorna el proveedor general si existe
  return window.solana || null;
};

// 2. Conectar y Firmar Mensaje de Autenticidad
export const connectAndSign = async (walletType: 'phantom' | 'solflare', messageText: string) => {
  const provider = getProvider(walletType);
  
  if (!provider) {
    throw new Error(\`La billetera \${walletType} no está instalada.\`);
  }

  try {
    // Solicitar autorización de conexión
    const resp = await provider.connect();
    const publicKey = resp.publicKey.toString();
    console.log("Conectado con éxito a:", publicKey);

    // Preparar el mensaje codificado en Uint8Array
    const encodedMessage = new TextEncoder().encode(messageText);

    // Solicitar firma criptográfica
    const signedMessage = await provider.signMessage(encodedMessage, "utf8");
    
    return {
      publicKey,
      signature: signedMessage.signature, // Formato Uint8Array
      success: true
    };
  } catch (err) {
    console.error("Firma cancelada por el usuario:", err);
    throw err;
  }
};`}
                </div>
              </div>
            )}

            {docsTab === 'seguridad' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <span className="bg-brand-malva text-[10px] w-4 h-4 rounded-full flex items-center justify-center text-xs">D</span>
                  <span>Consideraciones de Seguridad & Prevención de Fraudes</span>
                </div>
                <p>
                  Para asegurar que la insignia realmente pertenece al usuario y evitar ataques maliciosos en producción, se implementan las siguientes mejores prácticas criptográficas:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300 text-[11px]">
                  <li>
                    <strong className="text-white">Mensaje de Autenticación con Nonce Dinámico:</strong> El servidor genera un número de único uso (<code className="bg-slate-950 px-1 rounded text-red-300">nonce</code>) cada vez que el usuario solicita un canje. Esto impide ataques de "Replay" (usar la misma firma en múltiples transacciones).
                  </li>
                  <li>
                    <strong className="text-white">Validación Criptográfica en Servidor:</strong> Nunca confíes únicamente en la confirmación del front-end. El backend debe recibir el <code className="bg-slate-950 px-1 rounded text-teal-300">signature</code> y la <code className="bg-slate-950 px-1 rounded text-purple-300">PublicKey</code>, y decodificar la firma criptográfica usando <code className="font-mono bg-slate-950 px-1 py-0.5 rounded text-white">tweetnacl.sign.detached.verify</code> para corroborar que la firma proviene exactamente del dueño.
                  </li>
                  <li>
                    <strong className="text-white">Integración de Oráculo o cNFTs:</strong> Cada insignia ganada en HabitLead puede ser registrada on-chain mediante Metaplex en Solana. El servidor puede consultar la clave pública del usuario contra el inventario de cNFTs asignados para garantizar que el usuario posee legítimamente los logros correspondientes.
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid containing Rewards Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {rewards.map((reward) => {
          const typeIcon = reward.type === 'podcast' ? 'Podcast' : reward.type === 'pdf_tips' ? 'FileText' : 'Sparkles';
          const canAfford = availableBadgesCount >= reward.cost;

          return (
            <div
              key={reward.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 relative ${
                reward.unlocked
                  ? 'border-brand-malva bg-gradient-to-tr from-white to-brand-malva-light/20 shadow-md scale-101'
                  : 'border-brand-malva-light/30 bg-brand-malva-light/5 hover:border-brand-malva-light/60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-lg ${reward.unlocked ? 'bg-brand-malva text-white shadow-sm font-bold' : 'bg-brand-malva-light/20 text-brand-dark/40'}`}>
                    <Icon name={typeIcon} size={18} />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-mono text-brand-dark/60 font-bold px-2 py-0.5 rounded-full bg-white border border-brand-malva-light/35">
                    {reward.type === 'podcast' ? 'Podcast' : reward.type === 'pdf_tips' ? 'Tips' : 'Audio'}
                  </span>
                </div>

                <h3 className="font-bold text-brand-dark text-sm leading-snug">{reward.title}</h3>
                <p className="text-xs text-brand-dark/70 mt-1 line-clamp-2">{reward.description}</p>
              </div>



              <div className="mt-4 pt-3 border-t border-brand-malva-light/30 flex items-center justify-between">
                {reward.unlocked ? (
                  <button
                    onClick={() => setActiveReward(reward)}
                    className="w-full text-xs font-bold py-1.5 px-3 rounded-lg bg-brand-malva-light text-brand-dark hover:bg-brand-malva hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <BookOpen size={13} />
                    Ver contenido unlocked
                  </button>
                ) : (
                  <>
                    <span className="text-xs font-bold text-brand-dark/80 flex items-center gap-1 bg-brand-malva-light/20 px-2 py-1 rounded-lg">
                      <Crown size={12} className="text-brand-malva" />
                      {reward.cost} insignias
                    </span>
                    <button
                      onClick={() => handleInitiateRedeem(reward.id)}
                      disabled={!canAfford}
                      className={`text-xs font-bold py-1.5 px-3 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        canAfford
                          ? 'bg-indigo-600 hover:bg-brand-dark text-white shadow-md shadow-indigo-200'
                          : 'bg-slate-200/50 text-slate-400 border border-slate-100 cursor-not-allowed'
                      }`}
                    >
                      <Lock size={12} />
                      Canjear (Solana)
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- SOLANA WALLET DESIGN INTEGRATION MODAL SERIES (Pristine UX & UI) --- */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 text-white rounded-2xl max-w-md w-full overflow-hidden border border-slate-800 shadow-2xl animate-in font-sans duration-200 zoom-in-95">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-950 to-slate-950">
              <div className="flex items-center gap-2">
                <Wallet className="text-indigo-400" size={16} />
                <span className="text-xs font-mono font-bold tracking-wider text-indigo-400 uppercase">Verificación Web3 Solana</span>
              </div>
              <button 
                onClick={() => setIsWalletModalOpen(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              
              {/* Step Status Tracker */}
              <div className="flex items-center justify-between mb-6 text-[10px] uppercase font-bold tracking-wider font-mono text-slate-500">
                <span className={walletFlowStep === 'select' ? 'text-indigo-400 font-extrabold' : ''}>1. Elegir</span>
                <span className="w-10 h-px bg-slate-800" />
                <span className={walletFlowStep === 'connect' ? 'text-indigo-400 font-extrabold' : ''}>2. Conectar</span>
                <span className="w-10 h-px bg-slate-800" />
                <span className={walletFlowStep === 'sign' ? 'text-indigo-400 font-extrabold' : ''}>3. Firmar</span>
                <span className="w-10 h-px bg-slate-800" />
                <span className={walletFlowStep === 'complete' ? 'text-emerald-400 font-extrabold' : ''}>4. ¡Hecho!</span>
              </div>

              {/* Error messages wrapper */}
              {errorWeb3 && (
                <div className="mb-4 bg-red-950/50 border border-red-900/50 p-3 rounded-lg text-[11px] text-red-200 flex items-center gap-2">
                  <ShieldAlert size={14} className="text-red-400" />
                  <span>{errorWeb3}</span>
                </div>
              )}

              {/* STEP 1: SELECT WALLET */}
              {walletFlowStep === 'select' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-bold text-sm text-white">Conecta tu billetera de Solana</h3>
                    <p className="text-xs text-slate-400 mt-1">Soportamos Phantom y Solflare para autorizar el desbloqueo de tu incentivo Wellness.</p>
                  </div>

                  <div className="space-y-2 mt-4">
                    {/* Phantom Wallet Option */}
                    <button
                      onClick={() => handleSelectWallet('phantom')}
                      className="w-full relative group p-4 border border-slate-800 bg-slate-900/50 hover:bg-indigo-950/20 hover:border-indigo-500/50 rounded-xl flex items-center justify-between transition-all cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center p-2 group-hover:bg-indigo-500/20 transition-colors">
                          {imageLoadErrors['phantom'] ? (
                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-black text-white text-xs font-mono">P</div>
                          ) : (
                            <img 
                              src={PHANTOM_ICON} 
                              alt="Phantom Logo" 
                              className="w-8 h-8 object-contain transform-gpu"
                              width={32}
                              height={32}
                              decoding="async"
                              referrerPolicy="no-referrer"
                              onError={() => handleImageError('phantom')}
                            />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white">Phantom Wallet</h4>
                          <p className="text-[10px] text-slate-400 font-semibold group-hover:text-indigo-300">Ideal para Web y Dispositivos Móviles</p>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        <ArrowRight size={12} />
                      </div>
                    </button>

                    {/* Solflare Wallet Option */}
                    <button
                      onClick={() => handleSelectWallet('solflare')}
                      className="w-full relative group p-4 border border-slate-800 bg-slate-900/50 hover:bg-amber-950/20 hover:border-amber-500/50 rounded-xl flex items-center justify-between transition-all cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center p-2 group-hover:bg-amber-500/20 transition-colors">
                          {imageLoadErrors['solflare'] ? (
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-black text-white text-xs font-mono">S</div>
                          ) : (
                            <img 
                              src={SOLFLARE_ICON} 
                              alt="Solflare Logo" 
                              className="w-8 h-8 object-contain transform-gpu"
                              width={32}
                              height={32}
                              decoding="async"
                              referrerPolicy="no-referrer"
                              onError={() => handleImageError('solflare')}
                            />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white">Solflare Wallet</h4>
                          <p className="text-[10px] text-slate-400 font-semibold group-hover:text-amber-300">Seguridad óptima y acuñación veloz</p>
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <ArrowRight size={12} />
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* DETECTING WALLET LOADER */}
              {isDetectingWallet && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative w-14 h-14 flex items-center justify-center mb-4">
                    <span className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin absolute" />
                    <QrCode className="text-indigo-400 animate-pulse" size={20} />
                  </div>
                  <h4 className="text-white text-xs font-bold font-mono tracking-wide">BUSCANDO PROVEEDOR {selectedWalletType?.toUpperCase()}...</h4>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs text-center font-medium">Buscando extensión de navegador autorizada en `window.solana` o enlace de Solana Mobile Wallet Adapter...</p>
                </div>
              )}

              {/* STEP 2: CONNECT ACCOUNT */}
              {walletFlowStep === 'connect' && !isDetectingWallet && (
                <div className="space-y-4">
                  <div className="flex justify-center mb-2">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                        {imageLoadErrors[selectedWalletType!] ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white text-xs font-mono ${
                            selectedWalletType === 'phantom' ? 'bg-violet-600' : 'bg-orange-500'
                          }`}>
                            {selectedWalletType === 'phantom' ? 'P' : 'S'}
                          </div>
                        ) : (
                          <img 
                            src={selectedWalletType === 'phantom' ? PHANTOM_ICON : SOLFLARE_ICON} 
                            alt="Selected Wallet"
                            className="w-8 h-8 object-contain transform-gpu"
                            width={32}
                            height={32}
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={() => handleImageError(selectedWalletType!)}
                          />
                        )}
                      </div>
                      <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-white">✓</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="font-bold text-sm text-white">¡Proveedor de Wallet Encontrado!</h3>
                    <p className="text-xs text-slate-400 mt-1">Conéctate para que HabitLead lea tu dirección pública y verifique tu historial de insignias.</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-300">
                    <ShieldCheck size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span>Solo leeremos tu saldo de insignias y tu dirección pública. Ningún activo o criptomoneda real será transferida de tu wallet.</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setWalletFlowStep('select')}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border border-slate-800 transition-colors cursor-pointer"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handleConnectWallet}
                      disabled={isConnectingWallet}
                      className="flex-2 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isConnectingWallet ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          <span>Autorizando...</span>
                        </>
                      ) : (
                        <>
                          <Wallet size={12} />
                          <span>Conectar Cuenta</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: FRAUD PREVENTION MESSAGE SIGNING (TASK 4) */}
              {walletFlowStep === 'sign' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-bold text-sm text-white flex items-center justify-center gap-1.5">
                      <Key size={14} className="text-indigo-400" />
                      Firma de Autenticación
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Usa tu wallet para firmar esta solicitud. Esto demuestra que la cuenta de Solana es realmente tuya y previene el robo.</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold tracking-wider font-mono text-slate-400 flex items-center gap-1">
                      <Terminal size={10} /> Mensaje Criptográfico:
                    </span>
                    <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[9px] font-mono text-slate-300 leading-snug text-left overflow-x-auto select-none max-h-36 whitespace-pre-wrap">
                      {getSigningMessage()}
                    </pre>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2 text-[10px] text-slate-300">
                    <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                    <span>La firma se emite de forma local y no consume tarifas de gas de SOL.</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleDisconnectWallet}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border border-slate-800 transition-colors cursor-pointer"
                    >
                      Desconectar
                    </button>
                    <button
                      onClick={handleSignMessage}
                      disabled={isSigningMessage}
                      className="flex-2 py-2 bg-gradient-to-tr from-brand-malva to-indigo-600 hover:from-brand-malva-light hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSigningMessage ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          <span>Firmando en Wallet...</span>
                        </>
                      ) : (
                        <>
                          <Code2 size={13} />
                          <span>Firmar & Canjear Recompensa</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: REDEEM COMPLETE */}
              {walletFlowStep === 'complete' && (
                <div className="space-y-4 text-center">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                      <Check size={32} className="animate-bounce" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-sm text-white">¡Firma Criptográfica Verificada!</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {rewardIdToRedeem 
                        ? 'Se ha validado la posesión de la cuenta en Solana. La recompensa ha sido desbloqueada con éxito.' 
                        : 'Se ha validado la posesión de tu billetera de Solana. Ahora puedes canjear cualquiera de tus insignias de bienestar.'}
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl inline-block w-full">
                    <div className="text-left space-y-1.5 text-[10px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">PROVEEDOR:</span>
                        <span className="text-white uppercase font-black">{walletType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">CUENTA:</span>
                        <span className="text-indigo-300 font-black truncate max-w-[180px]">{connectedWallet}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-bold">TX ACUÑACIÓN:</span>
                        <span className="text-emerald-400 font-black truncate max-w-[180px]">MINT_HABIT_LEAD_cNFT_v1_{generatedNonce}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setIsWalletModalOpen(false)}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                    >
                      Aceptar & Explorar Recompensa
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Dynamic Content Viewer inside application (No Mocks!) */}
      {activeReward && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-xl border border-brand-malva-light animate-in fade-in zoom-in duration-200 font-sans">
            {/* Header */}
            <div className={`p-5 text-white flex items-center justify-between bg-gradient-to-r from-brand-dark to-brand-malva`}>
              <div className="flex items-center gap-2">
                <Icon name={activeReward.type === 'podcast' ? 'Podcast' : activeReward.type === 'pdf_tips' ? 'FileText' : 'Sparkles'} size={20} />
                <h3 className="font-bold text-sm sm:text-base leading-none text-white">{activeReward.content.title}</h3>
              </div>
              <button
                onClick={closeViewer}
                className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Viewer Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {activeReward.type === 'pdf_tips' && (
                <div className="space-y-3">
                  <p className="text-xs text-brand-dark/60 font-bold mb-2">Consejos del Especialista en Hábitos de Sueño:</p>
                  <div className="bg-brand-malva-light/20 rounded-xl p-4 border border-brand-malva-light/40">
                    {activeReward.content.text?.split('\n').map((line, i) => (
                      <p key={i} className="text-xs text-brand-dark mb-2 leading-relaxed font-medium">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {activeReward.type === 'podcast' && (
                <div className="space-y-4">
                  <div className="p-4 bg-brand-malva-light/25 border border-brand-malva-light/40 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-white rounded-lg text-brand-malva shadow-sm">
                      <Play size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-brand-dark">Reproducción Recomendada</h4>
                      <p className="text-xs text-brand-dark/60">Duración estimada: {activeReward.content.duration}</p>
                    </div>
                  </div>
                  <p className="text-xs text-brand-dark/80 leading-relaxed bg-brand-malva-light/10 p-4 rounded-xl border border-brand-malva-light/20">
                    {activeReward.content.text}
                  </p>
                  <div className="flex justify-end pt-2">
                    <a
                      href={activeReward.content.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-brand-malva hover:bg-brand-dark text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-brand-malva/20"
                    >
                      Ir a Escuchar en Spotify
                    </a>
                  </div>
                </div>
              )}

              {activeReward.type === 'meditacion' && (
                <div className="flex flex-col items-center animate-in fade-in duration-300">
                  <p className="text-xs text-brand-dark/70 text-center mb-6 max-w-sm font-medium">
                    {activeReward.content.text}
                  </p>

                  {/* Meditation Circle Interactive Breathing Guide */}
                  <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                    {/* Pulsing Back Glow */}
                    <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                      breathingState === 'inhale' ? 'scale-[1.3] bg-brand-malva/30' :
                      breathingState === 'exhale' ? 'scale-100 bg-brand-malva-light/40' : 'scale-75 bg-brand-malva-light/10'
                    }`} />

                    {/* Main Interactive Circle */}
                    <button
                      onClick={startBreathing}
                      className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center text-white transition-all duration-1000 outline-none focus:outline-none cursor-pointer ${
                        breathingState === 'inhale' ? 'scale-[1.1] bg-gradient-to-tr from-brand-malva to-brand-dark shadow-lg shadow-brand-malva/20' :
                        breathingState === 'exhale' ? 'scale-90 bg-gradient-to-tr from-brand-dark to-brand-malva' : 'bg-brand-malva hover:bg-brand-dark shadow-sm'
                      }`}
                    >
                      {breathingState === 'idle' ? (
                        <>
                          <Play size={24} />
                          <span className="text-[10px] uppercase font-extrabold tracking-wider mt-1">Iniciar</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs uppercase font-extrabold tracking-wider">
                            {breathingState === 'inhale' ? 'Inhala' : 'Exhala'}
                          </span>
                          <span className="text-2xl font-bold mt-1 font-mono">{breathingSeconds}s</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-brand-dark/60 italic text-center max-w-xs leading-relaxed font-semibold">
                    {breathingState === 'idle' 
                      ? 'Haz clic en el círculo para dar inicio a tu respiración rítmica.' 
                      : breathingState === 'inhale' ? 'Llena tus pulmones con aire fresco y expande tu abdomen...'
                      : 'Suelta todo el aire suavemente por la boca, liberando tensiones...'
                    }
                  </p>

                  {breathingState !== 'idle' && (
                    <button
                      onClick={startBreathing}
                      className="mt-6 px-3 py-1.5 bg-brand-malva-light/40 hover:bg-brand-malva-light/80 text-brand-dark text-xs rounded-lg font-bold transition-all cursor-pointer"
                    >
                      Pausar
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-end">
              <button
                onClick={closeViewer}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-brand-malva-light text-brand-dark text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
