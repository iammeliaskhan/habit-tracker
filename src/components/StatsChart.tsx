"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Series = {
  userId: string;
  name: string;
  color: string;
};

type MultiPoint = { date: string } & Record<string, number | string>;

export default function StatsChart({
  data,
  series,
}: {
  data: MultiPoint[];
  series: Series[];
}) {
  return (
    <div className="h-[360px] w-full">
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
            formatter={(v, name) => {
              if (typeof v !== "number") return [];
              return [`${v}%`, String(name)];
            }}
          />
          <Legend />

          {series.map((s) => (
            <Line
              key={s.userId}
              type="monotone"
              dataKey={s.userId}
              name={s.name}
              strokeWidth={2}
              dot={false}
              stroke={s.color}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
