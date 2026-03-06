import { useState, useEffect } from 'react';
import { User, Plane, Globe, ChevronLeft, ChevronRight, Shield, Check } from 'lucide-react';
import { TravelHistoryItem } from './TravelHistoryPanel';

interface PassportPanelProps {
  ownedVisas: string[];
  travelHistory: TravelHistoryItem[];
}

export function PassportPanel({ ownedVisas, travelHistory }: PassportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // 0: Info/Visas, 1: Stamps 1/2
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Open the book shortly after mounting
    const timer = setTimeout(() => setIsOpen(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Reset to page 0 after the book closes
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (!isOpen) {
      timeout = setTimeout(() => {
        setCurrentPage(0);
      }, 1000);
    }
    return () => clearTimeout(timeout);
  }, [isOpen]);

  const changePage = (newPage: number) => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsFading(false);
    }, 200);
  };

  const handleNextPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      setIsOpen(true);
      return;
    }
    if (currentPage < 1) {
      changePage(currentPage + 1);
    } else {
      setIsOpen(false);
    }
  };

  const handlePrevPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) return;
    if (currentPage > 0) {
      changePage(currentPage - 1);
    } else {
      setIsOpen(false);
    }
  };

  // Process travel history into stamps
  const stamps = travelHistory.map((trip, i) => {
    const colors = [
      'border-red-600 text-red-600',
      'border-blue-600 text-blue-600',
      'border-indigo-600 text-indigo-600',
      'border-emerald-600 text-emerald-600',
      'border-purple-600 text-purple-600',
      'border-orange-600 text-orange-600',
    ];
    const angles = ['-rotate-12', 'rotate-6', '-rotate-6', 'rotate-12', '-rotate-3', 'rotate-3'];
    
    return {
      city: trip.city,
      country: trip.country.substring(0, 3).toUpperCase(),
      date: new Date(trip.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
      color: colors[i % colors.length],
      angle: angles[i % angles.length],
      type: 'entry'
    };
  });

  const stampsPage1 = stamps.slice(0, 6);
  const stampsPage2 = stamps.slice(6, 12);

  const visaDetails: Record<string, { name: string, color: string }> = {
    'Schengen': { name: 'Schengen Area', color: 'from-blue-500 to-indigo-600' },
    'JPN': { name: 'Japan', color: 'from-red-500 to-rose-600' },
    'USA': { name: 'United States', color: 'from-blue-600 to-red-600' },
    'AUS': { name: 'Australia', color: 'from-emerald-500 to-teal-600' },
    'MARS': { name: 'Mars Colony', color: 'from-orange-500 to-red-600' },
    'GLOBAL': { name: 'Global Citizen', color: 'from-purple-500 to-fuchsia-600' },
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none bg-[#0a0f12]/40 backdrop-blur-sm">
      
      {/* Pagination Controls */}
      <div className={`absolute bottom-12 flex gap-4 pointer-events-auto z-50 transition-all duration-500 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button 
          onClick={handlePrevPage}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="h-12 px-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-mono font-bold tracking-widest shadow-lg">
          {currentPage === 0 ? '1 - 2' : '3 - 4'} / 4
        </div>
        <button 
          onClick={handleNextPage}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="perspective-[2000px] pointer-events-auto">
        {/* Book Wrapper */}
        <div 
          className="relative w-[300px] md:w-[350px] h-[450px] md:h-[500px] transition-transform duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            transform: isOpen ? 'translateX(150px)' : 'translateX(0)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Right Side (Back Cover + Right Page) */}
          <div 
            className="absolute inset-0 bg-[#1a2b4c] rounded-r-2xl shadow-[20px_20px_40px_rgba(0,0,0,0.6)] border-l border-black/40 cursor-pointer"
            style={{ transformStyle: 'preserve-3d' }}
            onClick={handleNextPage}
          >
            {/* Right Page (Inside) */}
            <div 
              className="absolute inset-y-1 right-1 left-0 bg-[#fdfbf7] rounded-r-xl p-5 overflow-hidden shadow-inner"
              style={{ transform: 'translateZ(1px)' }}
            >
              {/* Background Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <div className="w-48 h-48 rounded-full border-[16px] border-slate-900"></div>
              </div>

              <div className={`relative z-10 h-full flex flex-col transition-opacity duration-200 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                {currentPage === 0 ? (
                  // PAGE 2: VISAS
                  <>
                    <div className="flex justify-between items-end border-b-2 border-slate-800 pb-1 mb-4">
                      <h2 className="text-lg font-bold text-slate-800 tracking-widest uppercase">Visas</h2>
                      <span className="text-slate-500 font-mono text-xs">PAGE 2</span>
                    </div>

                    <div className="flex flex-col gap-3 overflow-y-auto h-[380px] pr-1 custom-scrollbar">
                      {ownedVisas.length === 0 ? (
                        <div className="text-center text-slate-400 mt-10 text-sm font-medium">No visas acquired yet.</div>
                      ) : (
                        ownedVisas.map((visaId) => {
                          const details = visaDetails[visaId] || { name: visaId, color: 'from-gray-500 to-slate-600' };
                          return (
                            <div key={visaId} className="relative overflow-hidden rounded-xl border border-slate-300 p-3 shadow-sm bg-white">
                              <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${details.color}`}></div>
                              <div className="flex items-center gap-3 pl-2">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${details.color} flex items-center justify-center text-white shadow-sm`}>
                                  {visaId === 'GLOBAL' ? <Globe className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{details.name}</h3>
                                  <p className="text-[9px] text-slate-500 font-mono">ID: {visaId}</p>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                </div>
                              </div>
                              {/* Watermark on visa */}
                              <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
                                <Shield className="w-16 h-16 text-slate-900" />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                ) : (
                  // PAGE 4: STAMPS 2
                  <>
                    <div className="flex justify-between items-end border-b-2 border-slate-800 pb-1 mb-4">
                      <h2 className="text-lg font-bold text-slate-800 tracking-widest uppercase">Visas / Stamps</h2>
                      <span className="text-slate-500 font-mono text-xs">PAGE 4</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {stampsPage2.map((stamp, index) => (
                        <div key={index} className={`flex justify-center items-center ${stamp.angle} opacity-80 hover:opacity-100 transition-opacity`}>
                          <div className={`w-24 h-24 rounded-full border-[3px] ${stamp.color} flex flex-col items-center justify-center relative p-1`}>
                            <div className={`absolute inset-1 rounded-full border border-dashed ${stamp.color} opacity-50`}></div>
                            <span className="text-[8px] font-bold tracking-widest uppercase mb-0.5">{stamp.country}</span>
                            <span className="text-[11px] font-black tracking-wider uppercase text-center leading-tight mb-0.5">{stamp.city}</span>
                            <div className="flex items-center gap-1 mb-0.5">
                              <div className={`w-0.5 h-0.5 rounded-full bg-current`}></div>
                              <Plane className="w-3 h-3" />
                              <div className={`w-0.5 h-0.5 rounded-full bg-current`}></div>
                            </div>
                            <span className="text-[7px] font-bold font-mono">{stamp.date}</span>
                            <div className={`absolute -bottom-2 bg-[#fdfbf7] px-2 text-[8px] font-black uppercase tracking-widest ${stamp.color}`}>
                              {stamp.type}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Left Side (Front Cover + Left Page) */}
          <div 
            className="absolute inset-0 origin-left transition-transform duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer"
            style={{
              transform: isOpen ? 'rotateY(-180deg)' : 'rotateY(0deg)',
              transformStyle: 'preserve-3d',
            }}
            onClick={(e) => {
              if (!isOpen) {
                e.stopPropagation();
                setIsOpen(true);
              } else {
                handlePrevPage(e);
              }
            }}
          >
            {/* Front Cover (Outside) */}
            <div 
              className="absolute inset-0 bg-[#1a2b4c] rounded-r-2xl border-l border-white/10 flex flex-col items-center justify-center p-6 shadow-[-20px_20px_40px_rgba(0,0,0,0.6)]"
              style={{ 
                transform: 'translateZ(1px)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              <Globe className="w-20 h-20 text-yellow-600/80 mb-8" />
              <h1 className="text-3xl font-serif text-yellow-600/90 tracking-[0.3em] uppercase text-center">Passport</h1>
              <div className="w-16 h-[1px] bg-yellow-600/50 my-8"></div>
              <p className="text-yellow-600/70 tracking-widest uppercase text-sm">Earth Union</p>
            </div>

            {/* Left Page (Inside of Front Cover) */}
            <div 
              className="absolute inset-y-1 left-1 right-0 bg-[#fdfbf7] rounded-l-xl p-5 overflow-hidden shadow-inner"
              style={{ 
                transform: 'rotateY(180deg) translateZ(1px)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden'
              }}
            >
              {/* Background Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <Plane className="w-48 h-48" />
              </div>

              <div className={`relative z-10 h-full flex flex-col transition-opacity duration-200 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                {currentPage === 0 ? (
                  // PAGE 1: INFORMATION
                  <>
                    <div className="flex justify-between items-end border-b-2 border-slate-800 pb-1 mb-4">
                      <h2 className="text-lg font-bold text-slate-800 tracking-widest uppercase">Passport</h2>
                      <span className="text-slate-500 font-mono text-xs">PAGE 1</span>
                    </div>

                    <div className="flex gap-4">
                      {/* Photo Placeholder */}
                      <div className="w-24 h-32 border-2 border-slate-300 bg-slate-100 rounded flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0 relative">
                        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_2px,#000_2px,#000_4px)]"></div>
                        <User className="w-14 h-14 text-slate-400 relative z-10" />
                      </div>

                      {/* Details Grid */}
                      <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-3">
                        <div className="col-span-2">
                          <p className="text-[8px] text-slate-500 uppercase font-bold">Surname / Nom</p>
                          <p className="text-xs font-bold text-slate-900 uppercase">Traveler</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[8px] text-slate-500 uppercase font-bold">Given names / Prénoms</p>
                          <p className="text-xs font-bold text-slate-900 uppercase">Focus</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-slate-500 uppercase font-bold">Nationality</p>
                          <p className="text-xs font-bold text-slate-900 uppercase">Earth</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-slate-500 uppercase font-bold">Date of birth</p>
                          <p className="text-xs font-bold text-slate-900 uppercase">01 JAN 2024</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-slate-500 uppercase font-bold">Sex</p>
                          <p className="text-xs font-bold text-slate-900 uppercase">U</p>
                        </div>
                        <div>
                          <p className="text-[8px] text-slate-500 uppercase font-bold">Place of birth</p>
                          <p className="text-xs font-bold text-slate-900 uppercase">Internet</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[8px] text-slate-500 uppercase font-bold">Authority</p>
                          <p className="text-xs font-bold text-slate-900 uppercase">Compass App</p>
                        </div>
                      </div>
                    </div>

                    {/* Machine Readable Zone (MRZ) */}
                    <div className="mt-auto pt-4 border-t border-slate-200">
                      <p className="font-mono text-[9px] md:text-[10px] text-slate-800 tracking-[0.1em] leading-relaxed font-bold opacity-80">
                        P&lt;ERTTRAVELER&lt;&lt;FOCUS&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;<br/>
                        A123456789ERT9001014U2401019&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;06
                      </p>
                    </div>
                  </>
                ) : (
                  // PAGE 3: STAMPS 1
                  <>
                    <div className="flex justify-between items-end border-b-2 border-slate-800 pb-1 mb-4">
                      <h2 className="text-lg font-bold text-slate-800 tracking-widest uppercase">Visas / Stamps</h2>
                      <span className="text-slate-500 font-mono text-xs">PAGE 3</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {stampsPage1.map((stamp, index) => (
                        <div key={index} className={`flex justify-center items-center ${stamp.angle} opacity-80 hover:opacity-100 transition-opacity`}>
                          <div className={`w-24 h-24 rounded-full border-[3px] ${stamp.color} flex flex-col items-center justify-center relative p-1`}>
                            <div className={`absolute inset-1 rounded-full border border-dashed ${stamp.color} opacity-50`}></div>
                            <span className="text-[8px] font-bold tracking-widest uppercase mb-0.5">{stamp.country}</span>
                            <span className="text-[11px] font-black tracking-wider uppercase text-center leading-tight mb-0.5">{stamp.city}</span>
                            <div className="flex items-center gap-1 mb-0.5">
                              <div className={`w-0.5 h-0.5 rounded-full bg-current`}></div>
                              <Plane className="w-3 h-3" />
                              <div className={`w-0.5 h-0.5 rounded-full bg-current`}></div>
                            </div>
                            <span className="text-[7px] font-bold font-mono">{stamp.date}</span>
                            <div className={`absolute -bottom-2 bg-[#fdfbf7] px-2 text-[8px] font-black uppercase tracking-widest ${stamp.color}`}>
                              {stamp.type}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
