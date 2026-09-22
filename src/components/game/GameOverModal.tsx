import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Role, PublicPlayer } from '@/lib/game-engine/types';
import { getRoleFa } from '@/lib/game-engine/actions';

interface GameOverModalProps {
  winner: Role;
  players: PublicPlayer[];
  onBackToLobby: () => void;
  onViewTable?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  players,
  onBackToLobby,
  onViewTable,
}) => {
  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
  }, []);

  const getWinnerDescription = () => {
    switch (winner) {
      case 'sheriff':
        return {
          title: '⭐ پیروزی قانون و کلانتر!',
          desc: 'تمام یاغی‌ها و خائن سرکوب شدند و نظم و آرامش به غرب وحشی بازگشت.',
          badgeColor: 'text-amber-400 border-amber-500 bg-amber-500/10',
        };
      case 'outlaw':
        return {
          title: '💀 پیروزی یاغی‌های بی‌رحم!',
          desc: 'کلانتر کشته شد و شهر به تصرف یاغی‌ها درآمد!',
          badgeColor: 'text-red-400 border-red-500 bg-red-500/10',
        };
      case 'renegade':
        return {
          title: '👑 پیروزی انفرادی خائن (رنگید)!',
          desc: 'خائن همه را فریب داد، کلانتر را در دوئل آخر شکست داد و به تنهایی حاکم شهر شد!',
          badgeColor: 'text-purple-400 border-purple-500 bg-purple-500/10',
        };
      default:
        return {
          title: '⭐ پیروزی قانون و کلانتر!',
          desc: 'نظم و آرامش به غرب وحشی بازگشت.',
          badgeColor: 'text-amber-400 border-amber-500 bg-amber-500/10',
        };
    }
  };

  const winInfo = getWinnerDescription();

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="relative bg-saloon-900 border-2 border-amber-500/60 rounded-3xl p-6 max-w-xl w-full shadow-2xl text-center animate-in zoom-in-95 duration-300">
        {onViewTable && (
          <button
            onClick={onViewTable}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-saloon-800 hover:bg-saloon-700 text-zinc-300 hover:text-white flex items-center justify-center text-sm font-bold border border-saloon-700 transition-colors"
            title="مشاهده میز بازی"
          >
            ✕
          </button>
        )}
        <div className="text-4xl mb-2">🏆</div>
        <h2 className="text-2xl font-black text-amber-300 mb-2">{winInfo.title}</h2>
        <p className="text-xs text-zinc-300 mb-6 px-4">{winInfo.desc}</p>

        {/* Roles Reveal List */}
        <div className="bg-saloon-950/80 rounded-2xl p-4 border border-saloon-800 mb-6 text-right">
          <h4 className="text-xs font-bold text-amber-200 mb-3 border-b border-saloon-800 pb-2">
            🎭 هویت واقعی تمام بازیکنان:
          </h4>
          <div className="space-y-2">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-saloon-900/60 border border-saloon-800/40"
              >
                <div className="flex items-center gap-2">
                  <span>{p.isEliminated ? '💀' : '🤠'}</span>
                  <span className="font-bold text-zinc-200">{p.name}</span>
                  {p.character && (
                    <span className="text-[10px] text-zinc-400">({p.character.nameFa})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300">{getRoleFa(p.role as Role)}</span>
                  {p.isEliminated && (
                    <span className="text-[10px] text-red-400 font-semibold">(کشته شده)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          {onViewTable && (
            <button
              onClick={onViewTable}
              className="flex-1 bg-saloon-800 hover:bg-saloon-700 active:scale-95 text-amber-200 font-bold text-xs sm:text-sm py-3 px-4 rounded-2xl border border-amber-600/40 transition-all flex items-center justify-center gap-1.5 shadow"
            >
              <span>🔍</span>
              <span>مشاهده میز بازی و وقایع</span>
            </button>
          )}
          <button
            onClick={onBackToLobby}
            className="flex-1 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-2xl shadow-xl border border-amber-400 transition-all flex items-center justify-center gap-1.5"
          >
            <span>🔄</span>
            <span>بازگشت به لابی</span>
          </button>
        </div>
      </div>
    </div>
  );
};
