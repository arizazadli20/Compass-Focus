import { Pause, Volume2, Phone, Share2, Layers, Search, X, Play, Coins } from 'lucide-react';
import { CitySearchInput, LocationData } from './CitySearchInput';

interface FloatingWidgetsProps {
  formattedTime: string;
  distanceRemaining: string;
  onEndTrip: () => void;
  onPause: () => void;
  isActive: boolean;
  startLocation: string;
  setStartLocation: (loc: string, data?: LocationData) => void;
  endLocation: string;
  setEndLocation: (loc: string, data?: LocationData) => void;
  onStartTrip: () => void;
  hasStarted: boolean;
  focusMiles: number;
}

export function FloatingWidgets({
  formattedTime,
  distanceRemaining,
  onEndTrip,
  onPause,
  isActive,
  startLocation,
  setStartLocation,
  endLocation,
  setEndLocation,
  onStartTrip,
  hasStarted,
  focusMiles,
}: FloatingWidgetsProps) {
  return (
    <>
      {/* Top Left: Controls & Coins */}
      <div className="absolute top-8 left-8 z-40 flex gap-4 items-center">
        {hasStarted && (
          <>
            <button
              onClick={onPause}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            >
              {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
              <Volume2 className="w-5 h-5" />
            </button>
          </>
        )}
        
        {/* Focus Miles Display */}
        <div className="h-12 px-5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <Coins className="w-5 h-5 text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" />
          <span className="font-mono font-bold text-lg tracking-wide text-white">
            {focusMiles.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Right Side: Actions & Search */}
      <div className="absolute top-8 right-8 z-40 flex flex-col gap-6 items-end">
        {/* FABs */}
        <div className="flex flex-col gap-4">
          <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <Phone className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
            <Layers className="w-5 h-5" />
          </button>
        </div>

        {/* Search Panel */}
        <div className="w-80 bg-[#0a0f12]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.8)] flex flex-col gap-4">
          <div className="relative z-20">
            <CitySearchInput
              placeholder="Current Location"
              value={startLocation}
              onChange={setStartLocation}
              disabled={hasStarted}
            />
          </div>
          
          <div className="relative z-10">
            <CitySearchInput
              placeholder="Where to? Tap to search destination"
              value={endLocation}
              onChange={setEndLocation}
              disabled={hasStarted}
            />
          </div>

          {!hasStarted ? (
            <button
              onClick={onStartTrip}
              disabled={!startLocation || !endLocation}
              className="w-full mt-2 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-400 font-semibold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(45,212,191,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              Start Trip
            </button>
          ) : (
            <button
              onClick={onEndTrip}
              className="w-full mt-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 font-semibold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              End Trip
            </button>
          )}
        </div>
      </div>

      {/* Bottom Left: Timer */}
      {hasStarted && (
        <div className="absolute bottom-8 left-8 z-40">
          <div className="bg-[#0a0f12]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
            <p className="text-gray-400 text-sm font-medium tracking-widest uppercase mb-1">Time Remaining</p>
            <h1 className="text-6xl lg:text-8xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              {formattedTime}
            </h1>
          </div>
        </div>
      )}

      {/* Bottom Right: Distance */}
      {hasStarted && (
        <div className="absolute bottom-8 right-8 z-40">
          <div className="bg-[#0a0f12]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.8)] text-right">
            <p className="text-gray-400 text-sm font-medium tracking-widest uppercase mb-1">Distance Remaining</p>
            <h2 className="text-4xl lg:text-5xl font-mono font-bold text-teal-400 drop-shadow-[0_0_15px_rgba(45,212,191,0.3)]">
              {distanceRemaining} <span className="text-2xl text-teal-400/50">km</span>
            </h2>
          </div>
        </div>
      )}
    </>
  );
}
