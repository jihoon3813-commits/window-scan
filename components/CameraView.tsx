
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';

interface CameraViewProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
      }
    } catch (err) {
      setError("카메라를 시작할 수 없습니다. 권한을 확인해주세요.");
      console.error(err);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(dataUrl);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 text-white">
        <button onClick={onCancel} className="p-2"><X size={24} /></button>
        <span className="font-medium text-lg">창문 촬영</span>
        <button onClick={startCamera} className="p-2"><RefreshCw size={24} /></button>
      </div>

      <div className="flex-1 relative overflow-hidden bg-gray-900 flex items-center justify-center">
        {error ? (
          <div className="text-white text-center p-6">
            <p>{error}</p>
            <button onClick={onCancel} className="mt-4 px-4 py-2 bg-white text-black rounded-lg">돌아가기</button>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Alignment Guide */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="border-2 border-white/50 border-dashed w-3/4 h-1/2 rounded-lg flex items-center justify-center">
                <p className="text-white/70 text-sm font-medium bg-black/30 px-3 py-1 rounded-full">창문을 사각형 안에 맞춰주세요</p>
            </div>
        </div>
      </div>

      <div className="p-8 flex justify-center items-center bg-black">
        <button 
          onClick={capture}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
        >
          <div className="w-16 h-16 rounded-full bg-white"></div>
        </button>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;
