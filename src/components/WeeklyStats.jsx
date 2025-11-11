import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function WeeklyStats({ groupId }) {
  const { user } = useAuth();
  const [weeklyData, setWeeklyData] = useState({});

  useEffect(() => {
    if (!user || !groupId) return;

    const today = new Date();
    const pastWeek = new Date(today);
    pastWeek.setDate(today.getDate() - 6);

    const startKey = pastWeek.toISOString().slice(0, 10);
    const q = query(
      collection(db, `groups/${groupId}/sessions`),
      where("userId", "==", user.uid),
      where("dayKey", ">=", startKey)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = {};
      snap.forEach((doc) => {
        const { dayKey, duration } = doc.data();
        if (!dayKey) return;
        data[dayKey] = (data[dayKey] || 0) + (duration || 0);
      });
      setWeeklyData(data);
    });

    return () => unsub();
  }, [user, groupId]);

  // Son 7 günü hazırla
  const days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const labels = days.map((d) =>
    new Date(d).toLocaleDateString("tr-TR", { weekday: "short" })
  );
  const values = days.map((d) => weeklyData[d] || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Toplam Dakika",
        data: values,
        fill: true,
        borderColor: "#00E5FF",
        backgroundColor: "rgba(0, 229, 255, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 10,
          color: '#e0e0e0'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      x: {
        ticks: {
          color: '#e0e0e0'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    },
  };

  return (
    <div className="w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}