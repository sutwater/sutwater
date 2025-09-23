import React from 'react';
import { StatusType } from '../../interfaces/InterfaceAll';

interface StatusBadgeProps {
  status: StatusType;
  confidence?: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, confidence }) => {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'รอการอนุมัติ':
        return {
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          label: 'รอการอนุมัติ'
        };
      case 'อนุมัติ':
        return {
          className: 'bg-green-100 text-green-800 border-green-200',
          label: 'อนุมัติ'
        };
      
      default:
        return {
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          label: 'Pending'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
      {confidence !== undefined && (
        <span className={`text-xs font-medium ${
          confidence >= 90 ? 'text-green-600' : 
          confidence >= 70 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {confidence.toFixed(1)}%
        </span>
      )}
    </div>
  );
};