import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";

export default function GroupLeaderboard({ groupId = "demo" }) {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, `groups/${groupId}/sessions`),
      where("dayKey", "==", today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const totals = {};

      snapshot.forEach((doc) => {
        const { userId, duration } = doc.data();
        if (!userId || !duration) return;
        totals[userId] = (totals[userId] || 0) + duration;
      });

      const sorted = Object.entries(totals)
        .map(([uid, total]) => ({ uid, total }))
        .sort((a, b) => b.total - a.total);

      setRows(sorted);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="bg-[var(--card)] shadow-md rounded-xl p-4 mt-4 w-full max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-2">🎖️ Günlük Grup Sıralaması</h3>
      {rows.length === 0 ? (
        <p>Bugün kayıt yok.</p>
      ) : (
        <ul className="list-none p-0">
          {rows.map((r, i) => (
            <li key={r.uid} className="mb-2">
              <strong>#{i + 1}</strong> {r.uid.slice(0, 6)} — {r.total} dk
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}