import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";

export default function DailySummary() {
  const { user } = useAuth();
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);

    const q = query(
      collection(db, "groups/demo/sessions"),
      where("userId", "==", user.uid),
      where("dayKey", "==", today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      let count = 0;
      snapshot.forEach((doc) => {
        total += doc.data().duration || 0;
        count++;
      });
      setTotalMinutes(total);
      setSessionCount(count);
    });

    return () => unsubscribe();
  }, [user]);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-[rgba(0,229,255,0.05)] border border-[rgba(0,229,255,0.1)]">
        <span className="material-symbols-outlined text-3xl text-[#00E5FF]">
          timer
        </span>
        <div>
          <p className="text-2xl font-bold text-white m-0">
            {hours > 0 ? `${hours}s ` : ''}{minutes}dk
          </p>
          <p className="text-sm text-[#e0e0e0] m-0">Toplam Süre</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 p-4 rounded-lg bg-[rgba(0,229,255,0.05)] border border-[rgba(0,229,255,0.1)]">
        <span className="material-symbols-outlined text-3xl text-[#00E5FF]">
          check_circle
        </span>
        <div>
          <p className="text-2xl font-bold text-white m-0">{sessionCount}</p>
          <p className="text-sm text-[#e0e0e0] m-0">Tamamlanan</p>
        </div>
      </div>
    </div>
  );
}