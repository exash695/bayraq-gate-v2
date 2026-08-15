import React from 'react';
import { motion } from 'motion/react';
import { Bus, Clock, School, ChevronLeft, Phone } from 'lucide-react';

interface Stop {
  id: string;
  name: string;
  waitingStudents: number;
  busId?: string;
}

interface MetroTransitViewerProps {
  buses: any[];
  stops: Stop[];
  schoolName: string;
  busProgressMap: Record<string, number>;
  selectedBusId: string | null;
  onSelectBus: (id: string | null) => void;
  studentStatuses?: any[];
  onSelectStudentCount?: (busId: string, busName: string) => void;
}

export const MetroTransitViewer: React.FC<MetroTransitViewerProps> = ({ 
  buses, 
  stops, 
  schoolName, 
  busProgressMap,
  studentStatuses,
  onSelectStudentCount
}) => {
  const [selectedModalBus, setSelectedModalBus] = React.useState<{ id: string; name: string } | null>(null);

  const modalStudents = selectedModalBus && studentStatuses 
    ? studentStatuses.filter((s: any) => s.routeId === selectedModalBus.id) 
    : [];

  return (
    <div className="w-full h-full bg-[#000000] text-white overflow-y-auto custom-scrollbar relative" dir="rtl">
      {/* Background ambient glow - extremely subtle */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[50%] h-[300px] bg-indigo-500/5 blur-[120px] pointer-events-none rounded-full z-0" />
      
      <div className="max-w-6xl mx-auto w-full flex flex-col py-6 px-4 md:px-8 relative z-10 gap-12">
        {buses.map((bus, index) => {
           const busStops = stops.filter(s => s.busId === bus.id);
           const finalStops = busStops.length > 0 ? busStops : stops;
           return (
             <React.Fragment key={bus.id}>
               <MetroLineRow 
                 bus={bus} 
                 stops={finalStops} 
                 schoolName={schoolName}
                 progress={bus.progress !== undefined ? bus.progress : (busProgressMap[bus.id] || 0)}
                 onSelectStudentCount={(id, name) => setSelectedModalBus({ id, name })}
               />
               {index < buses.length - 1 && (
                 <div className="w-full h-px bg-white/[0.05]" />
               )}
             </React.Fragment>
           );
        })}

        {buses.length === 0 && (
          <div className="text-center text-gray-500 mt-20 font-medium">
            لا توجد خطوط نشطة حالياً
          </div>
        )}
      </div>

      {/* Modern Interactive Students Modal */}
      {selectedModalBus && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-gradient-to-b from-[#0c122c] to-[#060814] border border-white/10 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden text-right"
          >
            {/* Top Close Button */}
            <button 
              onClick={() => setSelectedModalBus(null)}
              className="absolute top-4 left-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white cursor-pointer"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <span className="text-[10px] text-[#FFD600] font-black bg-[#FFD600]/10 border border-[#FFD600]/20 px-2.5 py-1 rounded-full uppercase">ركاب الحافلة</span>
              <h3 className="text-lg font-black text-white mt-2 flex items-center gap-2">
                <Bus className="w-5 h-5 text-[#FFD600] animate-pulse" />
                <span>قائمة طلاب: {selectedModalBus.name}</span>
              </h3>
              <p className="text-xs text-white/40 mt-1">يبلغ إجمالي الطلاب المعينين على هذا الخط {modalStudents.length} طلاب.</p>
            </div>

            {/* Students List Container */}
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {modalStudents.length === 0 ? (
                <div className="text-center py-10 text-white/40">
                  <p className="text-xs font-bold">لا يوجد طلاب معينين على هذا الخط حالياً.</p>
                  <p className="text-[10px] text-white/20 mt-1">يمكنك تعيين الركاب من علامة التبويب "إدارة ركاب الحافلات".</p>
                </div>
              ) : (
                modalStudents.map((student: any) => {
                  const getStatusStyle = (status: string) => {
                    switch (status) {
                      case 'picked_up':
                        return { text: 'صعد الحافلة 🚌', cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
                      case 'dropped_off':
                        return { text: 'وصل بسلام ✅', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
                      case 'absent':
                        return { text: 'غائب اليوم 🔴', cls: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
                      default:
                        return { text: 'ينتظر في المحطة ⏳', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
                    }
                  };

                  const statusStyle = getStatusStyle(student.status);

                  return (
                    <div key={student.id} className="p-3 bg-white/5 border border-white/5 rounded-2xl hover:border-white/10 transition-colors flex items-center justify-between font-sans">
                      <div className="text-right">
                        <p className="text-xs font-black text-white">{student.studentName}</p>
                        <p className="text-[10px] text-white/50 mt-1 flex items-center gap-1">
                          <span className="opacity-60">الموقف:</span> {student.stopName || 'غير محدد'}
                        </p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${statusStyle.cls}`}>
                        {statusStyle.text}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Close Button */}
            <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
              <button 
                onClick={() => setSelectedModalBus(null)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/15 active:scale-95 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes flow-rtl {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
        .animated-track {
          background-image: linear-gradient(to left, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
          background-size: 50px 100%;
          animation: flow-rtl 1.5s linear infinite;
        }
      `}} />
    </div>
  );
};

const MetroLineRow: React.FC<{
  bus: any;
  stops: Stop[];
  schoolName: string;
  progress: number;
  onSelectStudentCount?: (busId: string, busName: string) => void;
}> = ({ bus, stops, schoolName, progress, onSelectStudentCount }) => {
  const lineProgress = Math.max(0, Math.min(1, progress));
  const busColor = bus.routeColor || '#3b82f6'; // default blue
  const isMoving = bus.status === 'moving' || bus.status === 'in_transit' || bus.speed > 0;

  // Determine current and next stop
  let currentStopName = bus.currentStop || 'محطة الانطلاق';
  let nextStopName = bus.nextStop || '';
  let passedStopsCount = 0;
  
  if (!bus.currentStop || !bus.nextStop) {
    // Fallback calculation geometrically if database fields aren't written yet
    for (let i = 0; i < stops.length; i++) {
      const stopProgress = (i + 1) / (stops.length + 1);
      if (lineProgress >= stopProgress) {
        currentStopName = stops[i].name;
        passedStopsCount++;
      }
      if (lineProgress < stopProgress && !nextStopName) {
        nextStopName = stops[i].name;
      }
    }
    
    if (!nextStopName && lineProgress < 1) nextStopName = schoolName;
    if (lineProgress >= 1) {
      currentStopName = schoolName;
      nextStopName = 'تم الوصول';
      passedStopsCount = stops.length; // All stops passed
    }
  } else {
    // Compute passedStopsCount based on index
    const currentIdx = stops.findIndex(s => s.name === bus.currentStop);
    passedStopsCount = currentIdx !== -1 ? currentIdx + 1 : 0;
    if (bus.currentStop === schoolName) {
      passedStopsCount = stops.length;
    }
  }

  const percentComplete = Math.round(lineProgress * 100);
  const stopsRemaining = Math.max(0, stops.length - passedStopsCount);

  const getStopsRemainingText = (count: number) => {
    if (count === 0) return 'وصلت لكل المحطات';
    if (count === 1) return 'تبقى محطة واحدة';
    if (count === 2) return 'تبقى محطتان';
    if (count >= 3 && count <= 10) return `تبقى ${count} محطات`;
    return `تبقى ${count} محطة`;
  };

  return (
    <div className="w-full flex flex-col gap-5 group relative" id={`bus-row-${bus.id}`}>
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: busColor, boxShadow: `0 0 10px ${busColor}80` }} />
          <h3 className="font-extrabold text-sm md:text-base text-gray-200" style={{ color: busColor }}>{bus.routeName || bus.name}</h3>
          {bus.phone && bus.phone !== 'غير مححدد' && bus.phone !== 'غير محدد' && (
            <a href={`tel:${bus.phone}`} className="mr-2 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors" title="اتصال بالسائق">
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] md:text-xs font-bold text-gray-300 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            {percentComplete === 100 ? 'تم الوصول بالكامل' : `${percentComplete}% من الرحلة مكتمل`}
          </span>
          <span className="text-[10px] md:text-xs font-bold text-gray-400">
            {getStopsRemainingText(stopsRemaining)}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative w-full flex items-center px-4 pb-12 pt-4">
        <div className="relative w-full h-[6px] flex items-center bg-[#0a0f1a] border border-white/5 rounded-full">
          
          {/* Active Track (Colored with Pulse) */}
          <div className="absolute right-0 h-full rounded-full transition-all duration-1000 ease-linear z-0 overflow-hidden" 
               style={{ 
                 width: `${lineProgress * 100}%`, 
                 backgroundColor: busColor,
                 boxShadow: `0 0 20px ${busColor}`
               }}>
               {/* Moving light pulse on active track */}
               {isMoving && lineProgress < 1 && (
                 <div className="absolute inset-0 animated-track opacity-50" />
               )}
            </div>

          {/* Stops Container */}
          <div className="absolute inset-0 flex justify-between items-center z-10">
             {/* Start Point (Home) */}
             <div className="relative flex flex-col items-center justify-center bg-[#000000] px-1">
                <div className="w-3 h-3 rounded-full transition-colors duration-500" style={{ backgroundColor: lineProgress > 0 ? busColor : '#374151' }} />
                <div className="absolute top-6 whitespace-nowrap text-center">
                  <span className="text-[9px] md:text-[10px] font-bold text-gray-400 block">الانطلاق</span>
                </div>
             </div>

             {/* Middle Stops */}
             {stops.map((stop, index) => {
                const stopProgress = (index + 1) / (stops.length + 1);
                const isPassed = lineProgress >= stopProgress;
                
                // Highlight the current active stop
                const isCurrent = currentStopName === stop.name && lineProgress < 1;
                
                return (
                  <div key={stop.id} className="relative flex flex-col items-center justify-center group/stop bg-[#000000] px-1">
                    <div className="w-3 h-3 rounded-full border-[1.5px] transition-all duration-500" 
                         style={{ 
                           borderColor: isPassed || isCurrent ? busColor : '#374151',
                           backgroundColor: isPassed ? busColor : '#000000',
                           boxShadow: isCurrent ? `0 0 12px ${busColor}` : 'none',
                           transform: isCurrent ? 'scale(1.3)' : 'scale(1)'
                         }} />
                    {/* Stop Label below the line */}
                    <div className="absolute top-6 whitespace-nowrap text-center w-24 -translate-x-1/2 left-1/2 flex flex-col items-center">
                      <span className={`text-[9px] md:text-[10px] font-bold block transition-colors duration-300 ${isPassed || isCurrent ? 'text-gray-200' : 'text-gray-600'}`}>
                        {stop.name}
                      </span>
                      {stop.waitingStudents > 0 && (
                        <span className="inline-flex items-center justify-center bg-amber-500/20 text-amber-300 text-[8px] font-black px-1.5 py-0.5 rounded-md border border-amber-500/30 mt-0.5 scale-90 animate-pulse">
                          👥 {stop.waitingStudents} ينتظرون
                        </span>
                      )}
                    </div>
                  </div>
                )
             })}

             {/* End Point (School) */}
             <div className="relative flex flex-col items-center justify-center bg-[#000000] px-2 group/school z-20">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#FFD600]/20 to-[#FFD600]/5 border border-[#FFD600]/60 transition-all duration-500 shadow-[0_0_20px_rgba(255,214,0,0.5)]">
                  <School className="w-5 h-5 text-[#FFD600] drop-shadow-[0_0_5px_rgba(255,214,0,0.8)]" />
                </div>
                <div className="absolute top-12 whitespace-nowrap text-center">
                  <span className="text-[10px] md:text-xs font-black text-[#FFD600] drop-shadow-sm block">المدرسة</span>
                </div>
             </div>
          </div>

          {/* Moving Bus */}
          <motion.div 
            className="absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none"
            style={{ right: `${lineProgress * 100}%` }}
            animate={{ x: '50%' }}
            transition={{ duration: 1, ease: 'linear' }}
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.8)] border-2" 
                 style={{ backgroundColor: '#050505', borderColor: busColor, boxShadow: `0 0 25px ${busColor}99` }}>
              <div className="absolute inset-0 rounded-xl opacity-30 blur-[4px] pointer-events-none" style={{ backgroundColor: busColor }} />
              {isMoving && (
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex items-center">
                  <ChevronLeft className="w-4 h-4 opacity-40 animate-pulse" style={{ color: busColor, animationDelay: '150ms' }} />
                  <ChevronLeft className="w-4 h-4 -mr-2 opacity-70 animate-pulse" style={{ color: busColor, animationDelay: '0ms' }} />
                </div>
              )}
              <Bus className="w-5 h-5 relative z-10 scale-x-[-1]" style={{ color: busColor }} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-wrap items-center justify-between px-3 text-[10px] md:text-xs text-gray-400 bg-white/[0.02] py-2 rounded-xl border border-white/[0.02]">
        
        <div className="flex items-center gap-3">
            <span className={isMoving ? 'text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded' : 'text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded'}>
              {isMoving ? 'في الطريق' : 'متوقف'}
            </span>
            <span className="font-mono text-gray-300 font-bold bg-white/5 px-2 py-0.5 rounded">{bus.speed || 0} كم/س</span>
            <button 
              onClick={() => onSelectStudentCount?.(bus.id, bus.routeName || bus.name)}
              className="font-mono text-[#FFD600] font-black bg-[#FFD600]/10 hover:bg-[#FFD600]/20 active:scale-95 transition-all px-2.5 py-0.5 rounded flex items-center gap-1 cursor-pointer border border-[#FFD600]/20"
            >
              <span>{bus.studentsCount || 0} طالب</span>
              <span className="text-[9px] text-white/50 opacity-80 font-black">(👥 عرض)</span>
            </button>
        </div>

        <div className="flex items-center gap-3">
          <span>المحطة الحالية: <span className="text-gray-200 font-bold">{currentStopName}</span></span>
          <span className="text-gray-700">•</span>
          <span>التالية: <span className="text-gray-200 font-bold">{nextStopName}</span></span>
          
          {bus.distanceToSchool && (
            <>
              <span className="text-gray-700">•</span>
              <span>المسافة: <span className="text-[#3b82f6] font-bold">{bus.distanceToSchool}</span></span>
            </>
          )}

          {bus.eta && (
            <>
              <span className="text-gray-700">•</span>
              <span className="flex items-center gap-1 text-[#FFD600] font-bold">
                 <Clock className="w-3 h-3 text-[#FFD600]" />
                 الوصول المتوقع: {bus.eta}
              </span>
            </>
          )}
        </div>
        
      </div>
    </div>
  );
};
