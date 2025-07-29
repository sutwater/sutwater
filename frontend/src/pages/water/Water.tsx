import { useState } from 'react';
import { Droplets, BarChart3, Calendar, TrendingUp } from 'lucide-react';
import { StatisticsCards } from '../../components/StatisticsCard';
import { TimeFilter } from '../../components/TimeFilter';
import { WaterUsageChart } from '../../components/WaterUsageChart';
import { WaterUsageTable } from '../../components/WaterUsageTable';
import {
    waterUsageData,
    dailyStats,
    monthlyStats,
    notificationStats,
    periodComparisons,
} from '../../data/mockData';

const Water = () => {
    const [selectedPeriod, setSelectedPeriod] = useState('week');
    const [selectedView, setSelectedView] = useState('hourly');

    return (
        <div className="min-h-screen bg-gray-50">
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
                                    <h1 className="text-xl font-bold text-gray-900">SUTH Dashboard</h1>
                                    <p className="text-sm text-gray-500">Smart Water Usage Analytics</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <StatisticsCards
                    notificationStats={notificationStats}
                    periodComparisons={periodComparisons}
                />

                <TimeFilter
                    selectedPeriod={selectedPeriod}
                    onPeriodChange={setSelectedPeriod}
                    selectedView={selectedView}
                    onViewChange={setSelectedView}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Main Usage Chart */}
                    <div className="lg:col-span-2">
                        <WaterUsageChart
                            data={waterUsageData}
                            dailyStats={dailyStats}
                            selectedView={selectedView}
                        />
                    </div>

                    {/* Period Analysis */}
                    <div className="space-y-6">
                        {/* Daily Peak Hours */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <BarChart3 className="h-5 w-5 text-orange-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Peak Usage Hours</h3>
                            </div>
                            <div className="space-y-3">
                                {['15:00-18:00', '09:00-12:00', '18:00-21:00'].map((period, index) => (
                                    <div key={period} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">{period}</span>
                                        <div className="flex items-center space-x-2">
                                            <div
                                                className={`w-12 h-2 rounded-full ${index === 0
                                                    ? 'bg-red-500'
                                                    : index === 1
                                                        ? 'bg-orange-500'
                                                        : 'bg-yellow-500'
                                                    }`}
                                            ></div>
                                            <span className="text-sm font-medium text-gray-900">
                                                {index === 0 ? '155L' : index === 1 ? '76L' : '85L'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Monthly Comparison */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-purple-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
                            </div>
                            <div className="space-y-4">
                                {monthlyStats.map((month) => (
                                    <div key={month.month} className="border-l-4 border-blue-500 pl-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-900">
                                                {month.month.split(' ')[0]}
                                            </span>
                                            <span className="text-sm font-bold text-gray-900">
                                                {month.totalUsage.toLocaleString()}L
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Avg: {Math.round(month.avgDaily)}L/day
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>Max: {month.maxDaily}L</span>
                                            <span>Min: {month.minDaily}L</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Usage by Type */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="p-2 bg-teal-100 rounded-lg">
                                    <Calendar className="h-5 w-5 text-teal-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Usage by Type</h3>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { type: 'Irrigation', usage: 466, color: 'bg-orange-500' },
                                    { type: 'Cleaning', usage: 320, color: 'bg-purple-500' },
                                    { type: 'Cooking', usage: 138, color: 'bg-green-500' },
                                    { type: 'Drinking', usage: 112, color: 'bg-blue-500' },
                                ].map((item) => (
                                    <div key={item.type} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                            <span className="text-sm text-gray-600">{item.type}</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{item.usage}L</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <WaterUsageTable data={waterUsageData} />
            </main>
        </div>
    );
};

export default Water;
