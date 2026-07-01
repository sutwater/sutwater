import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Building2, Droplets, Clock, AlertCircle,
  TrendingUp, TrendingDown, Minus, ArrowRight,
} from "lucide-react";
import { useAppContext } from "../../contexts/AppContextDef";
import type { WaterValueResponse } from "../../interfaces/InterfaceAll";

// ——— Types ———
interface BuildingStat {
  id: number;
  name: string;
  latest: WaterValueResponse | null;
  prev: WaterValueResponse | null;
  dailyUsage: number | null;
  pendingCount: number;
  totalReadings: number;
}

// ——— Stat card ———
function SummaryCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; accent?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <span className={accent ?? "text-teal-500"}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ——— Building card ———
function BuildingCard({ stat, onClick }: { stat: BuildingStat; onClick: () => void }) {
  const trend = stat.dailyUsage != null
    ? stat.dailyUsage > 0 ? "up" : stat.dailyUsage < 0 ? "down" : "flat"
    : null;

  const statusCls = stat.latest
    ? stat.latest.status_id === 2
      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
      : stat.latest.status_id === 3
        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
    : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400";

  const statusLabel = stat.latest
    ? stat.latest.status_id === 2 ? "อนุมัติแล้ว"
      : stat.latest.status_id === 3 ? "ไม่อนุมัติ"
      : "รออนุมัติ"
    : "ไม่มีข้อมูล";

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
            <Building2 size={15} className="text-teal-600 dark:text-teal-400" />
          </div>
          <span className="text-sm font-semibold text-gray-800 dark:text-white leading-tight line-clamp-2">
            {stat.name}
          </span>
        </div>
        <ArrowRight
          size={15}
          className="text-gray-300 dark:text-gray-600 group-hover:text-teal-500 transition-colors shrink-0 mt-0.5"
        />
      </div>

      {/* Meter value */}
      {stat.latest ? (
        <>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
              {stat.latest.meter_value.toLocaleString()}
            </span>
            <span className="text-xs text-gray-400">m³</span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            {dayjs(stat.latest.timestamp).format("D MMM YYYY HH:mm")}
          </p>
        </>
      ) : (
        <p className="text-sm text-gray-400 mb-3">ยังไม่มีข้อมูล</p>
      )}

      {/* Daily usage + status */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {stat.dailyUsage != null ? (
          <div className="flex items-center gap-1">
            {trend === "up" && <TrendingUp size={13} className="text-orange-500" />}
            {trend === "down" && <TrendingDown size={13} className="text-teal-500" />}
            {trend === "flat" && <Minus size={13} className="text-gray-400" />}
            <span className={`text-xs font-medium ${
              trend === "up" ? "text-orange-500"
              : trend === "down" ? "text-teal-600"
              : "text-gray-400"
            }`}>
              {stat.dailyUsage > 0 ? "+" : ""}{stat.dailyUsage} m³
            </span>
            <span className="text-xs text-gray-400">จากครั้งก่อน</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusCls}`}>
          {statusLabel}
        </span>
      </div>

      {/* Pending badge */}
      {stat.pendingCount > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle size={11} />
          รอการอนุมัติ {stat.pendingCount} รายการ
        </div>
      )}
    </div>
  );
}

// ——— Custom bar label ———
function CustomBarLabel({ x, y, width, value }: { x?: number; y?: number; width?: number; value?: number }) {
  if (!value) return null;
  return (
    <text x={(x ?? 0) + (width ?? 0) + 6} y={(y ?? 0) + 11} fontSize={11} fill="#9ca3af">
      {value.toLocaleString()}
    </text>
  );
}

// ——— Page ———
export default function WaterDashboard() {
  const navigate = useNavigate();
  const { meters, waterusage, loading } = useAppContext();

  // Group readings by location_id, sorted desc
  const readingsByLocation = useMemo(() => {
    const map: Record<number, WaterValueResponse[]> = {};
    waterusage.forEach((r) => {
      const locId = r.device?.location_id;
      if (locId == null) return;
      if (!map[locId]) map[locId] = [];
      map[locId].push(r);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    );
    return map;
  }, [waterusage]);

  // Per-building stats
  const buildingStats = useMemo<BuildingStat[]>(() => {
    return meters
      .filter((m) => m.id != null)
      .map((m) => {
        const readings = readingsByLocation[m.id!] ?? [];
        const latest = readings[0] ?? null;
        const prev   = readings[1] ?? null;
        return {
          id:            m.id!,
          name:          m.building_name,
          latest,
          prev,
          dailyUsage:    latest && prev ? latest.meter_value - prev.meter_value : null,
          pendingCount:  readings.filter((r) => r.status_id === 1).length,
          totalReadings: readings.length,
        };
      });
  }, [meters, readingsByLocation]);

  // Summary stats
  const totalPending   = buildingStats.reduce((s, b) => s + b.pendingCount, 0);
  const buildingsWithData = buildingStats.filter((b) => b.latest != null).length;
  const totalReadings  = waterusage.length;

  // Chart data: daily usage per building (only those with ≥ 2 readings)
  const chartData = useMemo(() =>
    buildingStats
      .filter((b) => b.dailyUsage != null)
      .map((b) => ({
        name: b.name.replace(/^อาคาร/, "").trim(),
        fullName: b.name,
        usage: b.dailyUsage!,
        id: b.id,
      }))
      .sort((a, b) => b.usage - a.usage),
  [buildingStats]);

  const barColors = ["#0d9488","#14b8a6","#2dd4bf","#5eead4","#99f6e4","#ccfbf1","#f0fdf4"];

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 space-y-6">

      {/* ——— Page header ——— */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">ภาพรวมการใช้น้ำ</h1>
          <p className="text-xs text-gray-400 mt-0.5">ข้อมูลทุกอาคารในโรงพยาบาล</p>
        </div>
        <span className="text-xs text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg">
          {dayjs().format("D MMM YYYY")}
        </span>
      </div>

      {/* ——— Summary cards ——— */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Building2 size={16} />}
          label="อาคารทั้งหมด"
          value={meters.length}
          sub={`มีข้อมูล ${buildingsWithData} อาคาร`}
        />
        <SummaryCard
          icon={<Droplets size={16} />}
          label="บันทึกทั้งหมด"
          value={totalReadings.toLocaleString()}
          sub="ทุกอาคาร"
        />
        <SummaryCard
          icon={<AlertCircle size={16} />}
          label="รออนุมัติ"
          value={totalPending}
          sub="รายการทั้งหมด"
          accent={totalPending > 0 ? "text-amber-500" : "text-gray-400"}
        />
        <SummaryCard
          icon={<Clock size={16} />}
          label="อัปเดตล่าสุด"
          value={
            waterusage.length > 0
              ? dayjs(
                  [...waterusage].sort(
                    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  )[0].timestamp
                ).format("HH:mm")
              : "—"
          }
          sub={
            waterusage.length > 0
              ? dayjs(
                  [...waterusage].sort(
                    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                  )[0].timestamp
                ).format("D MMM YYYY")
              : undefined
          }
        />
      </div>

      {/* ——— Bar chart ——— */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
            การใช้น้ำจากครั้งก่อน (m³) — แยกตามอาคาร
          </h2>
          <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 42)}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 60, bottom: 0, left: 8 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e5e7eb" }}
                formatter={(v: number, _: string, item) => [
                  `${v} m³`, (item.payload as { fullName: string } | undefined)?.fullName ?? "",
                ]}
                cursor={{ fill: "#f0fdf4" }}
              />
              <Bar dataKey="usage" radius={[0, 6, 6, 0]} label={<CustomBarLabel />}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ——— Building cards ——— */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          รายละเอียดแต่ละอาคาร
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 h-40 animate-pulse border border-gray-100 dark:border-gray-700" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {buildingStats.map((stat) => (
              <BuildingCard
                key={stat.id}
                stat={stat}
                onClick={() => navigate(`/water-detail?id=${stat.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
