import { useState, useRef, useEffect } from "react";

export default function DialSelector({ initialValue = 25, onSelect, onClose }) {
  const [selectedMinutes, setSelectedMinutes] = useState(initialValue);
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef(null);
  const lastAngleRef = useRef(0);

  // Tick ses efekti
  const playTickSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  };

  const getAngleFromEvent = (e) => {
    if (!dialRef.current) return 0;
    
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360;
    
    return angle;
  };

  const handleStart = (e) => {
    setIsDragging(true);
    lastAngleRef.current = getAngleFromEvent(e);
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    
    const currentAngle = getAngleFromEvent(e);
    const angleDiff = currentAngle - lastAngleRef.current;
    
    let newMinutes = selectedMinutes + Math.round(angleDiff / 6);
    newMinutes = Math.max(5, Math.min(60, newMinutes));
    
    if (newMinutes !== selectedMinutes) {
      setSelectedMinutes(newMinutes);
      playTickSound();
      
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
    
    lastAngleRef.current = currentAngle;
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [isDragging, selectedMinutes]);

  const handleConfirm = () => {
    onSelect(selectedMinutes);
  };

  // Kadran üzerindeki işaretler (5dk aralıklarla)
  const tickMarks = [];
  for (let i = 5; i <= 60; i += 5) {
    const angle = (i / 60) * 360 - 90;
    const isMainMark = i % 15 === 0;
    tickMarks.push({ value: i, angle, isMainMark });
  }

  const progressAngle = (selectedMinutes / 60) * 360;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative bg-gradient-to-br from-[#112426] to-[#0a0e1a] rounded-3xl p-10 max-w-md w-full shadow-[0_0_80px_rgba(0,229,255,0.4)] border border-[#00E5FF]/30 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div className="mb-8 text-center">
          <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#00bcd4] mb-2">
            Süreyi Ayarla ⏱️
          </h3>
          <p className="text-[#00E5FF]/60 text-sm">Kadranı döndürerek seç</p>
        </div>

        {/* Dial Container */}
        <div className="relative w-80 h-80 mx-auto mb-8">
          {/* Outer ring with gradient */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#2A3A3D] to-[#1a2426] shadow-[inset_0_4px_20px_rgba(0,0,0,0.5),0_0_40px_rgba(0,229,255,0.2)]" />
          
          {/* Progress arc */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="160"
              cy="160"
              r="140"
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="12"
              strokeDasharray={`${(progressAngle / 360) * 879.6} 879.6`}
              strokeLinecap="round"
              className="transition-all duration-150"
              style={{ filter: 'drop-shadow(0 0 10px rgba(0,229,255,0.6))' }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00E5FF" />
                <stop offset="100%" stopColor="#00bcd4" />
              </linearGradient>
            </defs>
          </svg>

          {/* Tick marks */}
          {tickMarks.map((tick) => {
            const rad = (tick.angle * Math.PI) / 180;
            const x = 160 + Math.cos(rad) * 130;
            const y = 160 + Math.sin(rad) * 130;
            
            return (
              <div
                key={tick.value}
                className="absolute"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div 
                  className={`${
                    tick.isMainMark 
                      ? 'w-1 h-4 bg-[#00E5FF]' 
                      : 'w-0.5 h-2 bg-[#00E5FF]/40'
                  } rounded-full`}
                />
                {tick.isMainMark && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[#00E5FF]/60 text-xs font-bold">
                    {tick.value}
                  </div>
                )}
              </div>
            );
          })}

          {/* Draggable dial */}
          <div
            ref={dialRef}
            onMouseDown={handleStart}
            onTouchStart={handleStart}
            className={`absolute inset-8 rounded-full bg-gradient-to-br from-[#1a2426] to-[#0f1419] shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_2px_8px_rgba(255,255,255,0.1)] cursor-grab ${
              isDragging ? 'cursor-grabbing scale-95' : 'hover:scale-105'
            } transition-transform duration-200`}
          >
            {/* Center display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-6xl font-black text-white drop-shadow-[0_4px_12px_rgba(0,229,255,0.5)]">
                {selectedMinutes}
              </div>
              <div className="text-xl font-bold text-[#00E5FF] mt-2">
                dakika
              </div>
            </div>

            {/* Pointer indicator */}
            <div 
              className="absolute top-4 left-1/2 -translate-x-1/2 w-1 h-12 bg-gradient-to-b from-[#00E5FF] to-transparent rounded-full shadow-[0_0_10px_rgba(0,229,255,0.8)]"
              style={{
                transformOrigin: `50% ${144}px`,
                transform: `translateX(-50%) rotate(${progressAngle}deg)`
              }}
            />
          </div>

          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.8)]" />
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#00bcd4] text-white font-black text-xl shadow-[0_0_30px_rgba(0,229,255,0.5)] hover:shadow-[0_0_40px_rgba(0,229,255,0.7)] hover:scale-105 active:scale-95 transition-all duration-300"
        >
          Onayla ✓
        </button>
      </div>
    </div>
  );
}
