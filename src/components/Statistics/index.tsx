import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState } from "react";

import { functions } from "../../config/firebase";
import { httpsCallable } from "firebase/functions";

type DailyData = {
  total: number;
  average: number;
  record: number;
  daily: {
    date: string;
    count: number;
  }[];
};

interface BombHistoryChartProps {
  data: Array<{ date: string; count: number }>;
}

function fillMissingDays(
  daily: Array<{ date: string; count: number }>,
  days: number = 30
) {
  const map = new Map(daily.map((d) => [d.date, d.count]));
  const result: Array<{ date: string; count: number }> = [];

  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - days + 1);

  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().split("T")[0];
    result.push({
      date: iso,
      count: map.get(iso) ?? 0,
    });
  }

  return result;
}

function BombHistoryChart({ data }: BombHistoryChartProps) {
  if (!data || data.length === 0) return null;

  // ✅ Remplir les jours manquants
  const filledData = fillMissingDays(data, 30);

  // ✅ Formater pour affichage
  const formattedData = filledData.map((item) => ({
    ...item,
    shortDate: item.date.slice(5), // MM-DD
  }));

  return (
    <div className="bg-gray-700 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white text-center mb-4">
        Bomb Evolution (Last 30 Days)
      </h3>

      <div className="w-full h-64">
        <ResponsiveContainer>
          <LineChart data={formattedData}>
            <CartesianGrid strokeOpacity={0.2} />
            <XAxis dataKey="shortDate" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip
              contentStyle={{ backgroundColor: "#1f2937", border: "none" }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#fff" }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Statistics({ country }: { country?: string }) {
  const [dailyData, setDailyData] = useState<DailyData>();
  const [isLoading, setIsLoading] = useState(false);

  const getBombStats = httpsCallable(functions, "getBombStats");
  console.log(country);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data } = await getBombStats({ days: 30, country: country });
      setDailyData(data);
    } catch (err) {
      console.error("Error loading analytics", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-h-96 overflow-y-auto">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading statistics...</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">
                Bombing Evolution
              </h3>
              <p className="text-gray-400">Trend over the last 30 days</p>
            </div>
            <BombHistoryChart data={dailyData?.daily} />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-400">
                  {dailyData?.total}
                </div>
                <div className="text-sm text-gray-400">Total Bombs</div>
              </div>

              <div className="bg-gray-700 rounded-lg py-4">
                <div className="text-2xl font-bold text-green-400">
                  {Math.round(dailyData?.average * 100) / 100}
                </div>
                <div className="text-sm text-gray-400">Average per Day</div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-400 flex gap-2 justify-center items-end">
                  {dailyData?.record.count}
                  <span className="text-lg font-bold text-red-400">
                    ({dailyData?.record.date})
                  </span>
                </div>
                <div className="text-sm text-gray-400">Daily Record</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
