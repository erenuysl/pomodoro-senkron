import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Card from "./ui/Card";
import { sanitizeUsername } from "../utils/security";

export default function GoogleLogin({ onComplete }) {
  const [nickname, setNickname] = useState("");
  const [step, setStep] = useState(0); // 0: login, 1: nickname
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        // Zaten kayıtlıysa direkt devam
        onComplete();
      } else {
        // Yeni kullanıcı → nickname seçimi ekranına geç
        setUserData(user);
        setStep(1);
      }
    } catch (err) {
      console.error(err);
      setError("Giriş başarısız. Lütfen tekrar deneyin.");
    }
  };

  const handleNickname = async () => {
    if (!nickname.trim()) {
      setError("Lütfen bir kullanıcı adı girin.");
      return;
    }
    try {
      await setDoc(doc(db, "users", userData.uid), {
        username: nickname.trim(),
        email: userData.email,
        photoURL: userData.photoURL,
        currentGroup: null,
        createdAt: new Date(),
      });
      onComplete();
    } catch (err) {
      console.error(err);
      setError("Kayıt sırasında hata oluştu.");
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(to bottom, #101418, #0b1115)'
    }}>
      {step === 0 ? (
        <div style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px 30px',
          backgroundColor: '#2a2b2f',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '8px',
            color: '#00E5FF',
            textShadow: '0 0 10px rgba(0, 229, 255, 0.6)'
          }}>
            AMTM-SENKRON
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#e0e0e0',
            marginBottom: '30px',
            opacity: 0.8
          }}>
            Birlikte çalış, odaklan, başar.
          </p>
          <button
            onClick={handleGoogle}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(255, 255, 255, 0.2)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(255, 255, 255, 0.2)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google ile Giriş Yap
          </button>
          {error && <p style={{ marginTop: '16px', color: '#ff3b30', fontSize: '14px' }}>{error}</p>}
        </div>
      ) : (
        <div style={{
          width: '100%',
          maxWidth: '400px',
          padding: '30px',
          backgroundColor: '#2a2b2f',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '20px',
            color: '#ffffff'
          }}>
            Kullanıcı Adı Seç
          </h2>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(sanitizeUsername(e.target.value))}
            maxLength={30}
            placeholder="Örn: codereren"
            style={{
              width: '100%',
              padding: '12px 15px',
              backgroundColor: '#2c2c31',
              border: '1px solid #555',
              borderRadius: '8px',
              color: '#e0e0e0',
              fontSize: '15px',
              outline: 'none',
              transition: 'border-color 0.3s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#00bcd4'}
            onBlur={(e) => e.target.style.borderColor = '#555'}
          />
          <button
            onClick={handleNickname}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '14px',
              backgroundColor: '#00bcd4',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 5px 15px rgba(0, 188, 212, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#00a8bd';
              e.target.style.boxShadow = '0 7px 20px rgba(0, 188, 212, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#00bcd4';
              e.target.style.boxShadow = '0 5px 15px rgba(0, 188, 212, 0.3)';
            }}
          >
            Devam Et
          </button>
          {error && <p style={{ marginTop: '12px', color: '#ff3b30', fontSize: '14px' }}>{error}</p>}
        </div>
      )}
    </div>
  );
}