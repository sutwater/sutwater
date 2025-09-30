import React, { useState, useEffect } from 'react';
import { X, Droplets, Camera, AlertCircle } from 'lucide-react';
import { WaterMeterValueInterface } from '../../interfaces/InterfaceAll';

interface WaterMeterConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number, meterValue: number) => void;
  onReject: (id: number) => void;
  data: WaterMeterValueInterface | null;
}

export const WaterMeterConfirmModal: React.FC<WaterMeterConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onReject,
  data
}) => {
  const [meterValue, setMeterValue] = useState<number>(0);
console.log(data)
  useEffect(() => {
    if (data) {
      setMeterValue(data.MeterValue || 0);
    }
  }, [data]);

  if (!isOpen || !data) return null;

  const handleConfirm = () => {
    onConfirm(data.ID!, meterValue);
  };

  const handleReject = () => {
    onReject(data.ID!);
  };

  const formatDateTime = (timestamp?: string | Date) => {
    if (!timestamp) return '-';
    const dateObj = new Date(timestamp);
    return dateObj.toLocaleString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleMeterValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    const num = Number(value);
    if (!isNaN(num)) {
      setMeterValue(num);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Background overlay เบลอเต็มจอ */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-[fadeIn_0.25s_ease-out] z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-5 relative rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={22} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <Droplets size={26} />
            </div>
            <div>
              <h2 className="text-lg font-bold">ยืนยันค่ามิเตอร์น้ำ</h2>
              <p className="text-blue-100 text-xs">กรุณาตรวจสอบข้อมูลก่อนยืนยัน</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image Preview */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Camera size={16} /> รูปภาพมิเตอร์น้ำ
            </label>
            <div className="relative rounded-xl overflow-hidden bg-gray-100 border">
              {data.ImagePath ? (
                <>
                <img
                    key={data.ID} // key เปลี่ยน => React สร้าง <img> ใหม่
                    src={data.ImagePath.startsWith("http") ? data.ImagePath : `http://localhost:8000/${data.ImagePath}`}
                    alt="Water Meter"
                    className="w-full object-cover"
                    />
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs">
                      ถ่ายเมื่อ: {formatDateTime(data.Timestamp)}
                    </p>
                  </div>
                </>
              ) : (
                <div className="w-full h-48 flex items-center justify-center text-gray-400">
                  <Camera size={42} />
                </div>
              )}
            </div>
          </div>

          {/* Meter Reading */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ค่ามิเตอร์ที่อ่านได้</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={Number(meterValue).toLocaleString()}
                onChange={handleMeterValueChange}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-2xl font-bold text-center text-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
              <span className="text-gray-600 font-medium">ลบ.ม.</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              * สามารถแก้ไขค่าได้หากระบบอ่านค่าไม่ถูกต้อง
            </p>
          </div>

          {/* Confidence */}
          {data.ModelConfidence !== undefined && (
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">ความแม่นยำของโมเดล</span>
                <span className="font-semibold text-gray-900">
                  {(data.ModelConfidence).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 h-2 rounded-full transition-all"
                  style={{ width: `${data.ModelConfidence}%` }}
                />
              </div>
            </div>
          )}

          {/* Note */}
          {data.Note && data.Note.trim() !== '' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">หมายเหตุ</p>
                  <p className="text-sm text-yellow-700 mt-1">{data.Note}</p>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="text-blue-600 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-blue-800 font-medium">กรุณาตรวจสอบความถูกต้อง</p>
                <p className="text-xs text-blue-600 mt-1">
                  หากข้อมูลถูกต้อง กดปุ่ม "ยืนยัน" เพื่อบันทึกค่ามิเตอร์
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              className="flex-1 px-4 py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition shadow-md"
            >
              ยืนยัน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
