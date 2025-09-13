import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  X, 
  Clock,
  RefreshCw,
  Info,
  Trash2,
} from 'lucide-react';

// Types
export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'loading' | 'success' | 'error' | 'info';
  title?: string;
  message?: string;
  details?: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
  onRetry?: () => void;
}

// Confirmation Modal Component
export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "ยืนยันการดำเนินการ",
  message = "คุณแน่ใจหรือไม่ที่จะทำการนี้?",
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  type = "info",
  icon,
  isLoading = false
}) => {
  if (!isOpen) return null;

  const getDefaultIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'warning':
        return <AlertTriangle className="text-yellow-500" size={24} />;
      case 'danger':
        return <Trash2 className="text-red-500" size={24} />;
      case 'success':
        return <CheckCircle className="text-green-500" size={24} />;
      default:
        return <Info className="text-blue-500" size={24} />;
    }
  };

  const getButtonStyle = () => {
    switch (type) {
      case 'warning':
        return "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 focus:ring-yellow-500";
      case 'danger':
        return "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:ring-red-500";
      case 'success':
        return "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:ring-green-500";
      default:
        return "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 focus:ring-blue-500";
    }
  };

  const getHeaderStyle = () => {
    switch (type) {
      case 'warning':
        return "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200";
      case 'danger':
        return "bg-gradient-to-r from-red-50 to-red-100 border-red-200";
      case 'success':
        return "bg-gradient-to-r from-green-50 to-green-100 border-green-200";
      default:
        return "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-slideIn">
        {/* Header */}
        <div className={`px-6 py-4 border-b rounded-t-xl ${getHeaderStyle()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getDefaultIcon()}
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            {!isLoading && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <X size={20} className="text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 leading-relaxed text-center">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonStyle()}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin" />
                <span>กำลังดำเนินการ...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Status Modal Component
export const StatusModal: React.FC<StatusModalProps> = ({
  isOpen,
  onClose,
  status,
  title,
  message,
  details,
  autoClose = false,
  autoCloseDelay = 3000,
  onRetry
}) => {
  const [countdown, setCountdown] = useState(autoCloseDelay / 1000);

  useEffect(() => {
    if (isOpen && autoClose && status === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      const countdownTimer = setInterval(() => {
        setCountdown(prev => Math.max(prev - 1, 0));
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownTimer);
      };
    }
  }, [isOpen, autoClose, autoCloseDelay, status, onClose]);

  useEffect(() => {
    if (isOpen) {
      setCountdown(autoCloseDelay / 1000);
    }
  }, [isOpen, autoCloseDelay]);

  if (!isOpen) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <RefreshCw className="text-blue-500 animate-spin" size={32} />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-900',
          headerBg: 'bg-gradient-to-r from-blue-50 to-blue-100',
          defaultTitle: 'กำลังประมวลผล...',
          defaultMessage: 'กรุณารอสักครู่ ระบบกำลังดำเนินการ',
          buttonColor: 'bg-blue-500 hover:bg-blue-600'
        };
      case 'success':
        return {
          icon: <CheckCircle className="text-green-500" size={32} />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          titleColor: 'text-green-900',
          headerBg: 'bg-gradient-to-r from-green-50 to-green-100',
          defaultTitle: 'สำเร็จ!',
          defaultMessage: 'การดำเนินการเสร็จสิ้นเรียบร้อยแล้ว',
          buttonColor: 'bg-green-500 hover:bg-green-600'
        };
      case 'error':
        return {
          icon: <XCircle className="text-red-500" size={32} />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          titleColor: 'text-red-900',
          headerBg: 'bg-gradient-to-r from-red-50 to-red-100',
          defaultTitle: 'เกิดข้อผิดพลาด!',
          defaultMessage: 'ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง',
          buttonColor: 'bg-red-500 hover:bg-red-600'
        };
      default:
        return {
          icon: <Info className="text-gray-500" size={32} />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          titleColor: 'text-gray-900',
          headerBg: 'bg-gradient-to-r from-gray-50 to-gray-100',
          defaultTitle: 'แจ้งเตือน',
          defaultMessage: 'มีข้อความแจ้งเตือน',
          buttonColor: 'bg-gray-500 hover:bg-gray-600'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-slideIn">
        {/* Header */}
        <div className={`${config.headerBg} ${config.borderColor} border-b px-6 py-4 rounded-t-xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {config.icon}
              <h3 className={`text-lg font-semibold ${config.titleColor}`}>
                {title || config.defaultTitle}
              </h3>
            </div>
            {status !== 'loading' && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 leading-relaxed text-center">
            {message || config.defaultMessage}
          </p>
          
          {details && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-600 font-medium mb-2">รายละเอียด:</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{details}</p>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex items-center justify-center py-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          )}

          {autoClose && status === 'success' && countdown > 0 && (
            <div className="text-center text-sm text-gray-500 bg-green-50 rounded-lg p-3 border border-green-200">
              <Clock size={16} className="inline mr-2" />
              หน้าต่างจะปิดอัตโนมัติใน {countdown} วินาที
            </div>
          )}
        </div>

        {/* Actions */}
        {status !== 'loading' && (
          <div className="p-6 pt-0">
            {status === 'error' && onRetry ? (
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  ปิด
                </button>
                <button
                  onClick={onRetry}
                  className={`flex-1 px-4 py-3 rounded-lg transition-all font-medium text-white shadow-lg hover:shadow-xl ${config.buttonColor}`}
                >
                  ลองใหม่
                </button>
              </div>
            ) : (
              <button
                onClick={onClose}
                className={`w-full px-4 py-3 rounded-lg transition-all font-medium text-white shadow-lg hover:shadow-xl ${config.buttonColor}`}
              >
                {status === 'success' ? 'ตกลง' : status === 'error' ? 'ปิด' : 'ตกลง'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


export default ConfirmModal;