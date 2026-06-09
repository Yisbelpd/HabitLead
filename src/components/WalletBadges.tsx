import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { LocalBadge, saveBadgeProof } from '../lib/walletPersistence';
import { Icon } from './Icon';

interface WalletBadgesProps {
  walletAddress: string;
  totalCheckins: number;
  currentStreak: number;
  badges: LocalBadge[];
  onBadgeVerified?: () => void;
}

export function WalletBadges({ walletAddress, totalCheckins, currentStreak, badges, onBadgeVerified }: WalletBadgesProps) {
  const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}`;
  const { sendTransaction } = useWallet();

  const [verifyingBadgeId, setVerifyingBadgeId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleVerifyOnSolana = async (badgeId: string, badgeName: string) => {
    setVerifyingBadgeId(badgeId);
    setStatusText(`Verificando "${badgeName}" en blockchain Solana Devnet...`);
    setErrorText(null);

    try {
      if (!walletAddress) {
        throw new Error("No hay wallet conectada.");
      }

      // We connect to public Devnet RPC
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const publicKeyObj = new PublicKey(walletAddress);

      // Construct a random number nonce
      const nonce = Math.floor(Math.random() * 1000000);
      const isoDate = new Date().toISOString();
      const memoText = `HABITLEAD_PROOF:v1|badge=${badgeId}|wallet=${walletAddress}|date=${isoDate}|nonce=${nonce}`;

      const transaction = new Transaction();
      
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKeyObj;

      // SPL Memo Program v2
      const MEMO_PROG_ID = new PublicKey('MemoSzerg2eevX2yzceasgXjfEn9XuhgEAtg61Cdp7');
      const data = Buffer.from(memoText);

      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKeyObj, isSigner: true, isWritable: false }
        ],
        programId: MEMO_PROG_ID,
        data: data
      });

      transaction.add(instruction);

      setStatusText("Firma requerida: Aprueba la transacción en tu wallet...");
      const signature = await sendTransaction(transaction, connection);

      setStatusText("Confirmando transacción en Devnet...");
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      // Save on-chain proof in local storage
      saveBadgeProof(walletAddress, badgeId, {
        txSignature: signature,
        memo: memoText,
        verified_at: isoDate,
        cluster: 'devnet'
      });

      setStatusText(`¡Insignia "${badgeName}" verificada con éxito en Solana!`);
      
      if (onBadgeVerified) {
        onBadgeVerified();
      }
    } catch (error: any) {
      console.error("Transacción fallida en Solana Devnet:", error);
      setErrorText(error?.message || "Fallo al enviar la transacción.");
    } finally {
      setVerifyingBadgeId(null);
    }
  };

  // Find progress icon or render custom
  const getBadgeIcon = (id: string) => {
    switch (id) {
      case 'badge_streak_7':
        return 'Zap';
      case 'badge_checkins_30':
        return 'Award';
      case 'badge_full_balance':
        return 'Activity';
      default:
        return 'Trophy';
    }
  };

  const getBadgeColor = (status: 'locked' | 'unlocked') => {
    return status === 'unlocked'
      ? 'from-[#3c1d5d] to-[#1a1132] border-[#a78bfa]/65 text-white'
      : 'from-zinc-900 via-zinc-950 to-black border-zinc-800 opacity-60 text-zinc-400';
  };

  return (
    <div className="bg-[#181122]/90 border border-brand-malva/30 rounded-3xl p-6 shadow-xl relative overflow-hidden mb-8" id="wallet-badges-dashboard">
      <div className="absolute right-0 top-0 w-48 h-48 bg-brand-malva-light/10 rounded-full blur-[80px]" />
      <div className="absolute left-0 bottom-0 w-32 h-32 bg-brand-malva/10 rounded-full blur-[50px]" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
            <h2 className="text-sm font-black tracking-widest text-[#d8b4fe] uppercase font-mono">
              Demo Bootcamp: Wallet & Badges
            </h2>
          </div>
          <p className="text-xs text-white/75 font-semibold">
            Progreso exclusivo y automatización local para la wallet conectada. 
          </p>
        </div>
        <div className="bg-black/35 border border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Icon name="ShieldCheck" size={15} className="text-purple-400" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400 font-bold leading-none uppercase">Address Conectada</p>
            <p className="text-xs font-mono font-black text-white mt-1 leading-none select-all" title="Copiar">{truncatedAddress}</p>
          </div>
        </div>
      </div>

      {/* Grid of basic stats */}
      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
            <Icon name="CheckCircle2" size={20} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Check-ins Totales</span>
            <span className="text-xl font-bold font-mono text-white leading-tight">{totalCheckins}</span>
          </div>
        </div>

        <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
            <Icon name="Zap" size={20} />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Racha de Días</span>
            <span className="text-xl font-bold font-mono text-white leading-tight">{currentStreak} {currentStreak === 1 ? 'día' : 'días'}</span>
          </div>
        </div>
      </div>

      {/* Solana feedback messages */}
      {(statusText || errorText) && (
        <div className="mb-6 relative z-10 space-y-2">
          {statusText && (
            <div className="bg-purple-950/40 border border-purple-500/20 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs text-purple-200">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping shrink-0" />
              <span>{statusText}</span>
            </div>
          )}
          {errorText && (
            <div className="bg-red-950/40 border border-red-500/20 px-4 py-3 rounded-2xl flex items-center gap-3 text-xs text-red-300">
              <Icon name="AlertTriangle" size={16} className="text-red-400 shrink-0" />
              <span>Error: {errorText}</span>
            </div>
          )}
        </div>
      )}

      {/* Row of the three custom bootcamp badges */}
      <div className="space-y-4 mb-6 relative z-10">
        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1">
          <Icon name="Award" size={13} className="text-[#a78bfa]" />
          <span>Insignias de la wallet ({badges.filter(b => b.status === 'unlocked').length} de 3)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {badges.map((badge) => {
            const isUnlocked = badge.status === 'unlocked';
            const iconName = getBadgeIcon(badge.id);

            return (
              <div
                key={badge.id}
                className={`flex flex-col justify-between p-4.5 rounded-2xl border bg-gradient-to-tr transition-all duration-300 relative overflow-hidden group ${getBadgeColor(badge.status)}`}
              >
                {/* Glow effects on hover for unlocked ones */}
                {isUnlocked && (
                  <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-purple-500/15 rounded-full blur-xl group-hover:scale-125 transition-transform" />
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shadow-inner ${
                      isUnlocked 
                        ? 'bg-purple-900/30 border-purple-500/40 text-purple-200' 
                        : 'bg-zinc-900 border-zinc-805 text-zinc-500'
                    }`}>
                      <Icon name={iconName} size={16} />
                    </div>
                    {isUnlocked ? (
                      <span className="text-[9px] font-mono leading-none tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full font-bold">
                        Completado!
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono leading-none tracking-wider text-zinc-400 bg-zinc-800/40 px-2 py-1 rounded-full font-bold">
                        Pendiente
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-extrabold text-white truncate leading-tight mb-1">{badge.name}</h4>
                  <p className="text-[10px] text-white/55 leading-relaxed font-semibold mb-3">
                    {badge.description}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 mt-auto pt-2">
                  <div className="flex justify-between items-center text-[9px] font-mono font-bold">
                    <span className="text-zinc-500">Progreso</span>
                    <span className={isUnlocked ? 'text-[#a78bfa]' : 'text-zinc-400'}>{badge.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlocked 
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-400' 
                          : 'bg-zinc-700'
                      }`}
                      style={{ width: `${badge.progress}%` }}
                    />
                  </div>
                </div>

                {/* Date of Unlock */}
                {isUnlocked && badge.unlocked_at && (
                  <div className="mt-3 pt-2 border-t border-white/5 text-[9px] text-[#a78bfa] font-semibold flex items-center gap-1.5">
                    <Icon name="Calendar" size={10} />
                    <span>Conseguida: {badge.unlocked_at}</span>
                  </div>
                )}

                {/* Proof Solana status & Verify Button */}
                {isUnlocked && (
                  <div className="mt-2.5 pt-2.5 border-t border-white/5 space-y-2">
                    {badge.txSignature ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[9.5px] text-emerald-400 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Verificado On-Chain</span>
                        </div>
                        <p className="text-[9px] text-zinc-400 truncate max-w-full font-mono" title={badge.txSignature}>
                          Tx: {badge.txSignature.slice(0, 12)}...{badge.txSignature.slice(-8)}
                        </p>
                        <a
                          href={`https://explorer.solana.com/tx/${badge.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[9px] font-bold text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          <Icon name="ExternalLink" size={9} />
                          <span>Solana Explorer</span>
                        </a>
                      </div>
                    ) : (
                      <div>
                        <button
                          type="button"
                          disabled={verifyingBadgeId !== null}
                          onClick={() => handleVerifyOnSolana(badge.id, badge.name)}
                          className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 text-white font-bold text-[10px] py-1.5 px-3 rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          {verifyingBadgeId === badge.id ? (
                            <>
                              <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                              <span>Verificando...</span>
                            </>
                          ) : (
                            <>
                              <Icon name="Share2" size={10} />
                              <span>Verificar en Solana</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer informative message */}
      <div className="bg-[#2e1d40]/30 border border-[#a78bfa]/20 p-3.5 rounded-2xl flex gap-3 relative z-10">
        <Icon name="HelpCircle" size={16} className="text-[#c084fc] shrink-0 mt-0.5" />
        <p className="text-[10.5px] text-[#e9d5ff] leading-relaxed font-semibold">
          <strong>Aviso de Demo Local:</strong> Esta versión de cortesía guarda tu progreso localmente asociado a tu wallet. En la próxima versión, tus logros se sincronizarán directamente con Anchor para tener proof verificado y tokens acuñados directamente en la blockchain de Solana.
        </p>
      </div>
    </div>
  );
}
