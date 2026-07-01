import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker, Form, InputNumber, Input, Modal, message, Button, Upload, Image } from "antd";
import type { UploadFile } from "antd";
import { Plus, ImagePlus } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer,
} from "recharts";
import { ArrowLeft, MapPin, Cpu, Activity, Droplets, BarChart2, Clock } from "lucide-react";
import { useAppContext } from "../../contexts/AppContextDef";
import { GetWaterValues, CreateWaterValueManual } from "../../services/https/waterValue";
import { GetDevices } from "../../services/https/device";

const { RangePicker } = DatePicker;
const apiBase = import.meta.env.VITE_API_BASE_URL as string;

// ——— Types matching /water-values response ———
interface WaterValueStatus { id: number; status_value: string; description: string }
interface WaterValueDevice { id: number; mac_address: string; location_id: number | null }
interface WaterValueUser   { id: number; first_name: string; last_name: string }
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

// ——— Status badge ———
const STATUS_CLS: Record<number, string> = {
  1: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  2: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  3: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

// ——— Stat card ———
function StatCard({ icon, label, value, unit, sub, loading }: {
  icon: React.ReactNode; label: string; value: string | number | null;
  unit?: string; sub?: string; loading?: boolean;
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
          {value != null && unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
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

  const { meters } = useAppContext();
  const meter = meters.find((m) => m.id === locationId);

  // ——— Device for this location ———
  const [deviceId, setDeviceId]   = useState<number | null>(null);
  const [macAddress, setMacAddress] = useState("");
  const [loadingDevice, setLoadingDevice] = useState(true);

  // ——— Create modal ———
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!locationId) return;
    setLoadingDevice(true);
    GetDevices().then((res) => {
      setLoadingDevice(false);
      if (res?.status === 200) {
        const list: Array<{ id: number; mac_address: string; location_id: number | null }> =
          res.data?.data ?? res.data ?? [];
        const dev = list.find((d) => d.location_id === locationId);
        if (dev) { setDeviceId(dev.id); setMacAddress(dev.mac_address); }
      }
    });
  }, [locationId]);

  // ——— Date range — default: last 30 days ———
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, "day"),
    dayjs(),
  ]);

  // ——— Fetch readings ———
  const [readings, setReadings] = useState<WaterValueItem[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(false);

  useEffect(() => {
    if (deviceId == null) return;
    setLoadingReadings(true);
    GetWaterValues(
      deviceId,
      undefined,
      dateRange[0].format("YYYY-MM-DD"),
      dateRange[1].format("YYYY-MM-DD"),
    ).then((res) => {
      setLoadingReadings(false);
      if (res?.status === 200) {
        const raw: WaterValueItem[] = res.data?.data ?? res.data ?? [];
        setReadings(
          [...raw].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        );
      }
    });
  }, [deviceId, dateRange]);

  // ——— Daily usage computed from consecutive readings ———
  // meter_value คือค่าสะสม (odometer) ไม่มีติดลบ
  const chartData = useMemo(() => {
    const byDay = new Map<string, number>();
    // readings sorted desc — เก็บ first (= ล่าสุดของวัน)
    readings.forEach((r) => {
      const day = dayjs(r.timestamp).format("YYYY-MM-DD");
      if (!byDay.has(day)) byDay.set(day, r.meter_value);
    });
    const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));

    const result: { date: string; ปริมาณ: number }[] = [];
    for (let i = 1; i < days.length; i++) {
      const diff = days[i][1] - days[i - 1][1];
      if (diff >= 0) result.push({ date: dayjs(days[i][0]).format("D MMM"), ปริมาณ: diff });
    }
    return result;
  }, [readings]);

  // ——— Stats ———
  const loading       = loadingDevice || loadingReadings;
  const latestReading = readings[0];
  const latestDaily   = chartData[chartData.length - 1];
  const avgUsage      = chartData.length > 0
    ? chartData.reduce((s, d) => s + d.ปริมาณ, 0) / chartData.length
    : null;

  const resetCreateModal = () => {
    form.resetFields();
    setFileList([]);
    setCreateOpen(false);
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      if (!deviceId) { message.error("ไม่พบอุปกรณ์ที่เชื่อมต่อกับจุดนี้"); return; }
      setCreateLoading(true);
      const payload: { meter_value: number; device_id: number; timestamp?: string; note?: string; image?: File } = {
        meter_value: values.meter_value,
        device_id: deviceId,
      };
      if (values.timestamp) payload.timestamp = (values.timestamp as Dayjs).toISOString();
      if (values.note)      payload.note = values.note;
      if (fileList[0]?.originFileObj) payload.image = fileList[0].originFileObj;

      const res = await CreateWaterValueManual(payload);
      setCreateLoading(false);
      if (res?.status === 200 || res?.status === 201) {
        message.success("บันทึกค่ามิเตอร์สำเร็จ");
        resetCreateModal();
        setReadings([]);
        setLoadingReadings(true);
        GetWaterValues(deviceId, undefined, dateRange[0].format("YYYY-MM-DD"), dateRange[1].format("YYYY-MM-DD"))
          .then((r) => {
            setLoadingReadings(false);
            if (r?.status === 200) {
              const raw: WaterValueItem[] = r.data?.data ?? r.data ?? [];
              setReadings([...raw].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            }
          });
      } else {
        message.error(res?.data?.error?.message ?? "เกิดข้อผิดพลาด");
      }
    } catch {
      // validation failed
    }
  };

  if (!locationId) {
    return <div className="flex items-center justify-center h-64 text-gray-400">ไม่พบข้อมูลอาคาร</div>;
  }

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 space-y-5">

      {/* ——— Back ——— */}
      <button onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors">
        <ArrowLeft size={15} /> ย้อนกลับ
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
            {macAddress && (
              <div className="flex items-center gap-1.5 ml-7 mt-1.5">
                <Cpu size={12} className="text-gray-400" />
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{macAddress}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
              <MapPin size={12} /><span>จุดมิเตอร์ #{locationId}</span>
            </div>
            {deviceId != null && (
              <Button
                type="primary"
                icon={<Plus size={14} />}
                onClick={() => setCreateOpen(true)}
                className="!bg-teal-600 !border-teal-600 hover:!bg-teal-700"
              >
                เพิ่มค่ามิเตอร์
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ——— Date range picker ——— */}
      <div className="bg-white dark:bg-gray-800 rounded-xl px-5 py-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 shrink-0">ช่วงวันที่</span>
        <RangePicker
          value={dateRange}
          onChange={(vals) => {
            if (vals && vals[0] && vals[1]) setDateRange([vals[0], vals[1]]);
          }}
          format="DD/MM/YYYY"
          allowClear={false}
          disabledDate={(d) => d.isAfter(dayjs(), "day")}
          presets={[
            { label: "7 วันล่าสุด",  value: [dayjs().subtract(7,  "day"), dayjs()] },
            { label: "30 วันล่าสุด", value: [dayjs().subtract(30, "day"), dayjs()] },
            { label: "3 เดือนล่าสุด",value: [dayjs().subtract(3,  "month"), dayjs()] },
            { label: "ปีนี้",        value: [dayjs().startOf("year"), dayjs()] },
          ]}
        />
        {loadingReadings && (
          <span className="text-xs text-gray-400 animate-pulse">กำลังโหลด...</span>
        )}
      </div>

      {/* ——— Stat cards ——— */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Activity size={15} />} label="ค่ามิเตอร์ล่าสุด"
          value={latestReading ? latestReading.meter_value.toLocaleString() : null} unit="m³"
          sub={latestReading ? dayjs(latestReading.timestamp).format("D MMM YYYY HH:mm") : undefined}
          loading={loading} />
        <StatCard icon={<Droplets size={15} />} label="ใช้ล่าสุด (รายวัน)"
          value={latestDaily ? latestDaily.ปริมาณ : null} unit="m³"
          sub={latestDaily?.date} loading={loading} />
        <StatCard icon={<BarChart2 size={15} />} label="เฉลี่ย/วัน"
          value={avgUsage != null ? avgUsage.toFixed(1) : null} unit="m³"
          sub={chartData.length > 0 ? `จาก ${chartData.length} วัน` : undefined}
          loading={loading} />
        <StatCard icon={<Clock size={15} />} label="บันทึกทั้งหมด"
          value={!loading && readings.length > 0 ? readings.length : null} unit="ครั้ง"
          loading={loading} />
      </div>

      {/* ——— Daily usage chart ——— */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">กราฟการใช้น้ำรายวัน</h2>
          {chartData.length > 0 && <span className="text-xs text-gray-400">{chartData.length} วัน</span>}
        </div>
        {loading ? (
          <div className="h-52 flex items-center justify-center text-sm text-gray-400 animate-pulse">กำลังโหลด...</div>
        ) : chartData.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-sm text-gray-400">ไม่มีข้อมูลในช่วงที่เลือก</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize:10, fill:"#9ca3af" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize:10, fill:"#9ca3af" }} tickLine={false} axisLine={false} unit=" m³" width={56} />
              <ChartTooltip
                contentStyle={{ borderRadius:8, fontSize:12, border:"1px solid #e5e7eb", boxShadow:"0 2px 8px rgba(0,0,0,.08)" }}
                formatter={(v: number) => [`${v} m³`, "ปริมาณ"]}
              />
              <Area type="monotone" dataKey="ปริมาณ" stroke="#0d9488" strokeWidth={2.5}
                fill="url(#usageGrad)" dot={false} activeDot={{ r:4, fill:"#0d9488" }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ——— Readings table ——— */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <Cpu size={14} className="text-teal-500" />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">ประวัติค่ามิเตอร์</h2>
          {readings.length > 0 && <span className="ml-auto text-xs text-gray-400">{readings.length} รายการ</span>}
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400 animate-pulse">กำลังโหลด...</div>
        ) : readings.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-400">
            {deviceId != null ? "ไม่มีข้อมูลในช่วงวันที่เลือก" : "ไม่พบอุปกรณ์ที่เชื่อมต่อกับจุดนี้"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-left text-xs text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">รูป</th>
                  <th className="px-5 py-3 font-medium">วันที่</th>
                  <th className="px-5 py-3 font-medium">ค่ามิเตอร์</th>
                  <th className="px-5 py-3 font-medium">สถานะ</th>
                  <th className="px-5 py-3 font-medium">ผู้บันทึก</th>
                  <th className="px-5 py-3 font-medium">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {readings.map((r, i) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                    <td className="px-5 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3">
                      {r.image_path ? (
                        <Image
                          src={`${apiBase}/${r.image_path}`}
                          width={48}
                          height={48}
                          className="!rounded-md object-cover cursor-pointer"
                          preview={{ mask: false }}
                        />
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {dayjs(r.timestamp).format("D MMM YYYY HH:mm")}
                    </td>
                    <td className="px-5 py-3 font-semibold text-teal-600 dark:text-teal-400">
                      {r.meter_value.toLocaleString()} m³
                    </td>
                    <td className="px-5 py-3">
                      {r.status ? (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLS[r.status_id] ?? "bg-gray-100 text-gray-600"}`}>
                          {r.status.status_value}
                        </span>
                      ) : <span className="text-gray-400 text-xs">—</span>}
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

      {/* ——— Create modal ——— */}
      <Modal
        title="เพิ่มค่ามิเตอร์ด้วยตนเอง"
        open={createOpen}
        onOk={handleCreate}
        onCancel={resetCreateModal}
        okText="บันทึก"
        cancelText="ยกเลิก"
        confirmLoading={createLoading}
        okButtonProps={{ className: "!bg-teal-600 !border-teal-600 hover:!bg-teal-700" }}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="meter_value"
            label="ค่ามิเตอร์ (m³)"
            rules={[{ required: true, message: "กรุณากรอกค่ามิเตอร์" }]}
          >
            <InputNumber className="w-full" min={0} placeholder="เช่น 12345" />
          </Form.Item>
          <Form.Item name="timestamp" label="วันที่และเวลา (ปล่อยว่างเพื่อใช้เวลาปัจจุบัน)">
            <DatePicker
              showTime
              className="w-full"
              format="DD/MM/YYYY HH:mm"
              disabledDate={(d) => d.isAfter(dayjs(), "day")}
              placeholder="ไม่ระบุ = ใช้เวลาปัจจุบัน"
            />
          </Form.Item>
          <Form.Item name="note" label="หมายเหตุ">
            <Input.TextArea rows={2} placeholder="หมายเหตุ (ถ้ามี)" />
          </Form.Item>
          <Form.Item label="รูปภาพมิเตอร์ (ถ้ามี)">
            <Upload.Dragger
              accept="image/*"
              maxCount={1}
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: fl }) => setFileList(fl)}
              listType="picture"
            >
              <p className="ant-upload-drag-icon flex justify-center">
                <ImagePlus size={28} className="text-teal-500" />
              </p>
              <p className="ant-upload-text text-sm">คลิกหรือลากไฟล์รูปมาวางที่นี่</p>
              <p className="ant-upload-hint text-xs text-gray-400">รองรับ JPG, PNG, WEBP (สูงสุด 1 ไฟล์)</p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
