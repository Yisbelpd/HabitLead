import React, { useState } from 'react';
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
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Truncate public key to format 7x8A...kP91
  const formatAddress = (pubkeyString: string) => {
    if (pubkeyString.length < 10) return pubkeyString;
    return `${pubkeyString.slice(0, 5)}...${pubkeyString.slice(-4)}`;
  };

  // Find Phantom and Solflare from adapters list
  const phantom = wallets.find((w) => w.adapter.name === 'Phantom');
  const solflare = wallets.find((w) => w.adapter.name === 'Solflare');

  const handleWalletSelect = async (selectedWallet: any) => {
    try {
      setErrorMsg(null);
      setDropdownOpen(false);
      
      // If the selected wallet is already selected but not connected
      if (activeWallet?.adapter.name === selectedWallet.adapter.name) {
        if (!connected) {
          await connect();
        }
      } else {
        await select(selectedWallet.adapter.name);
        // Note: some adapters connect auto-selectively, if not we will connect on active change
      }
    } catch (err: any) {
      console.error("Wallet selection error:", err);
      setErrorMsg(err.message || 'Error al conectar la wallet');
    }
  };

  const handleDisconnect = async () => {
    try {
      setErrorMsg(null);
      await disconnect();
    } catch (err: any) {
      console.error("Wallet disconnect error:", err);
    }
  };

  // Status computation
  let statusText = 'Desconectado';
  let statusColor = 'bg-zinc-400';

  if (connecting) {
    statusText = 'Conectando...';
    statusColor = 'bg-amber-500 animate-pulse';
  } else if (connected && publicKey) {
    statusText = 'Conectado';
    statusColor = 'bg-emerald-500';
  }

  // Brand icons / colors mapping for customized experience
  const getWalletInfo = (name: string) => {
    switch (name.toLowerCase()) {
      case 'phantom':
        return {
          bg: 'hover:bg-purple-600/10 hover:border-purple-500/50',
          text: 'text-purple-400',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        };
      case 'solflare':
        return {
          bg: 'hover:bg-orange-500/10 hover:border-orange-500/50',
          text: 'text-orange-400',
          badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        };
      default:
        return {
          bg: 'hover:bg-zinc-800',
          text: 'text-zinc-300',
          badge: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        };
    }
  };

  return (
    <div className="relative inline-block text-left w-full" id="solana-wallet-selector">
      {/* Connected State display */}
      {connected && publicKey ? (
        <div className="flex flex-col gap-2 p-4 bg-zinc-900/50 border border-brand-malva/30 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
              <span className="text-xs font-semibold text-zinc-300">
                Solana Devnet
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold bg-zinc-950/40 text-zinc-200 border border-white/5 shadow-sm">
              {activeWallet?.adapter.icon && (
                <img src={activeWallet.adapter.icon} alt={activeWallet.adapter.name} className="w-3.5 h-3.5 object-contain" referrerPolicy="no-referrer" />
              )}
              <span>{activeWallet?.adapter.name || 'Wallet'}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-3 mt-1">
            <div className="flex items-center gap-2 overflow-hidden bg-black/30 px-3 py-2 rounded-xl border border-white/5 flex-1 select-all cursor-pointer" title="Copiar Address">
              <Icon name="Shield" size={13} className="text-brand-malva-light shrink-0" />
              <span className="text-xs font-mono font-bold text-white truncate">
                {formatAddress(publicKey.toString())}
              </span>
            </div>
            
            <button
              onClick={handleDisconnect}
              className="px-3 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-red-500/20 shadow-sm"
              title="Desconectar Wallet"
            >
              <Icon name="LogOut" size={12} />
              <span>Salir</span>
            </button>
          </div>
        </div>
      ) : (
        // Disconnected / Connection Selection Form
        <div className="space-y-3">
          {errorMsg && (
            <div className="text-[11px] text-red-400 font-bold p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <Icon name="AlertCircle" size={14} className="shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Trigger selector button */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Phantom Option */}
            {phantom ? (
              <button
                type="button"
                onClick={() => handleWalletSelect(phantom)}
                disabled={connecting}
                className={`py-3 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] flex flex-col items-center gap-2 justify-center cursor-pointer relative overflow-hidden ${
                  activeWallet?.adapter.name === 'Phantom' && connecting ? 'border-purple-500 bg-purple-900/10' : 'hover:border-purple-500/45'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-600/10 flex items-center justify-center p-1 shrink-0">
                  {phantom.adapter.icon ? (
                    <img src={phantom.adapter.icon} alt="Phantom" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <svg viewBox="0 0 128 128" className="w-6 h-6 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="128" height="128" rx="32" fill="#512DA8" />
                      <path d="M64 36c-17.67 0-32 14.33-32 32 0 14.4 7.6 20.8 12.8 25.6 1.6 1.6 3.2 1.6 4.8 0 3.2-3.2 4.8-4.8 8-8s8 1.6 12.8 1.6c4.8 0 9.6-1.6 12.8-1.6 3.2 3.2 4.8 4.8 8 8 1.6 1.6 3.2 1.6 4.8 0 5.2-4.8 12.8-11.2 12.8-25.6 0-17.67-14.33-32-32-32zm-12.8 24c2.65 0 4.8 2.15 4.8 4.8s-2.15 4.8-4.8 4.8-4.8-2.15-4.8-4.8 2.15-4.8 4.8-4.8zm25.6 0c2.65 0 4.8 2.15 4.8 4.8s-2.15 4.8-4.8 4.8-4.8-2.15-4.8-4.8 2.15-4.8 4.8-4.8z" fill="#FFF" />
                    </svg>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-extrabold text-white text-[11px]">Phantom</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5 font-semibold">
                    {phantom.readyState === WalletReadyState.NotDetected ? 'Conectar (Instalar)' : 'Conectar'}
                  </p>
                </div>
                {phantom.readyState === WalletReadyState.NotDetected && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-500" title="Instalar / Enlazar" />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => window.open('https://phantom.app/', '_blank')}
                className="py-3 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-2 justify-center cursor-pointer"
              >
                <svg viewBox="0 0 128 128" className="w-6 h-6 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="128" height="128" rx="32" fill="#512DA8" />
                  <path d="M64 36c-17.67 0-32 14.33-32 32 0 14.4 7.6 20.8 12.8 25.6 1.6 1.6 3.2 1.6 4.8 0 3.2-3.2 4.8-4.8 8-8s8 1.6 12.8 1.6c4.8 0 9.6-1.6 12.8-1.6 3.2 3.2 4.8 4.8 8 8 1.6 1.6 3.2 1.6 4.8 0 5.2-4.8 12.8-11.2 12.8-25.6 0-17.67-14.33-32-32-32zm-12.8 24c2.65 0 4.8 2.15 4.8 4.8s-2.15 4.8-4.8 4.8-4.8-2.15-4.8-4.8 2.15-4.8 4.8-4.8zm25.6 0c2.65 0 4.8 2.15 4.8 4.8s-2.15 4.8-4.8 4.8-4.8-2.15-4.8-4.8 2.15-4.8 4.8-4.8z" fill="#FFF" />
                </svg>
                <span className="text-[10px] text-zinc-400 font-bold">Instalar Phantom</span>
              </button>
            )}

            {/* Solflare Option */}
            {solflare ? (
              <button
                type="button"
                onClick={() => handleWalletSelect(solflare)}
                disabled={connecting}
                className={`py-3 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] flex flex-col items-center gap-2 justify-center cursor-pointer relative overflow-hidden ${
                  activeWallet?.adapter.name === 'Solflare' && connecting ? 'border-orange-500 bg-orange-950/10' : 'hover:border-orange-500/45'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center p-1 shrink-0">
                  {solflare.adapter.icon ? (
                    <img src={solflare.adapter.icon} alt="Solflare" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <svg viewBox="0 0 128 128" className="w-6 h-6 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="128" height="128" rx="32" fill="#FC841C" />
                      <path d="M64 32c17.67 0 32 14.33 32 32v12.8c0 3.2-1.6 4.8-4.8 4.8h-6.4c-3.2 0-4.8-1.6-4.8-4.8V64c0-8.84-7.16-16-16-16s-16 7.16-16 16v12.8c0 3.2-1.6 4.8-4.8 4.8h-6.4C36.8 81.6 35.2 80 35.2 76.8V64c0-17.67 14.33-32 32-32z" fill="#FFF" />
                    </svg>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-extrabold text-white text-[11px]">Solflare</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5 font-semibold">
                    {solflare.readyState === WalletReadyState.NotDetected ? 'Conectar (Instalar)' : 'Conectar'}
                  </p>
                </div>
                {solflare.readyState === WalletReadyState.NotDetected && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-orange-500" title="Instalar / Enlazar" />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => window.open('https://solflare.com/', '_blank')}
                className="py-3 px-4 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-2 justify-center cursor-pointer"
              >
                <svg viewBox="0 0 128 128" className="w-6 h-6 object-contain" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="128" height="128" rx="32" fill="#FC841C" />
                  <path d="M64 32c17.67 0 32 14.33 32 32v12.8c0 3.2-1.6 4.8-4.8 4.8h-6.4c-3.2 0-4.8-1.6-4.8-4.8V64c0-8.84-7.16-16-16-16s-16 7.16-16 16v12.8c0 3.2-1.6 4.8-4.8 4.8h-6.4C36.8 81.6 35.2 80 35.2 76.8V64c0-17.67 14.33-32 32-32z" fill="#FFF" />
                </svg>
                <span className="text-[10px] text-zinc-400 font-bold">Instalar Solflare</span>
              </button>
            )}
          </div>

          {/* Connection action info when active wallet selected but not yet connected */}
          {activeWallet && !connected && (
            <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-between gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-[11px] font-bold text-zinc-300">
                  {connecting ? `Estableciendo enlace con ${activeWallet.adapter.name}...` : `Listo para enlazar con ${activeWallet.adapter.name}`}
                </span>
              </div>
              
              {!connecting && (
                <button
                  type="button"
                  onClick={() => connect().catch((err: any) => setErrorMsg(err.message || 'Firma rechazada'))}
                  className="px-3 py-1 bg-brand-malva hover:bg-brand-dark text-white rounded-lg text-[10px] font-extrabold shadow transition-all cursor-pointer"
                >
                  Confirmar Enlace
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
