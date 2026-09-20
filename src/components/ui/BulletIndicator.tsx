import React from 'react';

interface BulletIndicatorProps {
  currentHp: number;
  maxHp: number;
  size?: 'sm' | 'md' | 'lg';
}

export const BulletIndicator: React.FC<BulletIndicatorProps> = ({
  currentHp,
  maxHp,
  size = 'md',
}) => {
  const bulletSize = size === 'sm' ? 'w-3 h-6' : size === 'lg' ? 'w-5 h-9' : 'w-4 h-7';

  return (
    <div className="flex items-center gap-1.5" title={`میزان جان: ${currentHp} از ${maxHp}`}>
      {Array.from({ length: maxHp }).map((_, i) => {
        const isFilled = i < currentHp;
        return (
          <div
            key={i}
            className={`relative rounded-t-full transition-all duration-300 ${bulletSize} ${
              isFilled
                ? 'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-sm shadow-amber-500/50 border border-amber-200/80 scale-100'
                : 'bg-zinc-800/80 border border-zinc-700/50 opacity-40 scale-95'
            }`}
          >
            {/* Bullet tip highlight */}
            {isFilled && (
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/70 rounded-full" />
            )}
            {/* Bullet base ring */}
            <div
              className={`absolute bottom-0 inset-x-0 h-1.5 border-t ${
                isFilled ? 'bg-amber-800 border-amber-600' : 'bg-zinc-900 border-zinc-700'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
};
