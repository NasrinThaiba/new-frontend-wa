import React, { useEffect, useRef } from 'react';
import { User } from '../../types';
import { CheckIcon, DblCheckIcon } from './Icons';

// ─── Avatar ────────────────────────────────────────────────────────────────
type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
const szMap: Record<AvatarSize, string> = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-14 h-14', xl: 'w-16 h-16' };
const dotMap: Record<AvatarSize, string> = { sm: 'w-2 h-2 bottom-0 right-0', md: 'w-2.5 h-2.5 bottom-0 right-0', lg: 'w-3 h-3 bottom-0.5 right-0.5', xl: 'w-3.5 h-3.5 bottom-0.5 right-0.5' };

export const Avatar: React.FC<{ user?: User | null; size?: AvatarSize; showOnline?: boolean }> = ({
  user, size = 'md', showOnline = false,
}) => (
  <div className="relative flex-shrink-0">
    <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
      alt={user?.name ?? 'User'}
      className={`${szMap[size]} rounded-full object-cover bg-[#2a3942]`}
    />
    {showOnline && user?.isOnline && (
      <span className={`absolute ${dotMap[size]} bg-[#00a884] rounded-full border-2 border-[#111b21]`} />
    )}
  </div>
);

// ─── ContextMenu ────────────────────────────────────────────────────────────
export interface ContextMenuItem { label: string; action: () => void; danger?: boolean }

export const ContextMenu: React.FC<{ x: number; y: number; items: ContextMenuItem[]; onClose: () => void }> = ({
  x, y, items, onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null); //check the position where mouse clicked

  useEffect(() => {
    const handleFunction = (e: MouseEvent) => {
       if (!ref.current?.contains(e.target as Node)) onClose()
       };
    document.addEventListener('mousedown', handleFunction);
    return () => document.removeEventListener('mousedown', handleFunction);
  }, [onClose]);

  const ax = Math.min(x, window.innerWidth - 200);
  const ay = Math.min(y, window.innerHeight - items.length * 44);

  return (
    <div ref={ref} style={{ top: ay, left: ax }}
      className="fixed z-[100] bg-[#233138] rounded-xl shadow-2xl py-2 min-w-48 border border-[#2a3942]">
      {items.map((item, i) => (
        <button key={i} onClick={() => { item.action(); onClose(); }}
          className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#2a3942] ${item.danger ? 'text-red-400' : 'text-[#e9edef]'}`}>
          {item.label}
        </button>
      ))}
    </div>
  );
};

// ─── EmojiPicker ────────────────────────────────────────────────────────────
const EMOJIS = ['😀','😂','🥰','😍','🤩','😎','🥳','😭','😱','🤔','👍','👎','❤️','🔥','🎉','🚀','💯','✅','🙏','👋','😄','🤣','😊','😇','🥺','😴','🤯','🥴','🤗','😅','💪','🎵','🍕','☕','🌟','💡','📱','💻','🎮','🏆'];

export const EmojiPicker: React.FC<{ onSelect: (e: string) => void; onClose: () => void }> = ({
  onSelect, onClose,
}) => (
  <div className="absolute bottom-16 left-0 z-50 bg-[#233138] rounded-2xl shadow-2xl p-3 w-72 border border-[#2a3942]">
    <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
      {EMOJIS.map((e) => (
        <button key={e} onClick={() => { onSelect(e); onClose(); }}
          className="text-xl hover:bg-[#2a3942] rounded-lg p-1.5 transition-colors">{e}</button>
      ))}
    </div>
  </div>
);

// ─── MessageTicks ────────────────────────────────────────────────────────────
export const MessageTicks: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'sent') return <CheckIcon />;
  if (status === 'delivered') return <DblCheckIcon blue={false} />;
  if (status === 'read') return <DblCheckIcon blue={true} />;
  return null;
};

// ─── Spinner ─────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: string }> = ({ size = 'w-6 h-6' }) => (
  <svg className={`animate-spin ${size} text-[#00a884]`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
);
