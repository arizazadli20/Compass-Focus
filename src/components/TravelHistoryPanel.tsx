import { MapPin, Calendar, Clock, Plane, Car, Footprints, History } from 'lucide-react';

export interface TravelHistoryItem {
  city: string;
  country: string;
  date: string;
  duration: string;
  type: 'plane' | 'car' | 'foot';
}

interface TravelHistoryPanelProps {
  history: TravelHistoryItem[];
}

export function TravelHistoryPanel({ history }: TravelHistoryPanelProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'plane': return <Plane className="w-5 h-5" />;
      case 'car': return <Car className="w-5 h-5" />;
      case 'foot': return <Footprints className="w-5 h-5" />;
      default: return <Plane className="w-5 h-5" />;
    }
  };

  return (
    <div className="absolute inset-0 z-30 bg-[#0a0f12]/95 backdrop-blur-2xl overflow-y-auto p-8 lg:p-12 animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-1">Travel History</h1>
            <p className="text-gray-400">A complete log of your past focus journeys.</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="text-center text-gray-500 mt-20 bg-white/5 border border-white/10 rounded-3xl p-12">
            <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-medium text-white mb-2">No travels yet</p>
            <p>Start a focus session to begin your journey around the world!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.map((trip, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors flex items-center gap-6 shadow-lg">
                <div className="w-14 h-14 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 flex-shrink-0">
                  {getIcon(trip.type)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">{trip.city}</h3>
                  <p className="text-sm text-gray-400 mb-3">{trip.country}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {trip.date}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {trip.duration}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
