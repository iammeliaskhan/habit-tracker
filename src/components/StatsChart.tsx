"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = {
  date: string; // YYYY-MM-DD
  percent: number; // 0..100
  completed: number;
  total: number;
};

export default function StatsChart({ data }: { data: Point[] }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} minTickGap={24} />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(_v, _n, p) => {
              const payload = p?.payload as Point | undefined;
              if (!payload) return [];
              return [`${payload.completed}/${payload.total} (${payload.percent}%)`, "Completion"];
            }}
          />
          <Line
            type="monotone"
            dataKey="percent"
            strokeWidth={2}
            dot={false}
            stroke="#0ea5e9"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
