import { AlertTriangle, ShoppingBag, X } from 'lucide-react';

interface VisaAlertModalProps {
  cityName: string;
  visaName: string;
  onClose: () => void;
  onGoToMarket: () => void;
}

export function VisaAlertModal({ cityName, visaName, onClose, onGoToMarket }: VisaAlertModalProps) {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#0a0f12]/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1a2327] border border-red-500/30 rounded-3xl w-full max-w-md p-6 shadow-[0_0_40px_rgba(239,68,68,0.15)] relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mt-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Visa Required!</h2>
          
          <p className="text-gray-300 mb-8 leading-relaxed">
            For going to <span className="font-bold text-white">{cityName}</span>, you should buy a <span className="font-bold text-teal-400">{visaName}</span> visa first.
          </p>

          <div className="flex gap-3 w-full">
            <button 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-semibold text-gray-300 bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            >
              Cancel
            </button>
            <button 
              onClick={onGoToMarket}
              className="flex-1 py-3 rounded-xl font-bold text-black bg-teal-500 hover:bg-teal-400 transition-colors shadow-[0_0_20px_rgba(45,212,191,0.3)] flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Go to Market
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
