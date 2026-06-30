import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowLeft, MapPin, Cpu, Activity, Droplets, BarChart2, Clock } from "lucide-react";
import { useAppContext } from "../../contexts/AppContextDef";
import { GetWaterValues } from "../../services/https/waterValue";

// ——— Types for /water-values response ———
interface WaterValueStatus {
  id: number;
  status_value: string;
  description: string;
}

interface WaterValueDevice {
  id: number;
  mac_address: string;
  location_id: number | null;
}

interface WaterValueUser {
  id: number;
  first_name: string;
  last_name: string;
}

interface WaterValueItem {
  id: number;
  meter_value: number;
  timestamp: string;
  model_confidence: number;
  note: string;
  image_path: string;
  device_id: number;
  device?: WaterValueDevice;
  user_id: number;
  user?: WaterValueUser;
  status_id: number;
  status?: WaterValueStatus;
  created_at: string;
  updated_at: string;
}

// ——— Status badge config ———
const STATUS_CLS: Record<number, string> = {
  1: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  2: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  3: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

// ——— Stat card ———
function StatCard({
  icon,
  label,
  value,
  unit,
  sub,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number | null;
  unit?: string;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-teal-600 dark:text-teal-400">{icon}</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      {loading ? (
        <div className="h-7 w-24 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value ?? "—"}
          {value != null && unit && (
            <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
          )}
        </p>
      )}
      {sub && !loading && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ——— Page ———
export default function WaterDetailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const locationId = Number(searchParams.get("id"));

  const { meters, waterDaily } = useAppContext();

  // Meter & device info from context
  const meter = meters.find((m) => m.id === locationId);
  const ctxDevice = waterDaily.find(
    (d) =>
      d.MeterLocation?.id === locationId ||
      (d.MeterLocation as unknown as { ID?: number })?.ID === locationId
  );
  const deviceId = ctxDevice?.ID;

  // ——— Fetch readings from /water-values?device_id=X ———
  const [readings, setReadings] = useState<WaterValueItem[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(false);

  useEffect(() => {
    if (!deviceId) return;
    setLoadingReadings(true);
    GetWaterValues(deviceId).then((res) => {
      setLoadingReadings(false);
      if (res?.status === 200) {
        const raw: WaterValueItem[] = res.data?.data ?? res.data ?? [];
        const sorted = [...raw].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setReadings(sorted.slice(0, 50));
      }
    });
  }, [deviceId]);

  // ——— Daily usage from context (waterDaily already preloaded) ———
  const dailyData = useMemo(() => {
    const raw = ctxDevice?.DailyWaterUsage ?? [];
    return [...raw].sort(
      (a, b) =>
        new Date(b.Timestamp ?? "").getTime() - new Date(a.Timestamp ?? "").getTime()
    );
  }, [ctxDevice]);

  // ——— Stats ———
  const latestReading = readings[0];
  const latestDaily = dailyData[0];
  const avgUsage =
    dailyData.length > 0
      ? dailyData.reduce((s, d) => s + (d.Usage ?? 0), 0) / dailyData.length
      : null;

  // ——— Chart data — last 30 days ascending ———
  const chartData = dailyData
    .slice(0, 30)
    .reverse()
    .map((d) => ({
      date: dayjs(d.Timestamp).format("D MMM"),
      ปริมาณ: Number((d.Usage ?? 0).toFixed(3)),
    }));

  if (!locationId) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        ไม่พบข้อมูลอาคาร
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 space-y-5">
      {/* ——— Back ——— */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={15} />
        ย้อนกลับ
      </button>

      {/* ——— Building header ——— */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Droplets size={20} className="text-teal-500 shrink-0" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {meter?.building_name ?? `อาคาร #${locationId}`}
              </h1>
            </div>
            {meter && (
              <p className="text-xs text-gray-400 font-mono ml-7">
                {meter.latitude.toFixed(6)}, {meter.longitude.toFixed(6)}
              </p>
            )}
            {ctxDevice?.MacAddress && (
              <div className="flex items-center gap-1.5 ml-7 mt-1.5">
                <Cpu size={12} className="text-gray-400" />
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                  {ctxDevice.MacAddress}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
            <MapPin size={12} />
            <span>จุดมิเตอร์ #{locationId}</span>
          </div>
        </div>
      </div>

      {/* ——— Stat cards ——— */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity size={15} />}
          label="ค่ามิเตอร์ล่าสุด"
          value={latestReading ? latestReading.meter_value.toLocaleString() : null}
          unit="m³"
          sub={latestReading ? dayjs(latestReading.timestamp).format("D MMM YYYY HH:mm") : undefined}
          loading={loadingReadings}
        />
        <StatCard
          icon={<Droplets size={15} />}
          label="ปริมาณล่าสุด (รายวัน)"
          value={latestDaily?.Usage != null ? latestDaily.Usage.toFixed(3) : null}
          unit="m³"
          sub={latestDaily?.Timestamp ? dayjs(latestDaily.Timestamp).format("D MMM YYYY") : undefined}
        />
        <StatCard
          icon={<BarChart2 size={15} />}
          label="เฉลี่ย/วัน"
          value={avgUsage != null ? avgUsage.toFixed(3) : null}
          unit="m³"
          sub={dailyData.length > 0 ? `จาก ${dailyData.length} วัน` : undefined}
        />
        <StatCard
          icon={<Clock size={15} />}
          label="บันทึกทั้งหมด"
          value={!loadingReadings && readings.length > 0 ? readings.length : null}
          unit="ครั้ง"
          sub="(สูงสุด 50 รายการล่าสุด)"
          loading={loadingReadings}
        />
      </div>

      {/* ——— Daily usage chart ——— */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
            กราฟการใช้น้ำรายวัน
          </h2>
          {chartData.length > 0 && (
            <span className="text-xs text-gray-400">{chartData.length} วันล่าสุด</span>
          )}
        </div>

        {chartData.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-sm text-gray-400">
            ไม่มีข้อมูลการใช้น้ำรายวัน
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                unit=" m³"
                width={64}
              />
              <ChartTooltip
                contentStyle={{
                  borderRadius: 8,
                  fontSize: 12,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 2px 8px rgba(0,0,0,.08)",
                }}
                formatter={(v: number) => [`${v} m³`, "ปริมาณ"]}
              />
              <Area
                type="monotone"
                dataKey="ปริมาณ"
                stroke="#0d9488"
                strokeWidth={2.5}
                fill="url(#usageGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#0d9488" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ——— Readings table ——— */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <Cpu size={14} className="text-teal-500" />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
            ประวัติค่ามิเตอร์
          </h2>
          <span className="ml-auto text-xs text-gray-400">50 รายการล่าสุด</span>
        </div>

        {loadingReadings ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400 animate-pulse">
            กำลังโหลด...
          </div>
        ) : readings.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            {deviceId ? "ไม่มีข้อมูลการบันทึก" : "ไม่พบอุปกรณ์ที่เชื่อมต่อกับจุดนี้"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-left text-xs text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">วันที่</th>
                  <th className="px-5 py-3 font-medium">ค่ามิเตอร์</th>
                  <th className="px-5 py-3 font-medium">สถานะ</th>
                  <th className="px-5 py-3 font-medium">ผู้บันทึก</th>
                  <th className="px-5 py-3 font-medium">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {readings.map((r, i) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                  >
                    <td className="px-5 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {dayjs(r.timestamp).format("D MMM YYYY HH:mm")}
                    </td>
                    <td className="px-5 py-3 font-semibold text-teal-600 dark:text-teal-400">
                      {r.meter_value.toLocaleString()} m³
                    </td>
                    <td className="px-5 py-3">
                      {r.status ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLS[r.status_id] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {r.status.status_value}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
                      {r.user ? `${r.user.first_name} ${r.user.last_name}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {r.note || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
