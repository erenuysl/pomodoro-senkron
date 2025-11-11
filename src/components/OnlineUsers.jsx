import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "../firebase/config";

export default function OnlineUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const statusRef = ref(rtdb, "status");
    const unsub = onValue(statusRef, (snap) => {
      if (!snap.exists()) {
        setUsers([]);
        return;
      }
      const val = snap.val();
      const list = Object.entries(val).map(([uid, data]) => ({
        uid,
        state: data.state,
      }));
      setUsers(list);
    });
    return () => unsub();
  }, []);

  return (
    <div className="bg-[var(--card)] shadow-md rounded-xl p-4 mt-4 w-full max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-2">🟢 Çevrim İçi Kullanıcılar</h3>
      {users.length === 0 ? (
        <p>Hiç kimse çevrim içi değil</p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.uid} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${u.state === "working" ? "bg-red-500" : "bg-green-500"}`}></span>
              <span>
                {u.uid.slice(0, 6)} <em className="text-sm opacity-70">({u.state})</em>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}