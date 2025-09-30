import React, { useState } from "react";
import { WaterUsageData, DailyStats } from "../interfaces/types";
import {
  MeterLocationInterface,
  CameraDeviceInterface,
  WaterMeterValueInterface,
  WaterValueStatus,
} from "../interfaces/InterfaceAll";
import { GetMeterLocationDetail } from "../services/https";
import { message } from "antd";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface WaterUsageChartProps {
  data: WaterUsageData[];
  dailyStats: DailyStats[];
  selectedView: string;
  meterLocations: MeterLocationInterface[];
  selectedPeriod: string;
}

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 rounded shadow border border-gray-200">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-sm text-blue-600">
          ใช้น้ำ: {payload[0].value} ลบ.ม.
        </p>
      </div>
    );
  }
  return null;
};

// ฟังก์ชันกรองข้อมูลตามช่วงเวลา
function filterDataByPeriod<T extends { Timestamp?: string; Date?: string }>(
  data: T[],
  selectedPeriod: string
) {
  const now = new Date();
  let start: Date, end: Date;
  end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  if (selectedPeriod === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  } else if (selectedPeriod === "week") {
    start = new Date(now);
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (selectedPeriod === "month") {
    start = new Date(now);
    start.setMonth(now.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
  } else if (selectedPeriod === "year") {
    start = new Date(now);
    start.setFullYear(now.getFullYear() - 1);
    start.setHours(0, 0, 0, 0);
  }
  return data.filter((item) => {
    const ts = item.Timestamp
      ? new Date(item.Timestamp)
      : item.Date
      ? new Date(item.Date)
      : null;
    return ts && ts >= start && ts <= end;
  });
}

export const WaterUsageChart: React.FC<WaterUsageChartProps> = ({
  meterLocations,
  selectedPeriod,
}) => {
  const [waterDetail, setWaterDetail] = useState<CameraDeviceInterface | null>(
    null
  );
  const [messageApi] = message.useMessage();

  const getMeterLocationDetailById = async (
    meterLocationId: string | number,
    startDate?: string,
    endDate?: string
  ) => {
    try {
      const res = await GetMeterLocationDetail(
        String(meterLocationId),
        startDate,
        endDate
      );
      if (res.status === 200) {
        setWaterDetail(res.data);
      } else {
        setWaterDetail(null);
        messageApi.open({ type: "error", content: res.data.error });
      }
    } catch (error) {
      setWaterDetail(null);
      messageApi.open({
        type: "error",
        content: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      });
    }
  };
  const [selectedMeterId, setSelectedMeterId] = React.useState<string | number>(
    ""
  );

  // เมื่อ meterLocations เปลี่ยน ให้เลือก ID ที่น้อยที่สุดเสมอ
  React.useEffect(() => {
    if (meterLocations && meterLocations.length > 0) {
      const minId = Math.min(
        ...meterLocations
          .map((loc) => loc.ID)
          .filter((id): id is number => typeof id === "number" && !isNaN(id))
      );
      setSelectedMeterId(minId);
    }
  }, [meterLocations]);
  // ...existing code...
  // ...existing code...

  // โหลดข้อมูล waterDetail ทุกครั้งที่ selectedMeterId เปลี่ยน
  React.useEffect(() => {
    if (selectedMeterId) {
      getMeterLocationDetailById(selectedMeterId);
    }
  }, [selectedMeterId]);

  // รวม CameraDevice ทั้งหมดจาก waterDetail
  let cameraDevices: CameraDeviceInterface[] = [];
  if (waterDetail) {
    if (Array.isArray((waterDetail as any).CameraDevice)) {
      cameraDevices = (waterDetail as any).CameraDevice;
    } else if ((waterDetail as any).CameraDevice) {
      cameraDevices = [(waterDetail as any).CameraDevice];
    } else {
      cameraDevices = [waterDetail as CameraDeviceInterface];
    }
  }
  // รวม WaterMeterValue ทั้งหมดจากทุก CameraDevice
  const waterMeterValues: WaterMeterValueInterface[] = cameraDevices.flatMap(
    (cd) => cd.WaterMeterValue || []
  );
  // รวม WaterValueStatus ทั้งหมดจาก WaterMeterValue (ถ้ามี relation preload)
  const waterValueStatuses: WaterValueStatus[] = waterMeterValues
    .map((wmv) => (wmv as any).WaterValueStatus)
    .filter((s): s is WaterValueStatus => !!s && typeof s.ID === "number");

  // สร้าง dailyMeterData จาก waterDetail.DailyWaterUsage และกรองตามช่วงเวลา
  const dailyMeterData = filterDataByPeriod(
    waterDetail?.DailyWaterUsage?.filter(
      (item) => item?.Timestamp && item?.Usage !== undefined
    ) || [],
    selectedPeriod
  ).map((item) => {
    // หา WaterMeterValue ที่ Timestamp ตรงกัน
    const matchedWMV = waterMeterValues.find(
      (v) => v.Timestamp === item.Timestamp
    );
    // Note: ใช้ Note จาก WaterMeterValueInterface ก่อน ถ้าไม่มีข้อมูลจริง (null, '', ช่องว่าง) ให้ fallback เป็น Description จาก WaterValueStatus
    let note = matchedWMV?.Note;
    if (!note || note.trim().length === 0) {
      note = "-";
      if (matchedWMV && matchedWMV.StatusID) {
        const statusObj = waterValueStatuses.find(
          (s) => s.ID === matchedWMV.StatusID
        );
        if (statusObj && statusObj.Description) {
          note = statusObj.Description;
        }
      }
    }
    return {
      ID: item.ID,
      Timestamp: item.Timestamp,
      MeterValue: item.Usage ?? 0,
      MeterLocation: waterDetail?.MeterLocation ?? undefined,
      ModelConfidence: undefined,
      ImagePath: undefined,
      StatusID: matchedWMV?.StatusID ?? undefined,
      Note: note,
      Time: undefined,
    };
  });

  // คำนวณค่าเฉลี่ยจาก dailyMeterData ที่กรองแล้วตามช่วงเวลา
  const validUsages = dailyMeterData.map(d => d.MeterValue).filter((u) => typeof u === "number" && !isNaN(u));
  const avgValue =
    validUsages.length > 0
      ? validUsages.reduce((a, b) => a + b, 0) / validUsages.length
      : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          ปริมาณการใช้น้ำแต่ละอาคาร
        </h3>
      </div>

      {/* รายชื่ออาคารแบบ inline และ scroll แนวนอน */}
      <div className="mb-4 flex flex-nowrap items-center gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 py-1">
        <span className="font-semibold text-gray-700 mr-2 shrink-0">
          เลือกอาคาร :
        </span>
        {meterLocations && meterLocations.length > 0 ? (
          meterLocations.map((loc) => (
            <button
              key={loc.ID}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 ${
                selectedMeterId === loc.ID
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-black border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setSelectedMeterId(loc.ID ?? "")}
            >
              {loc.Name}
            </button>
          ))
        ) : (
          <span className="text-gray-400">ไม่พบข้อมูลอาคาร</span>
        )}
      </div>

      <div className="overflow-x-auto w-full">
        <div
          style={{
            minWidth: `${Math.max(dailyMeterData.length * 60, 800)}px`,
            height: "320px",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={dailyMeterData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis
                dataKey="Timestamp"
                tick={{ fontSize: 12, fill: "#6b7280" }}
                angle={-45}
                textAnchor="end"
                interval={0}
                tickFormatter={(value) =>
                  value
                    ? new Date(value).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "2-digit",
                      })
                    : "-"
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <YAxis
                tick={{ fontSize: 12, fill: "#6b7280" }}
                label={{
                  value: "ปริมาณน้ำ (ลบ.ม.)",
                  angle: -90,
                  position: "insideLeft",
                  style: {
                    textAnchor: "middle",
                    fill: "#6b7280",
                    fontWeight: "bold",
                  },
                }}
              />
              <Tooltip content={CustomTooltip} />
              <Line
                type="monotone"
                dataKey="MeterValue"
                name="ใช้น้ำ"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "#3B82F6",
                  strokeWidth: 2,
                  stroke: "#ffffff",
                }}
                activeDot={{ r: 6, fill: "#1D4ED8" }}
              />
              {avgValue != null && (
                <ReferenceLine
                  y={avgValue}
                  stroke="#ef4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  label={{
                    value: `ค่าเฉลี่ย: ${avgValue.toFixed(1)}`,
                    fill: "#ef4444",
                    fontWeight: "bold",
                    fontSize: 12,
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8">
        <div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-200 shadow-lg">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table
              className="w-full text-sm border-separate rounded-xl"
              style={{ borderSpacing: 0 }}
            >
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                    วัน/เดือน/ปี
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                    เวลา
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                    ค่าที่อ่านได้
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                    หมายเหตุ
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-700 text-center">
                    สถานะ
                  </th>
                </tr>
              </thead>
              <tbody>
                {dailyMeterData.length > 0 ? (
                  dailyMeterData.map((item, idx) => (
                    <tr
                      key={item.ID ?? idx}
                      className="bg-white"
                      style={{ borderRadius: 12 }}
                    >
                      <td className="px-6 py-4 text-center rounded-l-xl">
                        {item.Timestamp
                          ? new Date(item.Timestamp).toLocaleDateString("th-TH")
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.Timestamp
                          ? new Date(item.Timestamp).toLocaleTimeString("th-TH")
                          : item.Time ?? "-"}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-blue-600">
                        {item.MeterValue ?? 0} ลบ.ม.
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">
                        {item.Note ?? "-"}
                      </td>
                      <td className="px-6 py-4 text-center rounded-r-xl">
                        <span
                          className={
                            item.StatusID === 1
                              ? "inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold border border-yellow-300"
                              : item.StatusID === 2
                              ? "inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-300"
                              : "inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold border border-gray-300"
                          }
                        >
                          {item.StatusID === 1
                            ? "รอการอนุมัติ"
                            : item.StatusID === 2
                            ? "อนุมัติ"
                            : "รอการอนุมัติ"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-gray-500 rounded-xl"
                    >
                      ไม่พบข้อมูลมิเตอร์ในช่วงเวลาที่เลือก
                      <br />
                      กรุณาเลือกช่วงเวลาใหม่
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
