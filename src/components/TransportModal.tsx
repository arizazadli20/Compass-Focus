import { Plane, Car, Footprints, X } from 'lucide-react';

export type TransportMode = 'plane' | 'car' | 'foot';

interface TransportModalProps {
  onSelect: (mode: TransportMode) => void;
  onCancel: () => void;
}

export function TransportModal({ onSelect, onCancel }: TransportModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a0f12] border border-white/10 rounded-3xl p-6 w-[400px] shadow-[0_8px_32px_rgba(0,0,0,0.8)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Select Transportation</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <button 
            onClick={() => onSelect('plane')} 
            className="flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-colors">
              <Plane className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">Plane</p>
              <p className="text-sm text-gray-400">~900 km/h</p>
            </div>
          </button>
          
          <button 
            onClick={() => onSelect('car')} 
            className="flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Car className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">Car</p>
              <p className="text-sm text-gray-400">~100 km/h</p>
            </div>
          </button>
          
          <button 
            onClick={() => onSelect('foot')} 
            className="flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:bg-white/5 transition-colors group"
          >
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Footprints className="w-6 h-6" />
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">Walking</p>
              <p className="text-sm text-gray-400">~5 km/h</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
