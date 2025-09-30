import React, { useEffect, useState } from "react";
import { fetchMeterLocations, updateMeterLocation, deleteMeterLocation } from "../../services/https";
import { MeterLocationInterface as MeterLocation } from "../../interfaces/InterfaceAll";
import { useNavigate } from "react-router-dom";

const MeterLocationManagement: React.FC = () => {
    const [locations, setLocations] = useState<MeterLocation[]>([]);
    const [selected, setSelected] = useState<MeterLocation | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [editedName, setEditedName] = useState("");
    const navigate = useNavigate();
    const [editedLat, setEditedLat] = useState<number>(0);
    const [editedLng, setEditedLng] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState("");

    const loadLocations = async () => {
        setIsLoading(true);
        try {
            const res = await fetchMeterLocations();
            setLocations(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    useEffect(() => {
        loadLocations();
    }, []);

    const handleEdit = (loc: MeterLocation) => {
        setSelected(loc);
        setEditedName(loc.Name);
        setEditedLat(loc.Latitude);
        setEditedLng(loc.Longitude);
    };

    const handleUpdate = async () => {
        if (!selected || selected.ID === undefined) return;
        setIsLoading(true);
        try {
            await updateMeterLocation(selected.ID.toString(), {
                Name: editedName,
                Latitude: editedLat,
                Longitude: editedLng,
            });
            alert("อัปเดตเรียบร้อย");
            setSelected(null);
            loadLocations();
        } catch (err) {
            console.error(err);
            alert("อัปเดตล้มเหลว");
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const handleDelete = async (loc: MeterLocation) => {
        if (loc.ID === undefined) return;
        if (!window.confirm(`คุณต้องการลบ ${loc.Name} ใช่หรือไม่?`)) return;

        setIsLoading(true);
        try {
            await deleteMeterLocation(loc.ID.toString());
            alert("ลบเรียบร้อย");
            loadLocations();
        } catch (err) {
            console.error(err);
            alert("ลบล้มเหลว");
        } finally {
            setTimeout(() => setIsLoading(false), 500);
        }
    };

    const filteredLocations = locations.filter(loc =>
        loc.Name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                        <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        จัดการจุดมิเตอร์
                    </h1>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาชื่อจุดมิเตอร์..."
                            className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <svg
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">จำนวนจุดทั้งหมด</p>
                                <p className="text-3xl font-bold text-blue-600">{locations.length}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">ผลการค้นหา</p>
                                <p className="text-3xl font-bold text-green-600">{filteredLocations.length}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-lg">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div
                        onClick={() => navigate('/water')}
                        className="bg-gradient-to-br from-green-50 via-white to-white rounded-2xl shadow-md p-6 border border-gray-100 transition transform hover:shadow-xl hover:-translate-y-1 active:scale-95 cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            {/* Left text */}
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800 group-hover:text-green-700 transition">เพิ่มจุดมิเตอร์</h3>
                            </div>

                            {/* Right icon */}
                            <div className="bg-green-100 group-hover:bg-green-200 text-green-600 group-hover:text-green-700 p-3 rounded-full transition">
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                    <th className="px-6 py-4 text-left text-sm font-semibold">ชื่อจุด</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">ละติจูด</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">ลองจิจูด</th>
                                    <th className="px-6 py-4 text-center text-sm font-semibold">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredLocations.map((loc, index) => (
                                    <tr
                                        key={loc.ID}
                                        className="hover:bg-blue-50 transition-colors duration-150"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                                                    {index + 1}
                                                </div>
                                                <span className="font-medium text-gray-800">{loc.Name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{loc.Latitude.toFixed(6)}</td>
                                        <td className="px-6 py-4 text-gray-600">{loc.Longitude.toFixed(6)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => handleEdit(loc)}
                                                    className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg hover:from-amber-500 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    แก้ไข
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(loc)}
                                                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    ลบ
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-5 rounded-t-2xl">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                แก้ไขจุดมิเตอร์
                            </h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ชื่อจุด
                                </label>
                                <input
                                    type="text"
                                    value={editedName}
                                    onChange={e => setEditedName(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="ระบุชื่อจุดมิเตอร์"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ละติจูด
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={editedLat}
                                    onChange={e => setEditedLat(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="0.000000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ลองจิจูด
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={editedLng}
                                    onChange={e => setEditedLng(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="0.000000"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                            <button
                                onClick={() => setSelected(null)}
                                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                            >
                                บันทึกการเปลี่ยนแปลง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeterLocationManagement;