import { useEffect, useState, useRef, memo } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { collection, addDoc, serverTimestamp as fsServerTimestamp } from "firebase/firestore";
import { ref, set, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import { db, rtdb } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import gmStyles from "./GroupManager.module.css";
import { sanitizeCategory } from "../utils/security";

// Basit ses çalma ve bildirim yardımcıları
function playSound() {
  try {
    const audio = new Audio("/ding.mp3");
    audio.play().catch(() => {
      // mp3 yoksa veya çalma başarısızsa WebAudio ile kısa bip
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880; // A5
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.02);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      } catch {}
    });
  } catch {}
}

async function showNotification(title, body) {
  if ("Notification" in window) {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/pwa-192x192.png",
          vibrate: [100, 50, 100],
        });
      } catch {}
    }
  }
}

function Timer({ defaultDuration = 25, groupId = "demo", onComplete }) {
  const { user } = useAuth();
  const [duration, setDuration] = useState(defaultDuration);
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(defaultDuration * 60);
  const [category, setCategory] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const timerRef = useRef(null);
  const timerCircleRef = useRef(null);
  const lastAngleRef = useRef(0);
  const dragStartTimeRef = useRef(0);

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
    if (!timerCircleRef.current) return 0;
    
    const rect = timerCircleRef.current.getBoundingClientRect();
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

  const handleTimerMouseDown = (e) => {
    if (running) return;
    e.preventDefault(); // Scroll'u engelle
    dragStartTimeRef.current = Date.now();
    setIsDragging(true);
    lastAngleRef.current = getAngleFromEvent(e);
  };

  const handleTimerMove = (e) => {
    if (!isDragging || running) return;
    e.preventDefault(); // Scroll'u engelle
    
    const currentAngle = getAngleFromEvent(e);
    let angleDiff = currentAngle - lastAngleRef.current;
    
    // 180 derece geçişini düzelt (360->0 veya 0->360)
    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;
    
    // Hassasiyeti azalttık: 15 derece = 1 dakika (daha stabil)
    const minuteChange = Math.round(angleDiff / 15);
    
    if (minuteChange !== 0) {
      let newMinutes = duration + minuteChange;
      newMinutes = Math.max(5, Math.min(60, newMinutes));
      
      if (newMinutes !== duration) {
        setDuration(newMinutes);
        setSecondsLeft(newMinutes * 60);
        playTickSound();
        
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      }
      
      lastAngleRef.current = currentAngle;
    }
  };

  const handleTimerMouseUp = () => {
    const dragDuration = Date.now() - dragStartTimeRef.current;
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const moveHandler = (e) => handleTimerMove(e);
      const upHandler = () => handleTimerMouseUp();
      
      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseup', upHandler);
      window.addEventListener('touchmove', moveHandler, { passive: false });
      window.addEventListener('touchend', upHandler);
      
      return () => {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseup', upHandler);
        window.removeEventListener('touchmove', moveHandler);
        window.removeEventListener('touchend', upHandler);
      };
    }
  }, [isDragging, duration]);



  const startTimer = () => {
    if (!user || running || !category) return;
    
    const startTime = Date.now();
    const endTime = startTime + (secondsLeft * 1000);
    
    console.log('Timer başlatılıyor:', { duration, secondsLeft, category, startTime, endTime });
    
    // localStorage'a kaydet (arka plan desteği için)
    localStorage.setItem('timerState', JSON.stringify({
      running: true,
      startTime,
      endTime,
      duration,
      category,
      groupId,
      userId: user.uid
    }));
    
    setRunning(true);
    
    // Presence: working
    set(ref(rtdb, `status/${user.uid}`), {
      state: "working",
      lastChanged: rtdbServerTimestamp(),
    });
    
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      
      setSecondsLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timerRef.current);
      }
    }, 1000);
  };

  const stopTimer = (cancel = false) => {
    console.log('🛑 stopTimer çağrıldı:', { 
      cancel, 
      duration, 
      secondsLeft, 
      category,
      user: user?.uid,
      groupId 
    });
    
    clearInterval(timerRef.current);
    setRunning(false);
    
    // localStorage'dan temizle
    localStorage.removeItem('timerState');
    
    // Presence: back to online
    if (user) {
      set(ref(rtdb, `status/${user.uid}`), {
        state: "online",
        lastChanged: rtdbServerTimestamp(),
      });
    }

    // Geçen süreyi hesapla - duration kullan, defaultDuration değil
    const elapsedMinutes = Math.ceil((duration * 60 - secondsLeft) / 60);
    
    console.log('📊 Hesaplanan değerler:', {
      totalSeconds: duration * 60,
      secondsLeft,
      elapsedSeconds: duration * 60 - secondsLeft,
      elapsedMinutes,
      cancel
    });

    if (!cancel && elapsedMinutes > 0) {
      console.log('💾 Firestore\'a kaydediliyor...');
      
      // Firestore'a kaydet (süre tamamlanmasa bile)
      addDoc(collection(db, `groups/${groupId}/sessions`), {
        userId: user.uid,
        category,
        duration: elapsedMinutes, // Gerçek geçen süre
        startedAt: fsServerTimestamp(),
        dayKey: new Date().toISOString().slice(0, 10),
        completed: secondsLeft <= 0 // Tam tamamlandı mı?
      }).then(() => {
        console.log(`✅ Session kaydedildi: ${category}, ${elapsedMinutes}dk, completed: ${secondsLeft <= 0}`);
      }).catch((error) => {
        console.error('❌ Firestore kayıt hatası:', error);
      });

      // Sadece tam tamamlandıysa bildirim ve ses
      if (secondsLeft <= 0) {
        console.log('🎉 Timer tamamlandı, bildirim gönderiliyor');
        
        // Güçlü vibrasyon (mobil)
        if (navigator.vibrate) {
          // 3 kez uzun vibrasyon
          navigator.vibrate([500, 200, 500, 200, 500]);
        }
        
        playSound();
        showNotification("Pomodoro Tamamlandı!", `${category || "Oturum"} süresi bitti 🎉`);
        onComplete && onComplete();
      }
    } else {
      console.log('⚠️ Kayıt yapılmadı:', { cancel, elapsedMinutes });
    }
    
    // Timer'ı sıfırla - mevcut duration'a göre
    setSecondsLeft(duration * 60);
    setCategory("");
    console.log('🔄 Timer sıfırlandı');
  };

  // Sayfa yüklendiğinde timer durumunu kontrol et
  useEffect(() => {
    const savedState = localStorage.getItem('timerState');
    if (savedState && user) {
      try {
        const state = JSON.parse(savedState);
        
        // Eğer bu kullanıcının timer'ı ise
        if (state.userId === user.uid && state.running) {
          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((state.endTime - now) / 1000));
          
          console.log('📱 Arka plandan geri dönüldü:', { remaining, state });
          
          if (remaining > 0) {
            // Timer hala çalışıyor
            setDuration(state.duration);
            setSecondsLeft(remaining);
            setCategory(state.category);
            setRunning(true);
            
            // Interval'i yeniden başlat
            timerRef.current = setInterval(() => {
              const now = Date.now();
              const remaining = Math.max(0, Math.ceil((state.endTime - now) / 1000));
              
              setSecondsLeft(remaining);
              
              if (remaining <= 0) {
                clearInterval(timerRef.current);
              }
            }, 1000);
          } else {
            // Timer bitmişti
            console.log('⏰ Timer arka plandayken bitti');
            setDuration(state.duration);
            setCategory(state.category);
            stopTimer(false);
          }
        }
      } catch (e) {
        console.error('Timer durumu yüklenemedi:', e);
        localStorage.removeItem('timerState');
      }
    }
  }, [user]);

  useEffect(() => {
    if (secondsLeft <= 0 && running) {
      stopTimer(false);
    }
  }, [secondsLeft]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = ((duration * 60 - secondsLeft) / (duration * 60)) * 100;

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Kategori Input */}
      <div className="w-full">
        <label className="text-sm font-semibold block mb-2 text-[#00E5FF]">
          Kategori
        </label>
        <input
          value={category}
          onChange={(e) => setCategory(sanitizeCategory(e.target.value))}
          placeholder="ör. İngilizce"
          disabled={running}
          className={gmStyles["input-field"]}
          maxLength={30}
        />
      </div>

      {/* Timer Circle - Döndürülebilir */}
      <div className="text-center mb-2">
        <p className="text-[#00E5FF]/60 text-sm font-medium">
          {!running ? '⟲ Döndürerek süreyi ayarla' : 'Timer çalışıyor...'}
        </p>
      </div>
      
      <div 
        ref={timerCircleRef}
        className={`w-64 h-64 my-4 relative ${
          !running ? (isDragging ? 'cursor-grabbing scale-95' : 'cursor-grab hover:scale-105') : 'cursor-default'
        } ${secondsLeft === 0 && !running ? 'animate-pulse-glow' : ''} transition-transform duration-200 touch-none select-none`}
        onMouseDown={handleTimerMouseDown}
        onTouchStart={handleTimerMouseDown}
        style={{ touchAction: 'none' }}
      >
        <CircularProgressbar
          value={progress}
          text={formatTime(secondsLeft)}
          styles={buildStyles({
            pathColor: secondsLeft === 0 ? "#00FF00" : "#00E5FF",
            textColor: secondsLeft === 0 ? "#00FF00" : "#ffffff",
            trailColor: "#0b1720",
            textSize: "28px",
          })}
          className={secondsLeft === 0 ? 'animate-blink' : ''}
        />
        {!running && secondsLeft > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute top-4 w-2 h-10 bg-gradient-to-b from-[#00E5FF] to-transparent rounded-full shadow-[0_0_15px_rgba(0,229,255,0.9)]" />
          </div>
        )}
        {secondsLeft === 0 && !running && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-6xl animate-bounce">🎉</div>
          </div>
        )}
      </div>

      {/* Butonlar - Eşit genişlik */}
      <div className="w-full flex gap-4">
        <button
          className={`${gmStyles["primary-button"]} flex-1`}
          onClick={startTimer}
          disabled={running || !category}
          style={{ padding: '14px 24px', fontSize: '16px' }}
        >
          Başlat
        </button>
        <button
          className={`${gmStyles["secondary-button"]} flex-1`}
          onClick={() => stopTimer(false)}
          disabled={!running}
          style={{ padding: '14px 24px', fontSize: '16px' }}
        >
          Durdur
        </button>
      </div>
    </div>
  );
}

export default memo(Timer);