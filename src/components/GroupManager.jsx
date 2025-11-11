import { useState, useMemo, useEffect } from "react";
import { auth, db } from "../firebase/config";
import styles from "./GroupManager.module.css";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { sanitizeGroupName, sanitizeInviteCode } from "../utils/security";

export default function GroupManager() {
  const user = auth.currentUser;
  const displayName = useMemo(
    () => (user?.displayName || user?.email || "Kullanıcı").split("@")[0],
    [user]
  );
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [createMsg, setCreateMsg] = useState(null);
  const [joinMsg, setJoinMsg] = useState(null);
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const onCreate = async () => {
    if (!groupName.trim())
      return setCreateMsg({ type: "error", text: "Grup adı girin." });
    
    setCreateMsg(null); // Önceki mesajı temizle
    
    try {
      const code = genCode();
      console.log("Grup oluşturuluyor:", groupName.trim(), "Kod:", code);
      
      const ref = await addDoc(collection(db, "groups"), {
        name: groupName.trim(),
        inviteCode: code,
        members: [user.uid],
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      
      console.log("Grup oluşturuldu, ID:", ref.id);
      
      // User dokümanını oluştur veya güncelle (setDoc merge:true kullan)
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "users", user.uid), { 
        currentGroup: ref.id,
        email: user.email,
        displayName: user.displayName,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      // Listeyi güncelle
      const newGroup = {
        id: ref.id,
        name: groupName.trim(),
        inviteCode: code,
        members: [user.uid],
        createdBy: user.uid,
        createdAt: new Date()
      };
      
      console.log("Listeye ekleniyor:", newGroup);
      setJoinedGroups(prev => {
        const updated = [...prev, newGroup];
        console.log("Güncel liste:", updated);
        return updated;
      });
      
      setGroupName("");
      setCreateMsg({ type: "success", text: `✅ Grup oluşturuldu! Davet kodu: ${code}` });
      
      // 5 saniye sonra mesajı temizle
      setTimeout(() => setCreateMsg(null), 5000);
      
    } catch (error) {
      console.error("Grup oluşturma hatası:", error);
      setCreateMsg({ type: "error", text: `❌ Hata: ${error.message}` });
    }
  };

  const onJoin = async () => {
    if (!inviteCode.trim())
      return setJoinMsg({ type: "error", text: "Davet kodu girin." });
    try {
      const q = query(
        collection(db, "groups"),
        where("inviteCode", "==", inviteCode.trim().toUpperCase())
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setJoinMsg({ type: "error", text: "Geçersiz davet kodu." });
      } else {
        const g = snap.docs[0];
        const groupData = g.data();
        
        // Zaten üye mi kontrol et
        if (groupData.members?.includes(user.uid)) {
          setJoinMsg({ type: "error", text: "Zaten bu grubun üyesisin!" });
          return;
        }
        
        await updateDoc(g.ref, { members: arrayUnion(user.uid) });
        
        // User dokümanını oluştur veya güncelle
        const { setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "users", user.uid), {
          currentGroup: g.id,
          email: user.email,
          displayName: user.displayName,
          lastUpdated: serverTimestamp()
        }, { merge: true });
        
        // Listeyi güncelle
        const newGroup = { id: g.id, ...groupData };
        setJoinedGroups(prev => [...prev, newGroup]);
        
        setInviteCode("");
        setJoinMsg({ type: "success", text: "Gruba katıldın!" });
      }
    } catch (error) {
      console.error("Katılım hatası:", error);
      setJoinMsg({ type: "error", text: "Katılım başarısız." });
    }
  };

  // Boş grupları temizle
  const cleanupEmptyGroups = async () => {
    try {
      const { deleteDoc } = await import("firebase/firestore");
      const allGroupsSnap = await getDocs(collection(db, "groups"));
      
      let deletedCount = 0;
      for (const groupDoc of allGroupsSnap.docs) {
        const groupData = groupDoc.data();
        const members = groupData.members || [];
        
        // Eğer grup boşsa sil
        if (members.length === 0) {
          console.log(`🗑️ Boş grup siliniyor: ${groupData.name} (${groupDoc.id})`);
          await deleteDoc(groupDoc.ref);
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        console.log(`✅ ${deletedCount} boş grup temizlendi`);
      }
    } catch (error) {
      console.error("Boş grup temizleme hatası:", error);
    }
  };

  // Kullanıcının üye olduğu grupları getir
  useEffect(() => {
    const fetchJoined = async () => {
      if (!user) return;
      try {
        setLoadingGroups(true);
        
        // Önce boş grupları temizle
        await cleanupEmptyGroups();
        
        const q = query(
          collection(db, "groups"),
          where("members", "array-contains", user.uid)
        );
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
        setJoinedGroups(list);
      } catch (e) {
        setJoinedGroups([]);
      } finally {
        setLoadingGroups(false);
      }
    };
    fetchJoined();
  }, [user]);

  const openGroup = async (gid) => {
    console.log('🚀 Gruba gidiliyor:', gid);
    
    try {
      const { setDoc } = await import("firebase/firestore");
      
      console.log('💾 User dokümanı güncelleniyor...');
      await setDoc(doc(db, "users", user.uid), { 
        currentGroup: gid,
        email: user.email,
        displayName: user.displayName,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      console.log('✅ User dokümanı güncellendi, sayfa yönlendiriliyor...');
      
      // window.location.href kullanarak tam sayfa yenileme yap
      window.location.href = `/?g=${gid}`;
      
    } catch (e) {
      console.error("❌ Grup açma hatası:", e);
      // Hata olsa bile yönlendir
      window.location.href = `/?g=${gid}`;
    }
  };

  const leaveGroup = async (groupId, groupName) => {
    if (!confirm(`"${groupName}" grubundan çıkmak istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const { arrayRemove, getDoc, deleteDoc } = await import("firebase/firestore");
      
      // Önce grup bilgisini al
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) {
        alert("Grup bulunamadı!");
        return;
      }
      
      const groupData = groupSnap.data();
      const currentMembers = groupData.members || [];
      
      // Gruptan kullanıcıyı çıkar
      await updateDoc(groupRef, {
        members: arrayRemove(user.uid)
      });

      // Eğer son üye çıktıysa grubu sil
      if (currentMembers.length === 1 && currentMembers[0] === user.uid) {
        console.log(`🗑️ Grup boş kaldı, siliniyor: ${groupName} (${groupId})`);
        await deleteDoc(groupRef);
        alert("Gruptan çıktınız ve grup silindi (son üye sizdiniz).");
      } else {
        alert("Gruptan başarıyla çıktınız!");
      }

      // Listeden kaldır
      setJoinedGroups(prev => prev.filter(g => g.id !== groupId));

    } catch (error) {
      console.error("Gruptan çıkma hatası:", error);
      alert("Gruptan çıkılamadı. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.welcome} text-center mb-6`}>
        <h2 className="text-xl font-bold mb-1 text-white">Hoş geldin, {displayName} 👋 🌙</h2>
        <h1 className="text-2xl font-bold text-[#00E5FF] drop-shadow-[0_0_10px_#00E5FF99]">Grup Yönetimi</h1>
      </div>

      <div className={styles.card}>
        <h2>Yeni Grup Oluştur</h2>
        <input
          value={groupName}
          onChange={(e) => setGroupName(sanitizeGroupName(e.target.value))}
          placeholder="Grup adı girin"
          className={styles["input-field"]}
          maxLength={50}
        />
        <button onClick={onCreate} className={styles["primary-button"]}>
          Grup Oluştur
        </button>
        <div
          className={
            createMsg?.type === "success"
              ? styles["success-message"]
              : createMsg?.type === "error"
              ? styles["error-message"]
              : undefined
          }
        >
          {createMsg?.text}
        </div>
      </div>

      <div className={styles.card}>
        <h2>Davet Kodu ile Katıl</h2>
        <div className={styles["input-with-button"]}>
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(sanitizeInviteCode(e.target.value))}
            placeholder="Davet kodu girin"
            className={styles["input-field"]}
            maxLength={10}
          />
          <button onClick={onJoin} className={styles["secondary-button"]}>
            Katıl
          </button>
        </div>
        <div
          className={
            joinMsg?.type === "success"
              ? styles["success-message"]
              : joinMsg?.type === "error"
              ? styles["error-message"]
              : undefined
          }
        >
          {joinMsg?.text}
        </div>
      </div>

      <div className={styles.card}>
        <h2>Katıldığın Gruplar</h2>
        {loadingGroups ? (
          <p>Yükleniyor...</p>
        ) : joinedGroups.length === 0 ? (
          <p>Henüz bir gruba katılmadın.</p>
        ) : (
          <ul className={styles.list}>
            {joinedGroups.map((g) => (
              <li key={g.id} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <button
                    className={styles["secondary-button"]}
                    onClick={() => openGroup(g.id)}
                    style={{ flex: 1 }}
                  >
                    {g.name || g.id}
                  </button>
                  <button
                    onClick={() => leaveGroup(g.id, g.name)}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'rgba(255, 59, 48, 0.15)',
                      border: '1px solid rgba(255, 59, 48, 0.3)',
                      borderRadius: '8px',
                      color: '#ff3b30',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: '500'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 59, 48, 0.25)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 59, 48, 0.15)';
                    }}
                  >
                    Çık
                  </button>
                </div>
                {g.inviteCode && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(0, 229, 255, 0.08)',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 229, 255, 0.2)',
                    fontSize: '13px'
                  }}>
                    <div>
                      <span style={{ color: '#a0a0a0', marginRight: '6px' }}>Davet Kodu:</span>
                      <span style={{ color: '#00E5FF', fontWeight: '600', letterSpacing: '1px' }}>
                        {g.inviteCode}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(g.inviteCode);
                        alert("Davet kodu kopyalandı!");
                      }}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: 'rgba(0, 229, 255, 0.15)',
                        border: '1px solid rgba(0, 229, 255, 0.3)',
                        borderRadius: '6px',
                        color: '#00E5FF',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = 'rgba(0, 229, 255, 0.25)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'rgba(0, 229, 255, 0.15)';
                      }}
                    >
                      Kopyala
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
