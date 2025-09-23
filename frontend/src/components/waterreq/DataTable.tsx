import React, { useState } from 'react';
import { WaterMeterValueInterface, StatusType } from '../../interfaces/InterfaceAll';
import { StatusBadge } from './StatusBadge';
import { Pagination } from './Pagination';
import { usePagination } from './usePagination';
import { Eye, Check, X, Camera, FileText, Calendar, Droplets } from 'lucide-react';
import { updateWaterValueStatusById, deleteWaterValueById } from "../../services/https"
import { useNavigate } from 'react-router-dom';

interface DataTableProps {
  data: WaterMeterValueInterface[];
  onViewImage: (imagePath: string) => void;
  onReload?: () => void; // ✅ เพิ่ม prop
}

export const DataTable: React.FC<DataTableProps> = ({ 
  data, 
  onReload 
}) => {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination({ data, initialItemsPerPage: 10 });

  const toggleRowSelection = (id: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRows(newSelection);
  };
  

  const toggleAllSelection = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map(item => item.ID!)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleBatchVerify = async () => {
  try {
    await Promise.all(
      Array.from(selectedRows).map(id => updateWaterValueStatusById(id.toString()))
    );
    setSelectedRows(new Set());
    onReload?.(); 
  } catch (error) {
    console.error('Batch verify failed', error);
  }
};

  const handleBatchReject = async () => {
  try {
    // ส่ง request ลบทีละรายการ
    await Promise.all(
      Array.from(selectedRows).map(id => deleteWaterValueById(id.toString()))
    );
    // ล้าง selection หลังสำเร็จ
    setSelectedRows(new Set());
    onReload?.(); 
    // ถ้าต้องการ fetch ข้อมูลใหม่: fetchDataFromAPI();
  } catch (error) {
    console.error('Batch reject failed', error);
  }
};

const handleVerify = async (id: number) => {
  try {
    await updateWaterValueStatusById(id.toString());
    // ถ้าต้องการ refresh ข้อมูลหลัง verify ให้เรียก fetchDataFromAPI()
    onReload?.(); 
  } catch (error) {
    console.error(`Verify failed for ID ${id}`, error);
  }
};

const handleReject = async (id: number) => {
  try {
    await deleteWaterValueById(id.toString());
    // ถ้าต้องการ refresh ข้อมูลหลัง reject ให้เรียก fetchDataFromAPI()
    onReload?.(); 
  } catch (error) {
    console.error(`Reject failed for ID ${id}`, error);
  }
};

  const getStatusFromId = (statusId: number): StatusType => {
    switch (statusId) {
      case 1: return 'รอการอนุมัติ';
      default: return 'อนุมัติ';
    }
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">ข้อมูลการอ่านมิเตอร์น้ำ</h3>
          <div className="text-sm text-gray-500">
            หน้า {currentPage} จาก {totalPages} ({totalItems.toLocaleString()} รายการ)
          </div>
        </div>
        {selectedRows.size > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-gray-600">
              เลือก {selectedRows.size} รายการ
            </span>
            <button 
              onClick={handleBatchVerify}
              className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              ยืนยันทั้งหมด
            </button>
            <button 
              onClick={handleBatchReject}
              className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              ปฏิเสธทั้งหมด
            </button>
          </div>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                  onChange={(e) => toggleAllSelection(e.target.checked)}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ค่ามิเตอร์ที่อ่านได้
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                หมายเหตุ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                วันที่และเวลา
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                การดำเนินการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item) => {
              console.log("item: ", item)
              return (
              
              <tr key={item.ID} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={selectedRows.has(item.ID!)}
                    onChange={() => toggleRowSelection(item.ID!)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Droplets className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.MeterValue?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge 
                    status={getStatusFromId(item.StatusID || 0)} 
                    confidence={item.ModelConfidence}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.Note && item.Note.trim() !== "" ? item.Note : "ไม่มี"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div className="text-sm text-gray-900">
                      {formatDateTime(item.Timestamp)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {item.ImagePath && (
                      <button
                        onClick={() => navigate(`/waterdetail/edit/${item.ID}`)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors duration-200 cursor-pointer"
                        title="View Image"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleVerify(item.ID!)}
                      className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors duration-200 cursor-pointer"
                      title="Verify"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReject(item.ID!)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors duration-200 cursor-pointer"
                      title="Reject"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      
      {paginatedData.length === 0 && data.length === 0 && (
        <div className="px-6 py-12 text-center">
          <Droplets className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">ไม่พบข้อมูล</h3>
          <p className="text-sm text-gray-500">ไม่มีข้อมูลการอ่านมาตรวัดน้ำที่จะแสดง</p>
        </div>
      )}
      
      {data.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
};