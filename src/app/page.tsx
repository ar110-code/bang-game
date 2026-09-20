'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/ui/BrandLogo';

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('لطفاً نام مستعار خود را وارد کنید.');
      return;
    }
    let storedId = sessionStorage.getItem('bang_player_id');
    if (!storedId) {
      storedId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      sessionStorage.setItem('bang_player_id', storedId);
    }
    const newRoomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    sessionStorage.setItem('bang_player_name', playerName.trim());
    router.push(`/room/${newRoomCode}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('لطفاً نام مستعار خود را وارد کنید.');
      return;
    }
    if (!roomCode.trim()) {
      setError('لطفاً کد اتاق را وارد کنید.');
      return;
    }
    let storedId = sessionStorage.getItem('bang_player_id');
    if (!storedId) {
      storedId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      sessionStorage.setItem('bang_player_id', storedId);
    }
    sessionStorage.setItem('bang_player_name', playerName.trim());
    router.push(`/room/${roomCode.trim().toUpperCase()}`);
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-saloon-900 via-saloon-950 to-black">
      {/* Saloon Sign & Official Logo Header */}
      <div className="flex flex-col items-center text-center max-w-xl mb-7">
        <div className="mb-4">
          <BrandLogo variant="full" size="xl" />
        </div>
        <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-1 rounded-full text-amber-400 text-xs font-bold mb-3 shadow-sm">
          <span>⭐</span>
          <span>بازی آنلاین چندنفره وسترن</span>
          <span>⭐</span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-md mx-auto font-medium">
          پرطرفدارترین بازی کارتی نقش‌مخفی دنیا؛ کلانتر به دنبال برقراری نظم، یاغی‌ها در کمین کلانتر و خائن چشم‌انتظار دوئل نهایی!
        </p>
      </div>

      {/* Main Entrance Card */}
      <div className="w-full max-w-md bg-saloon-900/90 border border-saloon-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {error && (
          <div className="mb-4 bg-red-950/80 border border-red-700 text-red-300 text-xs p-3 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Nickname Input */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-amber-200 mb-2">
            نام یا لقب شما در غرب وحشی:
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              setError('');
            }}
            placeholder="مثلاً: بیلی خوش‌دست، لوک خوش‌شانس..."
            maxLength={20}
            className="w-full bg-saloon-950 border border-saloon-700 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-center font-bold"
          />
        </div>

        {/* Create Room Button */}
        <button
          onClick={handleCreateRoom}
          className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-saloon-950 font-black text-sm py-3.5 px-4 rounded-2xl shadow-lg border border-amber-300 transition-all active:scale-98 flex items-center justify-center gap-2 mb-6"
        >
          <span>⭐ ساخت اتاق جدید و دعوت دوستان</span>
        </button>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-saloon-700"></div>
          <span className="flex-shrink mx-4 text-xs text-zinc-500 font-semibold">یا</span>
          <div className="flex-grow border-t border-saloon-700"></div>
        </div>

        {/* Join Room Form */}
        <form onSubmit={handleJoinRoom} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-1.5">
              ورود با کد اتاق:
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="کد ۵ حرفی اتاق (مثلاً: WXYZ7)"
              maxLength={6}
              className="w-full bg-saloon-950 border border-saloon-700 rounded-2xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-center font-mono tracking-widest font-bold uppercase"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-saloon-800 hover:bg-saloon-700 text-amber-200 border border-amber-600/50 font-bold text-sm py-3 px-4 rounded-2xl shadow transition-all active:scale-98 flex items-center justify-center gap-1.5"
          >
            <span>🚪 ملحق شدن به سالون بازی</span>
          </button>
        </form>
      </div>

      {/* Roles Cheat Sheet Cards */}
      <div className="w-full max-w-4xl mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-saloon-900/60 border border-amber-500/30 rounded-2xl p-4 text-center">
          <div className="text-xl mb-1">⭐</div>
          <div className="font-bold text-amber-400 text-sm mb-1">کلانتر (Sheriff)</div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            تنها نقشی که همه او را می‌شناسند. باید تمام یاغی‌ها و خائن را بکشد تا پیروز شود.
          </p>
        </div>

        <div className="bg-saloon-900/60 border border-blue-500/30 rounded-2xl p-4 text-center">
          <div className="text-xl mb-1">🛡️</div>
          <div className="font-bold text-blue-400 text-sm mb-1">معاون (Deputy)</div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            یار وفادار کلانتر؛ نقشش مخفی است و هدفش زنده ماندن کلانتر و حذف مجرمان است.
          </p>
        </div>

        <div className="bg-saloon-900/60 border border-red-500/30 rounded-2xl p-4 text-center">
          <div className="text-xl mb-1">💀</div>
          <div className="font-bold text-red-400 text-sm mb-1">یاغی‌ها (Outlaws)</div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            هدف واحد آن‌ها کشتن کلانتر است. به محض مرگ کلانتر بازی را می‌برند!
          </p>
        </div>

        <div className="bg-saloon-900/60 border border-purple-500/30 rounded-2xl p-4 text-center">
          <div className="text-xl mb-1">👑</div>
          <div className="font-bold text-purple-400 text-sm mb-1">خائن (Renegade)</div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            تنها بازی می‌کند! باید آخرین بازمانده بازی باشد و در پایان کلانتر را در دوئل از پا درآورد.
          </p>
        </div>
      </div>
    </main>
  );
}
