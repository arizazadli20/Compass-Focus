import { ShoppingBag, Coins, Shield, Check, Lock, Globe } from 'lucide-react';

interface MarketPanelProps {
  balance: number;
  owned: string[];
  onBuy: (id: string, price: number) => void;
}

export function MarketPanel({ balance, owned, onBuy }: MarketPanelProps) {
  const visas = [
    { id: 'Schengen', name: 'Schengen Area', desc: 'Access to 27 European countries. Perfect for backpacking across the continent.', price: 500, color: 'from-blue-500 to-indigo-600' },
    { id: 'JPN', name: 'Japan', desc: 'Unlimited travel to all prefectures. Valid for 5 years.', price: 300, color: 'from-red-500 to-rose-600' },
    { id: 'USA', name: 'United States', desc: 'Full access to all 50 states. Includes fast-track entry.', price: 400, color: 'from-blue-600 to-red-600' },
    { id: 'AUS', name: 'Australia', desc: 'Explore the land down under. Valid for working holidays.', price: 350, color: 'from-emerald-500 to-teal-600' },
    { id: 'MARS', name: 'Mars Colony', desc: 'Premium interplanetary visa. One-way ticket eligible.', price: 5000, color: 'from-orange-500 to-red-600' },
    { id: 'GLOBAL', name: 'Global Citizen', desc: 'Universal access to all Earth nations. No borders.', price: 10000, color: 'from-purple-500 to-fuchsia-600' },
  ];

  return (
    <div className="absolute inset-0 z-30 bg-[#0a0f12]/95 backdrop-blur-2xl overflow-y-auto p-8 lg:p-12 animate-in fade-in duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-teal-400" />
              Visa Marketplace
            </h1>
            <p className="text-gray-400">Exchange your Focus Miles for international travel visas.</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 min-w-[200px] shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <Coins className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Focus Miles</p>
              <p className="text-2xl font-bold text-white">{balance.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visas.map(visa => {
            const isOwned = owned.includes(visa.id);
            const canAfford = balance >= visa.price;

            return (
              <div key={visa.id} className="relative group bg-white/5 border border-white/10 rounded-3xl p-1 overflow-hidden hover:bg-white/10 transition-all duration-500 shadow-lg">
                {/* Hover Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${visa.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                
                <div className="bg-[#0a0f12]/90 backdrop-blur-xl rounded-[22px] p-6 h-full flex flex-col relative z-10 border border-white/5">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${visa.color} p-0.5 shadow-lg`}>
                      <div className="w-full h-full bg-[#0a0f12] rounded-[14px] flex items-center justify-center">
                        {visa.id === 'GLOBAL' ? (
                          <Globe className="w-6 h-6 text-white/80" />
                        ) : (
                          <Shield className="w-6 h-6 text-white/80" />
                        )}
                      </div>
                    </div>
                    {isOwned ? (
                      <span className="bg-teal-500/20 text-teal-400 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-teal-500/20">
                        <Check className="w-3 h-3" /> ACQUIRED
                      </span>
                    ) : (
                      <span className="bg-white/10 text-white/60 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                        <Lock className="w-3 h-3" /> LOCKED
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{visa.name}</h3>
                  <p className="text-sm text-gray-400 mb-8 flex-1 leading-relaxed">{visa.desc}</p>

                  <button 
                    onClick={() => onBuy(visa.id, visa.price)}
                    disabled={isOwned || !canAfford}
                    className={`w-full py-3.5 rounded-xl font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                      isOwned 
                        ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                        : canAfford 
                          ? 'bg-teal-500 hover:bg-teal-400 text-black shadow-[0_0_20px_rgba(45,212,191,0.3)] hover:shadow-[0_0_25px_rgba(45,212,191,0.5)]'
                          : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {isOwned ? 'Owned' : (
                      <>
                        Buy for {visa.price.toLocaleString()} <Coins className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
