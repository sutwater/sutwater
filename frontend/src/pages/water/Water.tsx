import { useState, useEffect } from "react";
import { Droplets } from "lucide-react";
import { StatisticsCards } from "../../components/StatisticsCard";
import { TimeFilter } from "../../components/TimeFilter";
import { WaterUsageChart } from "../../components/WaterUsageChart";
import {
  periodComparisons,
} from "../../data/mockData";
import { useAppContext } from "../../contexts/AppContext";
import { GetAllWaterDaily, getNotificationStats } from "../../services/https";
import { NotificationStats } from "../../interfaces/types";

import { MeterLocationInterface } from "../../interfaces/InterfaceAll";

const WaterDashboard = () => {
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const { waterusage } = useAppContext();
  const [, setSelectedMeterId] = useState<number | null>(null);

  // สร้าง state สำหรับ meterLocations
  const [meterLocations, setMeterLocations] = useState<
    MeterLocationInterface[]
  >([]);
  
  // สร้าง state สำหรับ notification stats
  const [notificationStats, setNotificationStats] = useState<NotificationStats>({
    totalNotifications: 0,
    highUsageAlerts: 0,
    lowUsageAlerts: 0,
    lastAlert: '',
  });
  const [statsLoading, setStatsLoading] = useState(true);
  // ไม่ใช้ currentTime แบบเรียลไทม์อีกต่อไป

  // เมื่อ meterLocations เปลี่ยน ให้เลือก ID ที่น้อยที่สุดเสมอ
  useEffect(() => {
    if (meterLocations && meterLocations.length > 0) {
      const minId = Math.min(
        ...meterLocations
          .map((loc) => loc.ID)
          .filter((id): id is number => typeof id === "number" && !isNaN(id))
      );
      setSelectedMeterId(minId);
    }
  }, [meterLocations]);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [selectedView, setSelectedView] = useState("daily");

  // ดึงข้อมูล notification stats
  useEffect(() => {
    const fetchNotificationStats = async () => {
      try {
        setStatsLoading(true);
        const res = await getNotificationStats();
        if (res.status === 200) {
          setNotificationStats(res.data);
        }
      } catch (error) {
        console.error('Error fetching notification stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchNotificationStats();
  }, []);

  // ดึงข้อมูลจาก backend ด้วย useEffect
  useEffect(() => {
    const fetchMeterLocations = async () => {
      const res = await GetAllWaterDaily();
      const data = res.data;
      // ดึง MeterLocation เฉพาะที่มี Name และไม่ซ้ำ
      const meterLocations = (data as any[])
        .map((item: any) => item.MeterLocation)
        .filter(
          (loc: any, idx: number, arr: any[]) =>
            loc &&
            loc.Name &&
            arr.findIndex((l: any) => l.ID === loc.ID) === idx
        );
      setMeterLocations(meterLocations);
      setLastFetchTime(new Date());
    };
    fetchMeterLocations();
  }, []);

  // ไม่ต้องอัปเดตเวลาแบบเรียลไทม์

  // ฟังก์ชัน filter ข้อมูลตามช่วงเวลา (ใช้ Timestamp หรือ Date)
  const filterDataByPeriod = (data: any[], period: string) => {
    const now = new Date();
    return data.filter((item) => {
      let itemDate: Date | null = null;
      const dateStr = item.Date || item.Timestamp;
      if (!dateStr) return false;
      // robust parse YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split("-");
        itemDate = new Date(Number(year), Number(month) - 1, Number(day));
      } else {
        itemDate = new Date(dateStr);
      }
      if (!(itemDate instanceof Date) || isNaN(itemDate.getTime()))
        return false;
      switch (period) {
        case "today": {
          return (
            itemDate.getFullYear() === now.getFullYear() &&
            itemDate.getMonth() === now.getMonth() &&
            itemDate.getDate() === now.getDate()
          );
        }
        case "week": {
          const start = new Date(now);
          start.setDate(now.getDate() - 6);
          start.setHours(0, 0, 0, 0);
          const end = new Date(now);
          end.setHours(23, 59, 59, 999);
          return itemDate >= start && itemDate <= end;
        }
        case "month": {
          const start = new Date(now);
          start.setDate(now.getDate() - 29);
          start.setHours(0, 0, 0, 0);
          const end = new Date(now);
          end.setHours(23, 59, 59, 999);
          return itemDate >= start && itemDate <= end;
        }
        case "year": {
          const start = new Date(now);
          start.setDate(now.getDate() - 364);
          start.setHours(0, 0, 0, 0);
          const end = new Date(now);
          end.setHours(23, 59, 59, 999);
          return itemDate >= start && itemDate <= end;
        }
        default:
          return true;
      }
    });
  };

  const filteredWaterUsageData = filterDataByPeriod(waterusage, selectedPeriod);
  // ถ้าไม่มี dailyStats จริง ให้ส่ง []
  const filteredDailyStats: any[] = [];

  // สร้าง dailyMeterData จากทุก record ในช่วงเวลาที่เลือก (ไม่กรองตามอาคาร)
  const dailyMeterData = filteredWaterUsageData.map((item: any) => ({
    date: item.Date || item.Timestamp || "",
    usage: item.MeterValue || 0,
    location:
      item.CameraDevice?.MeterLocation?.Name || item.MeterLocation?.Name || "",
    period: item.Time || "",
    type: item.type || "อื่นๆ",
    id: item.ID || item.id || Math.random(),
    MeterLocation:
      item.MeterLocation || item.CameraDevice?.MeterLocation || null,
    User: item.User || null,
  }));

  return (
    <div className="min-h-screen bg-gray-50 overflow-auto">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Droplets className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">แดชบอร์ด</h1>
                  <p className="text-sm text-gray-500">ระบบการใช้น้ำ</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="text-sm text-gray-500">
                อัปเดตล่าสุด: {lastFetchTime ? lastFetchTime.toLocaleTimeString("th-TH") : "-"}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <StatisticsCards
          notificationStats={notificationStats}
          periodComparisons={periodComparisons}
          loading={statsLoading}
        />

        {/* Time Filter */}
        <TimeFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          selectedView={selectedView}
          onViewChange={setSelectedView}
        />

        {/* Charts Section */}
        <div className="w-full mb-8">
          <WaterUsageChart
            data={dailyMeterData}
            dailyStats={filteredDailyStats}
            selectedView={selectedView}
            meterLocations={meterLocations}
            selectedPeriod={selectedPeriod}
          />
        </div>
      </main>
    </div>
  );
};

export default WaterDashboard;
