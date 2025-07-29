import React from 'react';
import { Calendar, Clock, Filter } from 'lucide-react';

interface TimeFilterProps {
    selectedPeriod: string;
    onPeriodChange: (period: string) => void;
    selectedView: string;
    onViewChange: (view: string) => void;
}

export const TimeFilter: React.FC<TimeFilterProps> = ({
    selectedPeriod,
    onPeriodChange,
    selectedView,
    onViewChange
}) => {
    const periods = [
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'quarter', label: 'This Quarter' },
        { value: 'year', label: 'This Year' }
    ];

    const views = [
        { value: 'hourly', label: 'Hourly', icon: Clock },
        { value: 'daily', label: 'Daily', icon: Calendar },
        { value: 'monthly', label: 'Monthly', icon: Filter }
    ];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-gray-900">Time Period</h3>
                    <div className="flex space-x-2">
                        {periods.map((period) => (
                            <button
                                key={period.value}
                                onClick={() => onPeriodChange(period.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedPeriod === period.value
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {period.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-semibold text-gray-900">View</h3>
                    <div className="flex space-x-2">
                        {views.map((view) => {
                            const Icon = view.icon;
                            return (
                                <button
                                    key={view.value}
                                    onClick={() => onViewChange(view.value)}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedView === view.value
                                            ? 'bg-teal-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{view.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};