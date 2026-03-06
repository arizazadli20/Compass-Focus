import { Plane } from 'lucide-react';

interface TicketModalProps {
  startLocation: string;
  endLocation: string;
  distance: number;
  durationSeconds: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TicketModal({
  startLocation,
  endLocation,
  distance,
  durationSeconds,
  onConfirm,
  onCancel,
}: TicketModalProps) {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const timeString = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white text-black rounded-2xl w-[400px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Ticket Header */}
        <div className="bg-teal-500 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-widest uppercase">Boarding Pass</h2>
          <Plane className="w-8 h-8 opacity-50" />
        </div>
        
        {/* Ticket Body */}
        <div className="p-6 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">From</p>
              <p className="text-xl font-bold truncate pr-2">{startLocation || 'Current'}</p>
            </div>
            <Plane className="w-6 h-6 text-teal-500 mx-2 flex-shrink-0" />
            <div className="flex-1 text-right">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">To</p>
              <p className="text-xl font-bold truncate pl-2">{endLocation}</p>
            </div>
          </div>
          
          <div className="flex justify-between border-t border-dashed border-gray-300 pt-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Flight Time</p>
              <p className="font-bold text-lg">{timeString}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Distance</p>
              <p className="font-bold text-lg">{Math.round(distance).toLocaleString()} km</p>
            </div>
          </div>
          
          {/* Barcode mock */}
          <div className="h-12 w-full bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_4px,#000_4px,#000_5px,transparent_5px,transparent_8px)] opacity-60 mt-2"></div>
        </div>
        
        {/* Actions */}
        <div className="p-4 bg-gray-50 flex gap-4 border-t border-gray-200">
          <button 
            onClick={onCancel} 
            className="flex-1 py-3 text-gray-600 font-semibold hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 py-3 bg-teal-500 text-white font-semibold hover:bg-teal-600 rounded-xl transition-colors shadow-lg shadow-teal-500/30"
          >
            Board Flight
          </button>
        </div>
      </div>
    </div>
  );
}
