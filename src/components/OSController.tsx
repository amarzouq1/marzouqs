'use client';

import { useRef, useCallback, useEffect, useState } from 'react';

interface OSControllerProps {
  onAction: (action: string, active: boolean) => void;
  buttons?: { key: string; label: string }[];
  showWhenGamepadConnected?: boolean;
}

const DEFAULT_BUTTONS = [
  { key: 'A', label: '●' },
  { key: 'B', label: '▲' },
];

export default function OSController({
  onAction,
  buttons = DEFAULT_BUTTONS,
  showWhenGamepadConnected = false,
}: OSControllerProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [gamepadConnected, setGamepadConnected] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const DEAD_ZONE = 10;
  const MAX_DIST = 38;

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsMobile(isTouchDevice);

    const onGamepadConnect = () => setGamepadConnected(true);
    const onGamepadDisconnect = () => setGamepadConnected(false);
    window.addEventListener('gamepadconnected', onGamepadConnect);
    window.addEventListener('gamepaddisconnected', onGamepadDisconnect);
    return () => {
      window.removeEventListener('gamepadconnected', onGamepadConnect);
      window.removeEventListener('gamepaddisconnected', onGamepadDisconnect);
    };
  }, []);

  // Gamepad polling
  useEffect(() => {
    if (!gamepadConnected) return;
    let prevState = { left: false, right: false, up: false, A: false, B: false };
    const pollId = setInterval(() => {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[0];
      if (!gp) return;
      const left  = gp.axes[0] < -0.3 || gp.buttons[14]?.pressed;
      const right = gp.axes[0] > 0.3  || gp.buttons[15]?.pressed;
      const up    = gp.axes[1] < -0.3 || gp.buttons[12]?.pressed;
      const A     = gp.buttons[0]?.pressed;
      const B     = gp.buttons[1]?.pressed;
      if (left  !== prevState.left)  onAction('left',  left);
      if (right !== prevState.right) onAction('right', right);
      if (up    !== prevState.up)    onAction('up',    up);
      if (A     !== prevState.A)     onAction('A', A);
      if (B     !== prevState.B)     onAction('B', B);
      prevState = { left, right, up, A: !!A, B: !!B };
    }, 16);
    return () => clearInterval(pollId);
  }, [gamepadConnected, onAction]);

  const moveKnob = useCallback((cx: number, cy: number) => {
    const knob = knobRef.current;
    if (!knob) return;
    const dx = cx - centerRef.current.x;
    const dy = cy - centerRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, MAX_DIST);
    const angle = Math.atan2(dy, dx);
    knob.style.transform = `translate(calc(-50% + ${Math.cos(angle) * clamped}px), calc(-50% + ${Math.sin(angle) * clamped}px))`;

    const absX = Math.abs(dx); const absY = Math.abs(dy);
    if (dist > DEAD_ZONE) {
      onAction('left',  dx < -DEAD_ZONE);
      onAction('right', dx > DEAD_ZONE);
      onAction('up',    dy < -DEAD_ZONE && absY > absX);
    } else {
      onAction('left',  false);
      onAction('right', false);
      onAction('up',    false);
    }
  }, [onAction]);

  const resetKnob = useCallback(() => {
    const knob = knobRef.current;
    if (knob) knob.style.transform = 'translate(-50%, -50%)';
    onAction('left',  false);
    onAction('right', false);
    onAction('up',    false);
  }, [onAction]);

  const onJoystickTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    const rect = joystickRef.current!.getBoundingClientRect();
    centerRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    moveKnob(touch.clientX, touch.clientY);
  }, [moveKnob]);

  const onJoystickTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        moveKnob(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
      }
    }
  }, [moveKnob]);

  const onJoystickTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    resetKnob();
    touchIdRef.current = null;
  }, [resetKnob]);

  if (!isMobile || (gamepadConnected && !showWhenGamepadConnected)) return null;

  return (
    <div
      className="fixed bottom-24 left-0 right-0 z-40 flex items-end justify-between px-6 pb-2 pointer-events-none"
      aria-hidden="true"
    >
      {/* Left: Joystick */}
      <div
        ref={joystickRef}
        className="relative w-24 h-24 rounded-full pointer-events-auto"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1.5px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 0 30px rgba(0,71,255,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
          touchAction: 'none',
        }}
        onTouchStart={onJoystickTouchStart}
        onTouchMove={onJoystickTouchMove}
        onTouchEnd={onJoystickTouchEnd}
        onTouchCancel={onJoystickTouchEnd}
      >
        {/* Outer ring */}
        <div
          className="absolute inset-1 rounded-full"
          style={{
            border: '1px solid rgba(0,170,255,0.1)',
            background: 'radial-gradient(circle at center, rgba(0,71,255,0.04) 0%, transparent 70%)',
          }}
        />
        {/* Cross guides */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{ width: '60%', height: '1px', background: 'rgba(255,255,255,0.07)' }} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{ width: '1px', height: '60%', background: 'rgba(255,255,255,0.07)' }} />
        </div>
        {/* Knob */}
        <div
          ref={knobRef}
          className="absolute top-1/2 left-1/2 w-10 h-10 rounded-full"
          style={{
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,100,255,0.25)',
            border: '1.5px solid rgba(0,170,255,0.35)',
            boxShadow: '0 0 16px rgba(0,71,255,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            transition: 'none',
            touchAction: 'none',
          }}
        />
      </div>

      {/* Right: Action buttons */}
      <div className="flex gap-3 pointer-events-auto">
        {buttons.map((btn) => (
          <button
            key={btn.key}
            className="w-14 h-14 rounded-full text-base font-bold text-white/80 select-none active:scale-90 transition-transform"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: btn.key === 'A'
                ? '1.5px solid rgba(0,170,255,0.3)'
                : '1.5px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: btn.key === 'A'
                ? '0 0 20px rgba(0,71,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                : '0 0 12px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)',
              touchAction: 'none',
            }}
            onTouchStart={(e) => { e.preventDefault(); onAction(btn.key, true); }}
            onTouchEnd={(e) => { e.preventDefault(); onAction(btn.key, false); }}
            onTouchCancel={(e) => { e.preventDefault(); onAction(btn.key, false); }}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
