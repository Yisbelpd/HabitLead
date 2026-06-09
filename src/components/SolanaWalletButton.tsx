import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { Icon } from './Icon';

export function SolanaWalletButton() {
  const {
    wallets,
    wallet: activeWallet,
    publicKey,
    connected,
    connecting,
    select,
    connect,
    disconnect,
  } = useWallet();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'extension' | 'manual'>('extension');
  
  // Manual / Demo Mode Connection state
  const [manualAddressInput, setManualAddressInput] = useState('');
  const [savedManualAddress, setSavedManualAddress] = useState<string | null>(null);

  useEffect(() => {
    // Detect mobile device
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    
    // Load manual address if any saved
    const saved = localStorage.getItem('salud_manual_sol_address');
    if (saved) {
      setSavedManualAddress(saved);
      setManualAddressInput(saved);
    }
  }, []);

  // Truncate public key to format 7x8A...kP91
  const formatAddress = (pubkeyString: string) => {
    if (pubkeyString.length < 12) return pubkeyString;
    return `${pubkeyString.slice(0, 6)}...${pubkeyString.slice(-4)}`;
  };

  const handleWalletSelect = async (selectedWallet: any) => {
    try {
      setErrorMsg(null);
      
      // If of type readyState is NotDetected and on mobile, deep link is preferred, 
      // but let's try standard connect or show deep link instructions
      if (selectedWallet.readyState === WalletReadyState.NotDetected && isMobile) {
        // Handle trigger deep link
        const currentUrl = window.location.href;
        let deepLink = '';
        if (selectedWallet.adapter.name.toLowerCase() === 'phantom') {
          deepLink = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(window.location.origin)}`;
        } else if (selectedWallet.adapter.name.toLowerCase() === 'solflare') {
          deepLink = `https://solflare.com/ul/v1/browse?url=${encodeURIComponent(currentUrl)}&ref=${encodeURIComponent(window.location.origin)}`;
        }
        
        if (deepLink) {
          window.open(deepLink, '_blank');
          return;
        }
      }

      if (activeWallet?.adapter.name === selectedWallet.adapter.name) {
        if (!connected) {
          await connect();
        }
      } else {
        await select(selectedWallet.adapter.name);
      }
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      setErrorMsg(err.message || 'Error al conectar la wallet. Por favor intenta de nuevo.');
    }
  };

  const handleDisconnect = async () => {
    try {
      setErrorMsg(null);
      if (connected) {
        await disconnect();
      }
      if (savedManualAddress) {
        localStorage.removeItem('salud_manual_sol_address');
        setSavedManualAddress(null);
        setManualAddressInput('');
        window.dispatchEvent(new Event('manual-wallet-changed'));
      }
    } catch (err: any) {
      console.error("Wallet disconnect error:", err);
    }
  };

  const handleManualConnect = () => {
    setErrorMsg(null);
    const cleanAddr = manualAddressInput.trim();
    if (!cleanAddr) {
      setErrorMsg('Ingresa una dirección de Solana');
      return;
    }

    // Basic Solana address check (base58, 32-44 chars)
    const isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(cleanAddr);
    if (!isValid) {
      setErrorMsg('Dirección inválida. Inserta un formato de address Solana real (32-44 carácteres Base58)');
      return;
    }

    localStorage.setItem('salud_manual_sol_address', cleanAddr);
    setSavedManualAddress(cleanAddr);
    
    // Notify main App component to sync details
    window.dispatchEvent(new Event('manual-wallet-changed'));
  };

  // Connected status computation
  const isRealConnected = connected && publicKey;
  const isDemoConnected = !isRealConnected && !!savedManualAddress;
  const isAnyConnected = isRealConnected || isDemoConnected;
  
  const displayAddress = isRealConnected 
    ? publicKey.toString() 
    : (savedManualAddress || '');

  const connectionTypeLabel = isRealConnected 
    ? `${activeWallet?.adapter.name || 'Solana'}` 
    : 'Modo Demo / Manual';

  // Find Phantom and Solflare from adapters list
  const phantom = wallets.find((w) => w.adapter.name === 'Phantom');
  const solflare = wallets.find((w) => w.adapter.name === 'Solflare');

  // Deep Link variables
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const phantomDeepLink = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`;
  const solflareDeepLink = `https://solflare.com/ul/v1/browse?url=${encodeURIComponent(currentUrl)}&ref=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`;

  return (
    <div className="w-full text-left font-sans" id="solana-wallet-core">
      {/* 1. Connected State (Vibrant responsive card) */}
      {isAnyConnected ? (
        <div className="p-4 rounded-2xl bg-zinc-950/50 border border-brand-malva-light/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isRealConnected ? 'bg-emerald-500' : 'bg-purple-500 animate-pulse'}`} />
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                Solana Devnet
              </span>
            </div>
            
            <div className="px-2 py-0.5 rounded text-[10px] uppercase font-black bg-brand-malva/10 text-brand-malva-light border border-brand-malva/20">
              {connectionTypeLabel}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2.5 mt-0.5">
            <div 
              onClick={() => {
                navigator.clipboard.writeText(displayAddress);
                alert('¡Dirección copiada del portapapeles!');
              }}
              className="flex items-center gap-2 overflow-hidden bg-black/40 hover:bg-black/60 px-3 py-2.5 rounded-xl border border-white/5 flex-1 select-all cursor-pointer transition-all active:scale-[0.98]" 
              title="Copiar Address"
            >
              <Icon name="Shield" size={13} className="text-brand-malva-light shrink-0" />
              <span className="text-[11px] font-mono font-bold text-white truncate">
                {formatAddress(displayAddress)}
              </span>
              <Icon name="Copy" size={11} className="text-zinc-500 ml-auto shrink-0" />
            </div>

            <button
              onClick={handleDisconnect}
              className="px-3.5 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-red-500/20 shadow-sm"
              title="Desconectar"
            >
              <Icon name="LogOut" size={12} className="shrink-0" />
              <span className="hidden xs:inline">Salir</span>
            </button>
          </div>
        </div>
      ) : (
        // 2. Disconnected State (Tabs Option for optimal desktop / mobile usability)
        <div className="space-y-3.5">
          {errorMsg && (
            <div className="text-[10px] text-red-400 font-bold p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 leading-relaxed">
              <Icon name="AlertCircle" size={14} className="shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tab buttons */}
          <div className="flex bg-zinc-950/60 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab('extension')}
              className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'extension' 
                  ? 'bg-gradient-to-r from-brand-malva to-brand-dark text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Wallet App / Ext
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-1.5 text-center text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'manual' 
                  ? 'bg-gradient-to-r from-brand-malva to-brand-dark text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Demo / Modo Manual
            </button>
          </div>

          {activeTab === 'extension' ? (
            <div className="space-y-3">
              {/* Responsive instructions indicator */}
              {isMobile ? (
                <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl">
                  <p className="text-[10px] text-white/90 leading-relaxed font-semibold">
                    📱 <span className="text-brand-malva-light font-black">¿Estás en tu Tecno Spark 20?</span> Haz clic en cualquiera para abrir la miniapp directamente dentro de su navegador seguro:
                  </p>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2.5">
                {/* Phantom Grid Item */}
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (isMobile) {
                        window.open(phantomDeepLink, '_blank');
                      } else if (phantom) {
                        handleWalletSelect(phantom);
                      } else {
                        window.open('https://phantom.app/', '_blank');
                      }
                    }}
                    className="py-3 px-3 bg-purple-950/10 hover:bg-purple-950/20 border border-purple-500/20 hover:border-purple-500/40 rounded-xl text-xs font-bold transition-all active:scale-[0.98] flex flex-col items-center gap-1.5 justify-center cursor-pointer text-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center text-purple-400">
                      <Icon name="Zap" size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold text-white text-[11px]">Phantom</p>
                      <p className="text-[9px] text-purple-300 font-bold mt-0.5">
                        {isMobile ? 'Abrir en App' : (phantom?.readyState === WalletReadyState.NotDetected ? 'Instalar' : 'Conectar')}
                      </p>
                    </div>
                  </button>
                </div>

                {/* Solflare Grid Item */}
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (isMobile) {
                        window.open(solflareDeepLink, '_blank');
                      } else if (solflare) {
                        handleWalletSelect(solflare);
                      } else {
                        window.open('https://solflare.com/', '_blank');
                      }
                    }}
                    className="py-3 px-3 bg-orange-950/10 hover:bg-orange-950/20 border border-orange-500/20 hover:border-orange-500/40 rounded-xl text-xs font-bold transition-all active:scale-[0.98] flex flex-col items-center gap-1.5 justify-center cursor-pointer text-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                      <Icon name="Hexagon" size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold text-white text-[11px]">Solflare</p>
                      <p className="text-[9px] text-orange-300 font-bold mt-0.5">
                        {isMobile ? 'Abrir en App' : (solflare?.readyState === WalletReadyState.NotDetected ? 'Instalar' : 'Conectar')}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* standard active connection alert for desktop extensions */}
              {activeWallet && !connected && !isMobile && (
                <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between gap-2 animate-in fade-in">
                  <span className="text-[9px] font-bold text-zinc-400 animate-pulse">
                    Enlazando con {activeWallet.adapter.name}...
                  </span>
                  <button
                    type="button"
                    onClick={() => connect().catch((err: any) => setErrorMsg(err.message || 'Error de firma'))}
                    className="px-2.5 py-1 bg-brand-malva text-white rounded text-[9px] font-black uppercase tracking-wider"
                  >
                    Aprobar Firma
                  </button>
                </div>
              )}
            </div>
          ) : (
            // 3. Manual Connection Tab (Extremely useful for Android Spark 20 demo when wallets are not installed)
            <div className="space-y-3 p-3.5 bg-zinc-950/40 border border-white/5 rounded-xl">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                  Dirección Solana (Devnet)
                </label>
                <p className="text-[9px] text-zinc-500 font-semibold leading-normal">
                  Pega cualquier address de Solana para simular el inicio de sesión y probar las funciones móviles de HabitLead:
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Ej: 7x8AA...kP91"
                  value={manualAddressInput}
                  onChange={(e) => setManualAddressInput(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-brand-malva/50"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleManualConnect()}
                    className="flex-1 py-2 bg-gradient-to-r from-brand-malva to-brand-dark hover:from-brand-malva-light hover:to-brand-malva text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow text-center border border-brand-malva/30"
                  >
                    Simular Enlace Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualAddressInput('7x8Ac9kPYGq8vXmG8A5nJbC8sDhLp3W3z8r5mB7xHnK7')}
                    className="px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white text-[10px] font-semibold rounded-xl"
                    title="Usar dirección de prueba"
                  >
                    Auto-completar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
