
import React from 'react';
import { WindowMeasurement } from '../types';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';

interface HistoryCardProps {
  measurement: WindowMeasurement;
  onClick: () => void;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ measurement, onClick }) => {
  const date = new Date(measurement.timestamp).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-all cursor-pointer hover:shadow-md"
    >
      <div className="flex">
        <div className="w-28 h-28 shrink-0 bg-gray-100">
          <img 
            src={measurement.imageUrl} 
            alt="Window" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center text-xs text-gray-500 mb-1">
              <Calendar size={12} className="mr-1" />
              {date}
            </div>
            <h3 className="font-bold text-gray-900 truncate flex items-center">
              <MapPin size={14} className="mr-1 text-blue-500" />
              {measurement.locationName || '미지정 위치'}
            </h3>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex gap-3">
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">WIDTH</span>
                <span className="font-bold text-blue-600">{measurement.widthCm}cm</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 block uppercase">HEIGHT</span>
                <span className="font-bold text-blue-600">{measurement.heightCm}cm</span>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-300" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryCard;
