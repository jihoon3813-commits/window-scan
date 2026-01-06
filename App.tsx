
import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  History, 
  Plus, 
  Share2, 
  MapPin, 
  ArrowLeft, 
  ChevronRight,
  Loader2,
  CheckCircle2,
  Trash2,
  Edit2
} from 'lucide-react';
import { AppState, WindowMeasurement, GeminiMeasurementResponse } from './types';
import CameraView from './components/CameraView';
import HistoryCard from './components/HistoryCard';
import { analyzeWindowImage } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.HOME);
  const [measurements, setMeasurements] = useState<WindowMeasurement[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<GeminiMeasurementResponse | null>(null);
  const [locationName, setLocationName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<WindowMeasurement | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load measurements from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('window_measurements');
    if (saved) {
      try {
        setMeasurements(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load measurements");
      }
    }
  }, []);

  // Save measurements to local storage when they change
  useEffect(() => {
    localStorage.setItem('window_measurements', JSON.stringify(measurements));
  }, [measurements]);

  const handleCapture = (imageData: string) => {
    setCurrentImage(imageData);
    setState(AppState.PROCESSING);
    startAnalysis(imageData);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCurrentImage(result);
        setState(AppState.PROCESSING);
        startAnalysis(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async (imageData: string) => {
    setIsLoading(true);
    try {
      const result = await analyzeWindowImage(imageData);
      setCurrentAnalysis(result);
      
      // Try to get location automatically
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            // Simplified reverse geocoding would happen here
            // For now just placeholders or let user enter
            setLocationName("");
          },
          () => console.log("Location access denied")
        );
      }
      
      setState(AppState.RESULT);
    } catch (err) {
      alert("이미지 분석 중 오류가 발생했습니다. 다시 시도해주세요.");
      setState(AppState.HOME);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAndHome = () => {
    if (currentAnalysis && currentImage) {
      const newMeasure: WindowMeasurement = {
        id: Date.now().toString(),
        widthCm: currentAnalysis.width,
        heightCm: currentAnalysis.height,
        locationName: locationName || '미지정 위치',
        imageUrl: currentImage,
        timestamp: Date.now(),
        confidence: currentAnalysis.confidence
      };
      setMeasurements(prev => [newMeasure, ...prev]);
      resetFlow();
    }
  };

  const resetFlow = () => {
    setCurrentImage(null);
    setCurrentAnalysis(null);
    setLocationName('');
    setSelectedMeasurement(null);
    setState(AppState.HOME);
  };

  const handleShare = (m: WindowMeasurement) => {
    const text = `[창문 측정 결과]\n위치: ${m.locationName}\n사이즈: 가로 ${m.widthCm}cm x 세로 ${m.heightCm}cm\n측정일시: ${new Date(m.timestamp).toLocaleString()}`;
    
    if (navigator.share) {
      navigator.share({
        title: '창문 측정 결과',
        text: text,
      }).catch(console.error);
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        alert("결과가 클립보드에 복사되었습니다.");
      });
    }
  };

  const deleteMeasurement = (id: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      setMeasurements(prev => prev.filter(m => m.id !== id));
      resetFlow();
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col relative pb-24 shadow-xl">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        {state !== AppState.HOME ? (
          <button onClick={resetFlow} className="p-2 -ml-2 text-gray-600">
            <ArrowLeft size={24} />
          </button>
        ) : (
          <div className="w-10"></div>
        )}
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">SmartWindow</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 p-6">
        {state === AppState.HOME && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Quick Actions */}
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">새 측정 시작</h2>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setState(AppState.CAPTURE)}
                  className="flex flex-col items-center justify-center p-6 bg-blue-600 rounded-3xl text-white shadow-lg shadow-blue-200 active:scale-95 transition-all"
                >
                  <Camera size={32} className="mb-2" />
                  <span className="font-bold">카메라 촬영</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl text-gray-700 border border-gray-200 shadow-sm active:scale-95 transition-all"
                >
                  <Upload size={32} className="mb-2 text-blue-500" />
                  <span className="font-bold">사진 업로드</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                />
              </div>
            </section>

            {/* Recent History */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">최근 측정 내역</h2>
                <button className="text-blue-600 text-sm font-medium">전체보기</button>
              </div>
              
              <div className="space-y-4">
                {measurements.length === 0 ? (
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-10 text-center">
                    <History size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500 font-medium">아직 측정 내역이 없습니다</p>
                    <p className="text-xs text-gray-400 mt-1">창문 사진을 찍어 측정을 시작하세요</p>
                  </div>
                ) : (
                  measurements.slice(0, 5).map(m => (
                    <HistoryCard 
                      key={m.id} 
                      measurement={m} 
                      onClick={() => {
                        setSelectedMeasurement(m);
                        setState(AppState.RESULT);
                      }} 
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {state === AppState.PROCESSING && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in zoom-in duration-300">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 animate-pulse"></div>
                <Loader2 size={64} className="text-blue-600 animate-spin relative z-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">창문 분석 중...</h2>
            <p className="text-gray-500 max-w-xs mx-auto">AI가 사진 속 창문의 크기를 정밀하게 측정하고 있습니다. 잠시만 기다려주세요.</p>
          </div>
        )}

        {state === AppState.RESULT && (
          <div className="animate-in slide-in-from-bottom duration-500">
            {/* Displaying selected or current analysis */}
            {selectedMeasurement ? (
               <div className="space-y-6">
                  <div className="rounded-3xl overflow-hidden shadow-xl aspect-[4/3] relative">
                    <img src={selectedMeasurement.imageUrl} className="w-full h-full object-cover" alt="Window" />
                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs">
                        신뢰도 {(selectedMeasurement.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mr-4">
                        <MapPin size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{selectedMeasurement.locationName}</h3>
                        <p className="text-sm text-gray-400">{new Date(selectedMeasurement.timestamp).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1 block">Width</span>
                        <p className="text-2xl font-black text-blue-600">{selectedMeasurement.widthCm}<span className="text-sm font-bold ml-1">cm</span></p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1 block">Height</span>
                        <p className="text-2xl font-black text-blue-600">{selectedMeasurement.heightCm}<span className="text-sm font-bold ml-1">cm</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleShare(selectedMeasurement)}
                      className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all"
                    >
                      <Share2 size={20} />
                      공유하기
                    </button>
                    <button 
                      onClick={() => deleteMeasurement(selectedMeasurement.id)}
                      className="p-4 bg-white border border-gray-200 text-red-500 rounded-2xl active:scale-95 transition-all"
                    >
                      <Trash2 size={24} />
                    </button>
                  </div>
               </div>
            ) : (
              <div className="space-y-6">
                 <div className="rounded-3xl overflow-hidden shadow-xl aspect-[4/3] relative">
                    <img src={currentImage!} className="w-full h-full object-cover" alt="Window" />
                    <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
                        <div className="flex items-center text-white">
                            <CheckCircle2 size={18} className="mr-2 text-green-400" />
                            <span className="text-sm font-bold">측정 완료</span>
                        </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1">위치 정보 입력</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
                            <input 
                                type="text"
                                value={locationName}
                                onChange={(e) => setLocationName(e.target.value)}
                                placeholder="예: 거실 왼쪽 창문, 안방 발코니"
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase">Width</span>
                                <Edit2 size={12} className="text-gray-300" />
                            </div>
                            <div className="flex items-baseline">
                                <input 
                                    type="number" 
                                    value={currentAnalysis?.width} 
                                    onChange={(e) => setCurrentAnalysis(prev => prev ? {...prev, width: Number(e.target.value)} : null)}
                                    className="w-full bg-transparent border-none p-0 text-3xl font-black text-blue-600 focus:ring-0"
                                />
                                <span className="text-sm font-bold text-blue-600 ml-1">cm</span>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase">Height</span>
                                <Edit2 size={12} className="text-gray-300" />
                            </div>
                            <div className="flex items-baseline">
                                <input 
                                    type="number" 
                                    value={currentAnalysis?.height} 
                                    onChange={(e) => setCurrentAnalysis(prev => prev ? {...prev, height: Number(e.target.value)} : null)}
                                    className="w-full bg-transparent border-none p-0 text-3xl font-black text-blue-600 focus:ring-0"
                                />
                                <span className="text-sm font-bold text-blue-600 ml-1">cm</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <p className="text-xs text-blue-600 leading-relaxed italic">
                            &quot;{currentAnalysis?.reasoning}&quot;
                        </p>
                    </div>
                  </div>

                  <button 
                    onClick={saveAndHome}
                    className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg shadow-xl active:scale-[0.98] transition-all"
                  >
                    데이터 저장 및 홈으로
                  </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* --- CAMERA OVERLAY --- */}
      {state === AppState.CAPTURE && (
        <CameraView 
          onCapture={handleCapture}
          onCancel={() => setState(AppState.HOME)}
        />
      )}

      {/* --- BOTTOM NAV BAR --- */}
      {state === AppState.HOME && (
        <nav className="fixed bottom-0 max-w-md w-full bg-white border-t border-gray-200 py-4 px-10 flex justify-around items-center z-40">
           <button 
            onClick={() => setState(AppState.HOME)}
            className="flex flex-col items-center gap-1 text-blue-600"
           >
             <Plus className="bg-blue-600 text-white rounded-full p-1 mb-1" size={32} />
             <span className="text-xs font-bold">New</span>
           </button>
           <button 
            onClick={() => {}} 
            className="flex flex-col items-center gap-1 text-gray-400"
           >
             <History size={24} />
             <span className="text-xs font-medium">History</span>
           </button>
        </nav>
      )}
    </div>
  );
};

export default App;
