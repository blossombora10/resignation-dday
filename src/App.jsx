import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Settings, Briefcase, CheckCircle2, RotateCcw, ChevronLeft, ChevronRight, MousePointer2, Minus, Plus, AlertCircle } from 'lucide-react';

const STORAGE_KEYS = {
  resignationDate: 'resignationDate',
  totalAnnualLeave: 'totalAnnualLeave',
  excludeWeekends: 'excludeWeekends',
  excludeHolidays: 'excludeHolidays',
  selectionMode: 'selectionMode',
  manualOverrides: 'manualOverrides',
};

const App = () => {
  const getDefaultResignationDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  };

  const [resignationDate, setResignationDate] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.resignationDate);
    return saved || getDefaultResignationDate();
  });
  const [viewDate, setViewDate] = useState(new Date());
  const [totalAnnualLeave, setTotalAnnualLeave] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.totalAnnualLeave);
    const parsed = Number(saved);
    return Number.isFinite(parsed) ? parsed : 10;
  }); // 총 보유 연차 개수
  const [excludeWeekends, setExcludeWeekends] = useState(() => localStorage.getItem(STORAGE_KEYS.excludeWeekends) === 'true');
  const [excludeHolidays, setExcludeHolidays] = useState(() => localStorage.getItem(STORAGE_KEYS.excludeHolidays) === 'true');
  
  const [selectionMode, setSelectionMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.selectionMode);
    return saved === 'LEAVE' ? 'LEAVE' : 'WORK';
  });
  const [manualOverrides, setManualOverrides] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.manualOverrides);
    if (!saved) return {};

    try {
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.resignationDate, resignationDate);
  }, [resignationDate]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.totalAnnualLeave, String(totalAnnualLeave));
  }, [totalAnnualLeave]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.excludeWeekends, String(excludeWeekends));
  }, [excludeWeekends]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.excludeHolidays, String(excludeHolidays));
  }, [excludeHolidays]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.selectionMode, selectionMode);
  }, [selectionMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.manualOverrides, JSON.stringify(manualOverrides));
  }, [manualOverrides]);

  // 한국 공휴일 데이터
  const KOREAN_HOLIDAYS = useMemo(() => [
    '2024-12-25', '2025-01-01', '2025-01-28', '2025-01-29', '2025-01-30', '2025-03-01', '2025-05-05', '2025-05-06', '2025-06-06', '2024-08-15', '2025-10-03', '2025-10-09', '2025-12-25',
    '2026-01-01', '2026-02-16', '2026-02-17', '2026-02-18', '2026-03-01', '2026-05-05', '2026-05-24', '2026-06-06', '2026-08-15', '2026-09-24', '2026-09-25', '2026-09-26', '2026-10-03', '2026-10-09', '2026-12-25'
  ], []);

  const getDateStatus = (dateStr) => {
    if (manualOverrides[dateStr]) return manualOverrides[dateStr];
    const date = new Date(dateStr);
    const day = date.getDay();
    if (excludeWeekends && (day === 0 || day === 6)) return 'OFF';
    if (excludeHolidays && KOREAN_HOLIDAYS.includes(dateStr)) return 'OFF';
    return 'WORK';
  };

  const usedLeaveInCalendar = useMemo(() => {
    return Object.values(manualOverrides).filter(status => status === 'LEAVE').length;
  }, [manualOverrides]);

  const handleDateClick = (dateStr) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(dateStr);
    const resignation = new Date(resignationDate);

    if (target <= today || target > resignation) return;

    const currentStatus = getDateStatus(dateStr);
    const newOverrides = { ...manualOverrides };

    if (selectionMode === 'WORK') {
      newOverrides[dateStr] = (currentStatus === 'WORK' || currentStatus === 'LEAVE') ? 'OFF' : 'WORK';
    } else if (selectionMode === 'LEAVE') {
      if (currentStatus === 'LEAVE') {
        newOverrides[dateStr] = 'WORK';
      } else {
        if (usedLeaveInCalendar >= totalAnnualLeave) return;
        newOverrides[dateStr] = 'LEAVE';
      }
    }
    setManualOverrides(newOverrides);
  };

  const counts = useMemo(() => {
    let work = 0;
    let calendarLeave = 0;
    if (!resignationDate) return { work: 0, leave: 0 };
    const start = new Date();
    start.setHours(0,0,0,0);
    const end = new Date(resignationDate);
    let cur = new Date(start);
    cur.setDate(cur.getDate() + 1);
    while (cur <= end) {
      const dateStr = cur.toISOString().split('T')[0];
      const status = getDateStatus(dateStr);
      if (status === 'WORK') work++;
      if (status === 'LEAVE') calendarLeave++;
      cur.setDate(cur.getDate() + 1);
    }
    return { work, leave: calendarLeave };
  }, [resignationDate, manualOverrides, excludeWeekends, excludeHolidays]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= lastDate; d++) {
      const date = new Date(year, month, d);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      days.push(`${y}-${m}-${day}`);
    }
    return days;
  }, [viewDate]);

  // 포맷팅된 목표일 (YYYY.MM.DD)
  const formattedTargetDate = useMemo(() => {
    if (!resignationDate) return "";
    return resignationDate.replace(/-/g, '.');
  }, [resignationDate]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans px-4 pb-4 pt-2 md:px-8 md:pb-8 md:pt-4 flex flex-col items-center">
      <div className="max-w-md w-full space-y-4">
        
        {/* Header */}
        <header className="flex justify-between items-center py-0 px-1 -mb-2">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="퇴사 디데이 로고" className="w-10 h-10 rounded-xl object-contain" />
            <h1 className="text-xl font-bold tracking-tight text-slate-800">퇴사 디데이</h1>
          </div>
          <button 
            onClick={() => {setManualOverrides({}); setTotalAnnualLeave(10);}} 
            className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 transition-colors shadow-sm"
          >
            <RotateCcw size={18} />
          </button>
        </header>

        {/* Dashboard */}
        <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-slate-200 border border-slate-100 text-center relative overflow-hidden">
          <p className="text-slate-400 font-normal text-sm">남은 출근</p>
          <div className="flex justify-center items-baseline gap-1 mt-1 mb-9">
            <span className="text-9xl font-black text-emerald-500 tracking-tighter leading-none">{counts.work}</span>
            <span className="text-2xl font-bold text-slate-400">번</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="flex flex-col gap-1.5 px-4 py-3">
              <span className="text-[11px] te00 font-normal">퇴사 예정일</span>
              <span className="text-base font-bold text-slate-800">{formattedTargetDate}</span>
            </div>
            <div className="flex flex-col gap-1.5 bg-emerald-50 rounded-[18px] px-4 py-3">
              <span className="text-[11px] text-slate-400 font-normal">사용 가능한 연차</span>
              <span className="text-base font-bold text-slate-800">{totalAnnualLeave - counts.leave}일</span>
            </div>
          </div>
        </div>
        {/* Selection Mode Selector */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setSelectionMode('WORK')}
            className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold text-sm ${selectionMode === 'WORK' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-100' : 'border-white bg-white text-slate-400 shadow-sm'}`}
          >
             출근일 체크
          </button>
          <button 
            onClick={() => setSelectionMode('LEAVE')}
            className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-bold text-sm ${selectionMode === 'LEAVE' ? 'border-orange-500 bg-orange-50 text-orange-700 ring-4 ring-orange-100' : 'border-white bg-white text-slate-400 shadow-sm'}`}
          >
             연차 체크
          </button>
        </div>

        {/* Calendar */}
        <section className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))} className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-400"><ChevronLeft size={16}/></button>
              <span className="text-xs font-black text-slate-600 w-24 text-center">{viewDate.getFullYear()}.{String(viewDate.getMonth() + 1).padStart(2, '0')}</span>
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))} className="p-1.5 hover:bg-white rounded-lg transition-all text-slate-400"><ChevronRight size={16}/></button>
            </div>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">달력을 터치하세요</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} className={`text-[10px] font-bold text-center py-1 ${i === 0 ? 'text-red-300' : i === 6 ? 'text-blue-300' : 'text-slate-300'}`}>{d}</div>
            ))}
            {calendarDays.map((dateStr, idx) => {
              if (!dateStr) return <div key={`empty-${idx}`} />;
              const dayNum = parseInt(dateStr.split('-')[2]);
              const status = getDateStatus(dateStr);
              const today = new Date(); today.setHours(0,0,0,0);
              const target = new Date(dateStr);
              const resignation = new Date(resignationDate);
              const isActive = target > today && target <= resignation;

              let style = "bg-slate-50 border-transparent text-slate-200 cursor-default";
              let content = <span className="text-xs font-bold">{dayNum}</span>;

              if (isActive) {
                if (status === 'WORK') {
                  style = "bg-emerald-500 border-emerald-400 text-white shadow-sm cursor-pointer hover:scale-105 z-10";
                } else if (status === 'LEAVE') {
                  style = "bg-orange-500 border-orange-400 text-white shadow-sm cursor-pointer hover:scale-105 z-10";
                } else {
                  style = "bg-white border-slate-200 text-slate-300 cursor-pointer hover:border-slate-400";
                }
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => handleDateClick(dateStr)}
                  disabled={!isActive}
                  className={`relative h-12 rounded-2xl flex flex-col items-center justify-center transition-all border ${style}`}
                >
                  {content}
                </button>
              );
            })}
          </div>

          <div className="flex justify-center gap-5 pt-3 border-t border-slate-50">
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] font-bold text-slate-400 uppercase">출근</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div><span className="text-[10px] font-bold text-slate-400 uppercase">연차</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-200"></div><span className="text-[10px] font-bold text-slate-400 uppercase">휴무</span></div>
          </div>
        </section>

        {/* Settings Group */}
        <section className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">기본 설정</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-colors focus-within:border-emerald-200 group">
              <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <CalendarIcon size={16} className="text-emerald-500"/> 퇴사 목표일
              </span>
              <input 
                type="date" 
                className="bg-transparent text-sm font-black text-emerald-600 outline-none cursor-pointer text-right"
                value={resignationDate}
                onChange={(e) => {
                    setResignationDate(e.target.value);
                    setManualOverrides({});
                }}
              />
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-colors focus-within:border-orange-200">
              <span className="text-sm font-bold text-slate-700">총 연차 개수</span>
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                <button 
                  onClick={() => setTotalAnnualLeave(Math.max(0, totalAnnualLeave - 1))} 
                  className="text-slate-400 hover:text-emerald-500 transition-colors p-1"
                >
                  <Minus size={14}/>
                </button>
                <input 
                  type="number" 
                  className="w-8 text-center text-sm font-black text-slate-700 outline-none bg-transparent"
                  value={totalAnnualLeave}
                  onChange={(e) => setTotalAnnualLeave(Number(e.target.value))}
                />
                <button 
                  onClick={() => setTotalAnnualLeave(totalAnnualLeave + 1)} 
                  className="text-slate-400 hover:text-emerald-500 transition-colors p-1"
                >
                  <Plus size={14}/>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button 
                onClick={() => setExcludeWeekends(!excludeWeekends)}
                className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all ${excludeWeekends ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-50' : 'border-slate-100 bg-white text-slate-400'}`}
              >
                <span className="text-xs font-bold">주말 제외</span>
                <CheckCircle2 size={16} className={excludeWeekends ? 'text-emerald-500' : 'text-slate-200'} />
              </button>
              <button 
                onClick={() => setExcludeHolidays(!excludeHolidays)}
                className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all ${excludeHolidays ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-50' : 'border-slate-100 bg-white text-slate-400'}`}
              >
                <span className="text-xs font-bold">공휴일 제외</span>
                <CheckCircle2 size={16} className={excludeHolidays ? 'text-emerald-500' : 'text-slate-200'} />
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pb-10">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-loose">
            퇴사 디데이 <br/>
            자유를 향한 계획을 시작하세요.
          </p>
        </footer>

      </div>
    </div>
  );
};

export default App;

// Dashboard div 내부 교체 예시 (설명용, 실제 교체는 return 문에서 해야 함)
// <div className="Dashboard 관련 className">
//   <p className="text-slate-400 font-normal text-sm">남은 출근</p>
//   <div className="flex justify-center items-baseline gap-1 mt-1 mb-9">
//     <span className="text-9xl font-black text-emerald-500 tracking-tighter leading-none">
//       {counts.work}
//     </span>
//     <span className="text-2xl font-bold text-slate-400">번</span>
//   </div>
//   <div className="grid grid-cols-2 gap-3 text-left">
//     <div className="flex flex-col gap-1.5 px-4 py-3">
//       <span className="text-[11px] text-slate-400 font-normal">퇴사 예정일</span>
//       <span className="text-base font-bold text-slate-800">{formattedTargetDate}</span>
//     </div>
//     <div className="flex flex-col gap-1.5 bg-emerald-50 rounded-[18px] px-4 py-3">
//       <span className="text-[11px] text-slate-400 font-normal">사용 가능한 연차</span>
//       <span className="text-base font-bold text-slate-800">{totalAnnualLeave - counts.leave}일</span>
//     </div>
//   </div>
// </div>