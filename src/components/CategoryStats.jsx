import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryStats() {
  const { user } = useAuth();
  const [categoryData, setCategoryData] = useState({});

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);

    const q = query(
      collection(db, "groups/demo/sessions"),
      where("userId", "==", user.uid),
      where("dayKey", "==", today)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = {};
      snapshot.forEach((doc) => {
        const { category, duration } = doc.data();
        if (!category) return;
        data[category] = (data[category] || 0) + (duration || 0);
      });
      setCategoryData(data);
    });

    return () => unsubscribe();
  }, [user]);

  const labels = Object.keys(categoryData);
  const values = Object.values(categoryData);

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          "#36A2EB",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#FF6384",
          "#C9CBCF",
        ],
      },
    ],
  };

  return (
    <div style={{ width: "280px", margin: "30px auto", textAlign: "center" }}>
      <h3>Kategori Bazlı Dağılım</h3>
      {labels.length === 0 ? (
        <p>Henüz kayıt yok</p>
      ) : (
        <>
          <Pie data={chartData} />
          <p>Toplam: {values.reduce((a, b) => a + b, 0)} dakika</p>
        </>
      )}
    </div>
  );
}