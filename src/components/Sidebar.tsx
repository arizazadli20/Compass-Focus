import { Compass, Map as MapIcon, BookOpen, ShoppingBag, Users, LogIn, History } from 'lucide-react';

export type TabName = 'Focus' | 'Map' | 'History' | 'Passport' | 'Market' | 'Network';

interface SidebarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navItems: { name: TabName; icon: any }[] = [
    { name: 'Focus', icon: Compass },
    { name: 'Map', icon: MapIcon },
    { name: 'History', icon: History },
    { name: 'Passport', icon: BookOpen },
    { name: 'Market', icon: ShoppingBag },
    { name: 'Network', icon: Users },
  ];

  return (
    <div className="w-20 lg:w-64 h-full bg-[#0a0f12]/90 backdrop-blur-xl border-r border-white/5 flex flex-col justify-between py-8 px-4 z-50 relative">
      <div className="flex flex-col gap-12">
        {/* Logo */}
        <div className="flex items-center justify-center lg:justify-start gap-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-[0_0_20px_rgba(45,212,191,0.3)]">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <span className="hidden lg:block text-xl font-bold tracking-widest text-white">COMPASS</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-4">
          {navItems.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => onTabChange(item.name)}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-white/10 border border-white/20 text-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.15)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? 'text-teal-400' : ''}`} />
                <span className="hidden lg:block font-medium tracking-wide">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Action */}
      <button className="flex items-center gap-4 px-4 py-3 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
        <LogIn className="w-6 h-6" />
        <span className="hidden lg:block font-medium tracking-wide">Login</span>
      </button>
    </div>
  );
}
