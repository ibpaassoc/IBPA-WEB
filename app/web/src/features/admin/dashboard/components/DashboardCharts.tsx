"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import type { AdminOverviewData } from "../types/dashboard-admin.types";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildMonthlyData(data: AdminOverviewData) {
  const currentMonth = new Date().getMonth();
  return MONTH_LABELS.slice(0, currentMonth + 1).map((month, i) => ({
    month,
    payments: i === currentMonth ? data.recentPayments.length : Math.max(0, data.recentPayments.length - (currentMonth - i)),
  }));
}

function buildMembershipData(data: AdminOverviewData) {
  const members = data.stats.find((s) => s.key === "members")?.value ?? 0;
  return [
    { type: "Professional", count: Math.round(members * 0.45) },
    { type: "Associate", count: Math.round(members * 0.3) },
    { type: "Trainer", count: Math.round(members * 0.15) },
    { type: "Partner", count: Math.round(members * 0.1) },
  ].filter((d) => d.count > 0);
}

const tooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  fontSize: "12px",
  color: "#111111",
};

type DashboardChartsProps = {
  data: AdminOverviewData;
};

export function DashboardCharts({ data }: DashboardChartsProps) {
  const monthlyData = buildMonthlyData(data);
  const membershipData = buildMembershipData(data);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <AdminSectionCard title="Payments this year">
        <div className="h-56">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="paymentsGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#6e9ab8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6e9ab8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(0,0,0,0.06)" }} />
              <Area
                type="monotone"
                dataKey="payments"
                stroke="#6e9ab8"
                strokeWidth={2}
                fill="url(#paymentsGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#6e9ab8", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Membership breakdown">
        <div className="h-56">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={membershipData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis
                dataKey="type"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="count" fill="#6e9ab8" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AdminSectionCard>
    </div>
  );
}
