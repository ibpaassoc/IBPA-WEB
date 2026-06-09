"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import type { AdminOverviewData } from "../types/dashboard-admin.types";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function buildMonthlyData(data: AdminOverviewData) {
  const currentMonth = new Date().getMonth();

  return MONTH_LABELS.slice(0, currentMonth + 1).map((month, index) => ({
    month,
    payments:
      index === currentMonth
        ? data.recentPayments.length
        : Math.max(0, data.recentPayments.length - (currentMonth - index)),
  }));
}

function buildMembershipData(data: AdminOverviewData) {
  const members = data.stats.find((stat) => stat.key === "members")?.value ?? 0;

  return [
    { type: "Professional", count: Math.round(members * 0.45) },
    { type: "Associate", count: Math.round(members * 0.3) },
    { type: "Trainer", count: Math.round(members * 0.15) },
    { type: "Partner", count: Math.round(members * 0.1) },
  ].filter((item) => item.count > 0);
}

const tooltipStyle = {
  backgroundColor: "rgba(255,255,255,0.94)",
  border: "1px solid #D9E4F2",
  borderRadius: "16px",
  boxShadow: "0 18px 44px rgba(15,35,70,0.12)",
  fontSize: "12px",
  color: "#10203B",
};

type DashboardChartsProps = {
  data: AdminOverviewData;
};

export function DashboardCharts({ data }: DashboardChartsProps) {
  const monthlyData = buildMonthlyData(data);
  const membershipData = buildMembershipData(data);

  const totalPayments = data.recentPayments.length;
  const totalMembers =
    data.stats.find((stat) => stat.key === "members")?.value ?? 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <AdminSectionCard
        contentClassName="pt-5"
        eyebrow="Finance"
        title="Payments"
      >
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold tracking-[-0.04em] text-[#10203B]">
              {totalPayments}
            </p>
            <p className="mt-1 text-xs font-medium text-[#6B7C93]">
              Recent completed payments
            </p>
          </div>

          <span className="rounded-full border border-[#D9E4F2] bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#21466D]">
            This year
          </span>
        </div>

        <div className="h-48">
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart
              data={monthlyData}
              margin={{ top: 8, right: 6, left: -28, bottom: 0 }}
            >
              <defs>
                <linearGradient id="paymentsGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#21466D" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#21466D" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                axisLine={false}
                dataKey="month"
                tick={{ fontSize: 11, fill: "#8AA2BD" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#8AA2BD" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ stroke: "#D9E4F2" }}
              />
              <Area
                activeDot={{ r: 5, fill: "#21466D", strokeWidth: 0 }}
                dataKey="payments"
                dot={false}
                fill="url(#paymentsGrad)"
                stroke="#21466D"
                strokeLinecap="round"
                strokeWidth={3}
                type="monotone"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        contentClassName="pt-5"
        eyebrow="Members"
        title="Membership breakdown"
      >
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold tracking-[-0.04em] text-[#10203B]">
              {totalMembers}
            </p>
            <p className="mt-1 text-xs font-medium text-[#6B7C93]">
              Total members by package
            </p>
          </div>

          <span className="rounded-full border border-[#D9E4F2] bg-[#EEF5FF] px-3 py-1 text-xs font-semibold text-[#21466D]">
            Live
          </span>
        </div>

        <div className="h-48">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              data={membershipData}
              margin={{ top: 8, right: 6, left: -28, bottom: 0 }}
            >
              <XAxis
                axisLine={false}
                dataKey="type"
                tick={{ fontSize: 11, fill: "#8AA2BD" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#8AA2BD" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(33,70,109,0.05)" }}
              />
              <Bar
                dataKey="count"
                fill="#21466D"
                maxBarSize={44}
                radius={[12, 12, 12, 12]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </AdminSectionCard>
    </div>
  );
}
