import React from 'react';
import { X, ZoomIn, ZoomOut, Download, RotateCcw, Move } from 'lucide-react';

interface ImageModalProps {
  imagePath: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ imagePath, isOpen, onClose }) => {
  const [zoom, setZoom] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const imageRef = React.useRef<HTMLImageElement>(null);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
    }
  }, [isOpen]);

  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imagePath;
    link.download = `water-meter-${Date.now()}.jpg`;
    link.click();
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle wheel zoom with proper event listener setup
  React.useEffect(() => {
    const imageContainer = imageRef.current?.parentElement;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.5, Math.min(4, prev + delta)));
    };

    if (imageContainer && isOpen) {
      // Add non-passive wheel event listener
      imageContainer.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        imageContainer.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isOpen]);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal Container */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-6xl max-h-[95vh] w-full flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <h3 className="text-xl font-bold dark:text-white bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              รูปภาพมิเตอร์น้ำ
            </h3>
          </div>
          
          {/* Control Buttons */}
          <div className="flex items-center gap-1 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-1 shadow-lg">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="p-2.5 hover:bg-white/80 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="Zoom Out"
              disabled={zoom <= 0.5}
            >
              <ZoomOut className={`w-4 h-4 ${zoom <= 0.5 ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`} />
            </button>
            
            <div className="px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[60px] text-center bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-gray-700 dark:to-gray-600 rounded-lg">
              {Math.round(zoom * 100)}%
            </div>
            
            <button
              onClick={() => setZoom(Math.min(4, zoom + 0.25))}
              className="p-2.5 hover:bg-white/80 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="Zoom In"
              disabled={zoom >= 4}
            >
              <ZoomIn className={`w-4 h-4 ${zoom >= 4 ? 'text-gray-400' : 'text-gray-700 dark:text-gray-300'}`} />
            </button>
            
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
            
            <button
              onClick={handleReset}
              className="p-2.5 hover:bg-white/80 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            
            <button
              onClick={handleDownload}
              className="p-2.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="Download Image"
            >
              <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="Close Modal"
            >
              <X className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>
        
        {/* Image Container */}
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-b-2xl relative">
          
          {/* Zoom indicator */}
          {zoom > 1 && (
            <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-lg">
              <Move className="w-4 h-4" />
              <span className="text-sm font-medium">Drag to pan</span>
            </div>
          )}
          
          {/* Image wrapper */}
          <div 
            className="w-full h-full flex items-center justify-center p-6 overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <div className="relative group">
              <img
                ref={imageRef}
                src={imagePath}
                alt="Water Meter Reading"
                className="max-w-full max-h-full rounded-xl shadow-2xl transition-all duration-300 select-none"
                style={{ 
                  transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                  transformOrigin: 'center center'
                }}
                onError={(e) => {
                  e.currentTarget.src = 'https://images.pexels.com/photos/416978/pexels-photo-416978.jpeg';
                }}
                draggable={false}
              />
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-blue-500/20 via-transparent to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          </div>
          
          {/* Loading placeholder */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin opacity-0 transition-opacity duration-300"></div>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span>🔍 ใช้ลูกกลิ้งเมาส์เพื่อซูม</span>
              <span>📱 ลากเพื่อซูม</span>
            </div>
            <div className="flex items-center gap-2">
              <span>กด</span>
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 text-xs font-mono">ESC</kbd>
              <span>เพื่อปิด</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};