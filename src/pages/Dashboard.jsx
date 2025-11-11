import { useAuth } from "../hooks/useAuth";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import Timer from "../components/Timer";
import { usePresence } from "../hooks/usePresence";
import GroupManager from "../components/GroupManager";
import Toast from "../components/Toast";
import MobileNav from "../components/MobileNav";
import PageContainer from "../components/ui/PageContainer";
import Card from "../components/ui/Card";
import GroupActivity from "../components/GroupActivity";
import { useLocation } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  usePresence();
  const [groupId, setGroupId] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchGroup = async () => {
      if (!user) return;

      const params = new URLSearchParams(location.search);
      const g = params.get("g");
      if (g) {
        setGroupId(g);
        try {
          await updateDoc(doc(db, "users", user.uid), { currentGroup: g });
        } catch {}
        return;
      }

      const uRef = doc(db, "users", user.uid);
      const snap = await getDoc(uRef);
      if (snap.exists()) {
        const data = snap.data();
        setGroupId(data.currentGroup || null);
      }
    };
    fetchGroup();
  }, [user, location.search]);

  const [toast, setToast] = useState("");

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Kullanıcı';

  return (
    <div className="font-sans antialiased bg-gradient-to-b from-[#101418] to-[#0b1115] text-white min-h-screen w-full">
      <main className="flex-1 overflow-y-auto pb-24 w-full">
        {!groupId ? (
          <GroupManager />
        ) : (
          <PageContainer>
            {/* Grup Yönetimi Butonu */}
            <button
              onClick={() => setGroupId(null)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'rgba(0, 229, 255, 0.1)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                borderRadius: '8px',
                color: '#00E5FF',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: '10px'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = 'rgba(0, 229, 255, 0.2)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'rgba(0, 229, 255, 0.1)';
              }}
            >
              📋 Grup Yönetimi
            </button>

            <Card title="Pomodoro Zamanlayıcı">
              <Timer
                defaultDuration={25}
                groupId={groupId}
                onComplete={() => setToast("Pomodoro Tamamlandı 🎉")}
              />
            </Card>

            <Card title="Grup Aktivitesi">
              <GroupActivity groupId={groupId} />
            </Card>
          </PageContainer>
        )}
      </main>
      <MobileNav />
      <Toast message={toast} show={!!toast} onClose={() => setToast("")} />
    </div>
  );
}