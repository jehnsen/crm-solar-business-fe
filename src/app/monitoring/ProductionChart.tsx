"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { num } from "@/lib/format";

interface Point {
  label: string;
  produced: number;
  expected: number;
}

/**
 * Actual production as a filled area, modeled output as a dashed line on top.
 * Reading the gap between the two is the whole job of this chart, so the model
 * line stays visually subordinate but never hidden.
 */
export function ProductionChart({ data }: { data: Point[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 6, right: 10, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="producedFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E8A33D" stopOpacity={0.42} />
              <stop offset="100%" stopColor="#E8A33D" stopOpacity={0.04} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#E3E0D8" strokeDasharray="2 4" vertical={false} />

          <XAxis
            dataKey="label"
            tick={{ fill: "#6B7280", fontSize: 10 }}
            stroke="#D2CEC3"
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            tick={{ fill: "#6B7280", fontSize: 10 }}
            stroke="#D2CEC3"
            width={58}
            tickFormatter={(v: number) => num(v)}
          />

          <Tooltip
            contentStyle={{
              background: "#FFFFFF",
              border: "1px solid #D2CEC3",
              borderRadius: 5,
              fontSize: 12,
              fontVariantNumeric: "tabular-nums",
              color: "#1A1F29",
            }}
            labelStyle={{ color: "#414A59", fontWeight: 600, marginBottom: 2 }}
            formatter={(value, name) => [
              `${num(Number(value ?? 0))} kWh`,
              name === "produced" ? "Produced" : "Modeled",
            ]}
          />

          <Legend
            verticalAlign="top"
            align="right"
            height={26}
            iconType="plainline"
            iconSize={14}
            formatter={(value) => (
              <span style={{ color: "#414A59", fontSize: 11 }}>
                {value === "produced" ? "Produced" : "Modeled"}
              </span>
            )}
          />

          <Area
            type="monotone"
            dataKey="produced"
            name="produced"
            stroke="#D4902B"
            strokeWidth={1.75}
            fill="url(#producedFill)"
            dot={false}
            activeDot={{ r: 3, fill: "#D4902B", stroke: "#FFFFFF", strokeWidth: 1.5 }}
          />
          <Line
            type="monotone"
            dataKey="expected"
            name="expected"
            stroke="#1D5A8F"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
