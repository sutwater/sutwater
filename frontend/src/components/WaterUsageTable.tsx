import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, MapPin, Clock, Droplets } from 'lucide-react';
import { WaterUsageData } from '../interfaces/types';

interface WaterUsageTableProps {
    data: WaterUsageData[];
}

export const WaterUsageTable: React.FC<WaterUsageTableProps> = ({ data }) => {
    const [sortField, setSortField] = useState<keyof WaterUsageData>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const handleSort = (field: keyof WaterUsageData) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const filteredData = data.filter(item => {
        const matchesSearch =
            item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.type.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = typeFilter === 'all' || item.type === typeFilter;

        return matchesSearch && matchesType;
    });

    const sortedData = [...filteredData].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = (bValue as string).toLowerCase();
        }

        if (sortDirection === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
    });

    const getUsageColor = (usage: number) => {
        if (usage > 150) return 'text-red-600 bg-red-50';
        if (usage > 100) return 'text-orange-600 bg-orange-50';
        if (usage > 50) return 'text-yellow-600 bg-yellow-50';
        return 'text-green-600 bg-green-50';
    };

    const getTypeIcon = (type: string) => {
        const iconMap = {
            drinking: '🥤',
            cooking: '🍳',
            cleaning: '🧽',
            irrigation: '🌱',
            other: '💧'
        };
        return iconMap[type as keyof typeof iconMap] || '💧';
    };

    const types = ['all', ...Array.from(new Set(data.map(item => item.type)))];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <h3 className="text-xl font-semibold text-gray-900">Water Usage Details</h3>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search location, period, type..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>

                        {/* Type Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white"
                            >
                                {types.map(type => (
                                    <option key={type} value={type}>
                                        {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th
                                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('date')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Date</span>
                                    {sortField === 'date' && (
                                        sortDirection === 'asc' ?
                                            <ChevronUp className="h-4 w-4" /> :
                                            <ChevronDown className="h-4 w-4" />
                                    )}
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('period')}
                            >
                                <div className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4" />
                                    <span>Period</span>
                                    {sortField === 'period' && (
                                        sortDirection === 'asc' ?
                                            <ChevronUp className="h-4 w-4" /> :
                                            <ChevronDown className="h-4 w-4" />
                                    )}
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('usage')}
                            >
                                <div className="flex items-center space-x-1">
                                    <Droplets className="h-4 w-4" />
                                    <span>Usage (L)</span>
                                    {sortField === 'usage' && (
                                        sortDirection === 'asc' ?
                                            <ChevronUp className="h-4 w-4" /> :
                                            <ChevronDown className="h-4 w-4" />
                                    )}
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('location')}
                            >
                                <div className="flex items-center space-x-1">
                                    <MapPin className="h-4 w-4" />
                                    <span>Location</span>
                                    {sortField === 'location' && (
                                        sortDirection === 'asc' ?
                                            <ChevronUp className="h-4 w-4" /> :
                                            <ChevronDown className="h-4 w-4" />
                                    )}
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => handleSort('type')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Type</span>
                                    {sortField === 'type' && (
                                        sortDirection === 'asc' ?
                                            <ChevronUp className="h-4 w-4" /> :
                                            <ChevronDown className="h-4 w-4" />
                                    )}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedData.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {new Date(item.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-900">{item.period}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUsageColor(item.usage)}`}>
                                        {item.usage}L
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-900">{item.location}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg">{getTypeIcon(item.type)}</span>
                                        <span className="text-sm text-gray-900 capitalize">{item.type}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {sortedData.length === 0 && (
                    <div className="text-center py-12">
                        <Droplets className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No data found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Try adjusting your search or filter criteria.
                        </p>
                    </div>
                )}
            </div>

            {sortedData.length > 0 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Showing {sortedData.length} of {data.length} entries</span>
                        <span>Total usage: {sortedData.reduce((sum, item) => sum + item.usage, 0)}L</span>
                    </div>
                </div>
            )}
        </div>
    );
};