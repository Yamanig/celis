"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTheme } from "~/lib/theme-provider";
import { formatPrice } from "~/lib/format";

function useChartColors() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  return {
    primary: isDark ? "hsl(210 90% 55%)" : "hsl(210 100% 50%)",
    primaryFill: isDark ? "hsl(210 90% 55% / 0.2)" : "hsl(210 100% 50% / 0.15)",
    secondary: isDark ? "hsl(160 70% 48%)" : "hsl(160 80% 40%)",
    secondaryFill: isDark ? "hsl(160 70% 48% / 0.2)" : "hsl(160 80% 40% / 0.15)",
    success: isDark ? "hsl(145 100% 45%)" : "hsl(145 100% 39%)",
    grid: isDark ? "hsl(220 13% 18%)" : "hsl(215 20% 88%)",
    axis: isDark ? "hsl(220 9% 64%)" : "hsl(215 16% 34%)",
    tooltipBg: isDark ? "hsl(220 13% 9%)" : "hsl(0 0% 100%)",
    tooltipBorder: isDark ? "hsl(220 13% 18%)" : "hsl(215 20% 88%)",
  };
}

function formatDateLabel(value: string) {
  const d = new Date(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface TrendPoint {
  date: string;
  payments: number;
  payouts: number;
  net: number;
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const c = useChartColors();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="paymentsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={c.primary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={c.primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="payoutsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={c.secondary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={c.secondary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={c.grid} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateLabel}
          stroke={c.axis}
          tick={{ fill: c.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke={c.axis}
          tick={{ fill: c.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${Number(v) / 100}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: c.tooltipBg,
            borderColor: c.tooltipBorder,
            borderWidth: 1,
            borderStyle: "solid",
            borderRadius: "0.375rem",
          }}
          labelFormatter={(label) => formatDateLabel(label as string)}
          formatter={(value) => formatPrice(Number(value ?? 0))}
        />
        <Legend wrapperStyle={{ color: c.axis }} />
        <Area
          type="monotone"
          dataKey="payments"
          name="Payments"
          stroke={c.primary}
          fill="url(#paymentsGradient)"
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="payouts"
          name="Payouts"
          stroke={c.secondary}
          fill="url(#payoutsGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface StatusPoint {
  status: string;
  value: number;
}

export function StatusBarChart({ data }: { data: StatusPoint[] }) {
  const c = useChartColors();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 16, left: 24, bottom: 0 }}>
        <CartesianGrid stroke={c.grid} horizontal={false} />
        <XAxis
          type="number"
          stroke={c.axis}
          tick={{ fill: c.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="status"
          type="category"
          stroke={c.axis}
          tick={{ fill: c.axis, fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: c.tooltipBg,
            borderColor: c.tooltipBorder,
            borderWidth: 1,
            borderStyle: "solid",
            borderRadius: "0.375rem",
          }}
        />
        <Bar dataKey="value" name="Orders" radius={[0, 4, 4, 0]}>
          {data.map((_, idx) => (
            <Cell key={idx} fill={idx === 0 ? c.primary : c.secondary} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PiePoint {
  name: string;
  value: number;
}

export function StatusPieChart({ data }: { data: PiePoint[] }) {
  const c = useChartColors();
  const colors = [c.primary, c.secondary, c.success, "hsl(38 92% 50%)", "hsl(0 84% 50%)"];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip
          contentStyle={{
            backgroundColor: c.tooltipBg,
            borderColor: c.tooltipBorder,
            borderWidth: 1,
            borderStyle: "solid",
            borderRadius: "0.375rem",
          }}
        />
        <Legend wrapperStyle={{ color: c.axis }} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="60%"
          outerRadius="85%"
          paddingAngle={2}
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={colors[idx % colors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
