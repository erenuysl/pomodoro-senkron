import { useEffect, useState, memo } from "react";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

function GroupActivity({ groupId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;

    let unsubscribes = [];

    const setupListeners = async () => {
      try {
        // Grup bilgisini al
        const groupDoc = await getDoc(doc(db, "groups", groupId));
        if (!groupDoc.exists()) {
          setLoading(false);
          return;
        }

        const groupData = groupDoc.data();
        const memberIds = groupData.members || [];

        if (memberIds.length === 0) {
          setLoading(false);
          return;
        }

        // Bugünün tarihi
        const today = new Date().toISOString().slice(0, 10);

        // Her üye için session'ları dinle
        for (const memberId of memberIds) {
          // Kullanıcı bilgisini al
          let userName = "Kullanıcı";
          try {
            const userDoc = await getDoc(doc(db, "users", memberId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userName = userData.displayName || userData.email?.split('@')[0] || "Kullanıcı";
            }
          } catch (e) {
            console.error("Kullanıcı bilgisi alınamadı:", e);
          }

          const q = query(
            collection(db, `groups/${groupId}/sessions`),
            where("userId", "==", memberId),
            where("dayKey", "==", today)
          );

          const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log(`${userName} için güncelleme:`, snapshot.size, "oturum");

            // Session'ları topla
            let totalMinutes = 0;
            const categories = {};
            
            snapshot.forEach((doc) => {
              const data = doc.data();
              totalMinutes += data.duration || 0;
              const cat = data.category || "Diğer";
              categories[cat] = (categories[cat] || 0) + (data.duration || 0);
            });

            // Üye bilgisini güncelle
            setMembers((prev) => {
              const filtered = prev.filter((m) => m.id !== memberId);
              const updated = [
                ...filtered,
                {
                  id: memberId,
                  name: userName,
                  totalMinutes,
                  categories,
                  sessionCount: snapshot.size
                }
              ].sort((a, b) => b.totalMinutes - a.totalMinutes);
              
              console.log("Güncel üyeler:", updated);
              return updated;
            });
          });

          unsubscribes.push(unsubscribe);
        }

        setLoading(false);
      } catch (error) {
        console.error("Grup üyeleri yüklenemedi:", error);
        setLoading(false);
      }
    };

    setupListeners();

    // Cleanup
    return () => {
      console.log("Cleanup: listeners kapatılıyor");
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [groupId]);

  if (loading) {
    return <p className="text-center text-gray-400">Yükleniyor...</p>;
  }

  if (members.length === 0) {
    return <p className="text-center text-gray-400">Henüz kimse çalışmaya başlamadı.</p>;
  }

  // Kategori renkleri
  const categoryColors = {
    'İngilizce': '#00E5FF',
    'Tasarım': '#9D4EDD',
    'Okuma': '#7B9FFF',
    'Diğer': '#888888'
  };

  const getCategoryColor = (category, index) => {
    if (categoryColors[category]) return categoryColors[category];
    // Dinamik renkler
    const colors = ['#00E5FF', '#9D4EDD', '#7B9FFF', '#FF6B9D', '#FFB84D'];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col gap-2.5">
      {members.map((member, index) => {
        const hours = Math.floor(member.totalMinutes / 60);
        const minutes = member.totalMinutes % 60;
        const sortedCategories = Object.entries(member.categories).sort((a, b) => b[1] - a[1]);
        
        // Sıralama badge'i
        const getRankBadge = () => {
          if (index === 0) return { emoji: '🏆', color: '#FFD700', bg: 'rgba(255, 215, 0, 0.15)' };
          if (index === 1) return { emoji: '🥈', color: '#C0C0C0', bg: 'rgba(192, 192, 192, 0.15)' };
          if (index === 2) return { emoji: '🥉', color: '#CD7F32', bg: 'rgba(205, 127, 50, 0.15)' };
          return null;
        };
        
        const rank = getRankBadge();

        return (
          <div
            key={member.id}
            style={{
              padding: '12px',
              background: index === 0 
                ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.15) 0%, rgba(0, 229, 255, 0.05) 100%)'
                : 'rgba(42, 43, 47, 0.6)',
              borderRadius: '12px',
              border: index === 0 ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: index === 0 ? '0 4px 12px rgba(0, 229, 255, 0.1)' : 'none'
            }}
          >
            {/* Üye Başlığı */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {rank && (
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: rank.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}>
                    {rank.emoji}
                  </div>
                )}
                <span className="font-semibold text-white" style={{ fontSize: '15px' }}>
                  {member.name}
                </span>
              </div>
              <div style={{
                padding: '4px 10px',
                backgroundColor: 'rgba(0, 229, 255, 0.15)',
                borderRadius: '8px',
                border: '1px solid rgba(0, 229, 255, 0.3)'
              }}>
                <span className="text-[#00E5FF] font-bold" style={{ fontSize: '14px' }}>
                  {hours > 0 ? `${hours}s ` : ''}{minutes}dk
                </span>
              </div>
            </div>
            
            {/* Progress Bar */}
            {member.totalMinutes >= 0 && (
              <div style={{ marginTop: '12px' }}>
                {/* Toplam Süre Başlığı */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '13px', color: '#a0a0a0' }}>Toplam Süre</span>
                  <span style={{ fontSize: '14px', color: '#00E5FF', fontWeight: '600' }}>
                    {hours > 0 ? `${hours}s ` : ''}{minutes}dk
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  display: 'flex'
                }}>
                  {sortedCategories.length > 0 ? sortedCategories.map(([category, mins], catIndex) => {
                    const percentage = (mins / member.totalMinutes) * 100;
                    const color = getCategoryColor(category, catIndex);
                    return (
                      <div
                        key={category}
                        style={{
                          width: `${percentage}%`,
                          height: '100%',
                          backgroundColor: color,
                          transition: 'width 0.3s ease'
                        }}
                        title={`${category}: ${mins}dk`}
                      />
                    );
                  }) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: '#888'
                    }}>
                      Henüz çalışma yok
                    </div>
                  )}
                </div>

                {/* Kategori Etiketleri */}
                {sortedCategories.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginTop: '8px'
                }}>
                  {sortedCategories.map(([category, mins], catIndex) => {
                    const catHours = Math.floor(mins / 60);
                    const catMinutes = mins % 60;
                    const color = getCategoryColor(category, catIndex);
                    return (
                      <div
                        key={category}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px'
                        }}
                      >
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '2px',
                          backgroundColor: color
                        }} />
                        <span style={{ color: '#a0a0a0' }}>{category}</span>
                        <span style={{ color: color, fontWeight: '600' }}>
                          {catHours > 0 ? `${catHours}s ` : ''}{catMinutes}dk
                        </span>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            )}
            
            {/* Oturum Sayısı - Minimal */}
            {member.sessionCount > 0 && (
              <div style={{
                marginTop: '8px',
                fontSize: '11px',
                color: '#888',
                textAlign: 'right'
              }}>
                {member.sessionCount} oturum
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default memo(GroupActivity);
