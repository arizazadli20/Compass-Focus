import { useState, useEffect } from 'react';
import { Sidebar, TabName } from './components/Sidebar';
import { MapCanvas } from './components/MapCanvas';
import { FloatingWidgets } from './components/FloatingWidgets';
import { useFlightTimer } from './hooks/useFlightTimer';
import { LocationData } from './components/CitySearchInput';
import { TransportModal, TransportMode } from './components/TransportModal';
import { TicketModal } from './components/TicketModal';
import { PassportPanel } from './components/PassportPanel';
import { MarketPanel } from './components/MarketPanel';
import { TravelHistoryPanel, TravelHistoryItem } from './components/TravelHistoryPanel';
import { VisaAlertModal } from './components/VisaAlertModal';

const DEFAULT_START = { lat: 51.5074, lng: -0.1278 }; // London

// Map ISO country codes to Visa IDs and Names
const VISA_REQUIREMENTS: Record<string, { id: string, name: string }> = {
  'US': { id: 'USA', name: 'United States' },
  'JP': { id: 'JPN', name: 'Japan' },
  'AU': { id: 'AUS', name: 'Australia' },
  // Schengen Area
  'FR': { id: 'Schengen', name: 'Schengen Area' }, 
  'DE': { id: 'Schengen', name: 'Schengen Area' }, 
  'IT': { id: 'Schengen', name: 'Schengen Area' }, 
  'ES': { id: 'Schengen', name: 'Schengen Area' }, 
  'NL': { id: 'Schengen', name: 'Schengen Area' }, 
  'BE': { id: 'Schengen', name: 'Schengen Area' }, 
  'AT': { id: 'Schengen', name: 'Schengen Area' }, 
  'GR': { id: 'Schengen', name: 'Schengen Area' }, 
  'PT': { id: 'Schengen', name: 'Schengen Area' }, 
  'SE': { id: 'Schengen', name: 'Schengen Area' }, 
  'FI': { id: 'Schengen', name: 'Schengen Area' }, 
  'DK': { id: 'Schengen', name: 'Schengen Area' }, 
  'PL': { id: 'Schengen', name: 'Schengen Area' }, 
  'CZ': { id: 'Schengen', name: 'Schengen Area' }, 
  'HU': { id: 'Schengen', name: 'Schengen Area' }, 
  'SK': { id: 'Schengen', name: 'Schengen Area' }, 
  'SI': { id: 'Schengen', name: 'Schengen Area' }, 
  'EE': { id: 'Schengen', name: 'Schengen Area' }, 
  'LV': { id: 'Schengen', name: 'Schengen Area' }, 
  'LT': { id: 'Schengen', name: 'Schengen Area' }, 
  'MT': { id: 'Schengen', name: 'Schengen Area' }, 
  'LU': { id: 'Schengen', name: 'Schengen Area' }, 
  'HR': { id: 'Schengen', name: 'Schengen Area' }, 
  'IS': { id: 'Schengen', name: 'Schengen Area' }, 
  'LI': { id: 'Schengen', name: 'Schengen Area' }, 
  'NO': { id: 'Schengen', name: 'Schengen Area' }, 
  'CH': { id: 'Schengen', name: 'Schengen Area' },
};

// Simple distance calculation (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI /  180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('Focus');
  
  const [hasStarted, setHasStarted] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  const [startLocationName, setStartLocationName] = useState('');
  const [endLocationName, setEndLocationName] = useState('');
  
  const [startCoords, setStartCoords] = useState(DEFAULT_START);
  const [endCoords, setEndCoords] = useState(DEFAULT_START);
  
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalDuration, setTotalDuration] = useState(25 * 60);
  
  const [transportMode, setTransportMode] = useState<TransportMode>('plane');
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Global State
  const [focusMiles, setFocusMiles] = useState(2500);
  const [ownedVisas, setOwnedVisas] = useState<string[]>(['Schengen']); // Start with only Schengen
  const [travelHistory, setTravelHistory] = useState<TravelHistoryItem[]>([
    { city: 'Tokyo', country: 'Japan', date: '2023-10-15', duration: '25m', type: 'plane' },
    { city: 'Paris', country: 'France', date: '2023-11-02', duration: '50m', type: 'car' },
    { city: 'New York', country: 'USA', date: '2023-12-10', duration: '1h 30m', type: 'plane' },
  ]);

  // Visa Alert State
  const [visaAlert, setVisaAlert] = useState<{ show: boolean, cityName: string, visaName: string }>({
    show: false,
    cityName: '',
    visaName: ''
  });

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setStartCoords({ lat: latitude, lng: longitude });
          setStartLocationName('Current Location');
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  // Earn Focus Miles while active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive) {
      interval = setInterval(() => {
        setFocusMiles(prev => prev + 1);
      }, 1000); // Earn 1 mile per second of focus
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const {
    formattedTime,
    distanceRemaining,
    currentCoords,
  } = useFlightTimer(
    startCoords,
    endCoords,
    totalDuration,
    totalDistance,
    isActive
  );

  const handleStartLocationChange = (name: string, data?: LocationData) => {
    setStartLocationName(name);
    if (data) {
      setStartCoords({ lat: data.lat, lng: data.lng });
    }
  };

  const handleEndLocationChange = (name: string, data?: LocationData) => {
    if (data) {
      const countryCode = data.countryCode.toUpperCase();
      const requiredVisa = VISA_REQUIREMENTS[countryCode];
      
      if (requiredVisa && !ownedVisas.includes(requiredVisa.id) && !ownedVisas.includes('GLOBAL')) {
        setVisaAlert({
          show: true,
          cityName: name,
          visaName: requiredVisa.name
        });
        setEndLocationName(''); // Reset the input
        return;
      }

      setEndLocationName(name);
      setEndCoords({ lat: data.lat, lng: data.lng });
    } else {
      setEndLocationName(name);
    }
  };

  const handlePrepareTrip = () => {
    setShowTransportModal(true);
  };

  const handleSelectTransport = (mode: TransportMode) => {
    setTransportMode(mode);
    setShowTransportModal(false);

    const dist = calculateDistance(startCoords.lat, startCoords.lng, endCoords.lat, endCoords.lng);
    setTotalDistance(dist);

    let speed = 900; // km/h
    if (mode === 'car') speed = 100;
    if (mode === 'foot') speed = 5;

    const durationHours = dist / speed;
    const durationSeconds = Math.max(60, Math.floor(durationHours * 3600)); // Minimum 1 minute
    setTotalDuration(durationSeconds);

    if (mode === 'plane') {
      setShowTicketModal(true);
    } else {
      startActualTrip();
    }
  };

  const startActualTrip = () => {
    setShowTicketModal(false);
    setHasStarted(true);
    setIsActive(true);
  };

  const handlePause = () => setIsActive(!isActive);
  
  const handleEndTrip = () => {
    // Add to travel history
    const parts = endLocationName.split(',');
    const city = parts[0] || 'Unknown City';
    const country = parts.length > 1 ? parts[parts.length - 1].trim() : 'Unknown Country';
    
    const newTrip: TravelHistoryItem = {
      city,
      country,
      date: new Date().toISOString().split('T')[0],
      duration: Math.floor(totalDuration / 60) + 'm',
      type: transportMode
    };

    setTravelHistory(prev => [newTrip, ...prev]);
    
    setHasStarted(false);
    setIsActive(false);
    setEndLocationName('');
    setTotalDistance(0);
    // Use a custom toast or modal in a real app, but for now we'll keep this simple alert
    // since it happens after a long session
    alert(`Trip Ended! You earned Focus Miles and arrived in ${city}.`);
  };

  const handleBuyVisa = (id: string, price: number) => {
    if (ownedVisas.includes(id)) return;
    if (focusMiles >= price) {
      setFocusMiles(prev => prev - price);
      setOwnedVisas(prev => [...prev, id]);
    } else {
      alert('Not enough Focus Miles!');
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0f12] overflow-hidden font-sans text-white">
      {/* Sidebar (Left Navigation) */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 relative h-full">
        {/* Map Canvas (Background) */}
        <MapCanvas
          currentCoords={hasStarted ? currentCoords : startCoords}
          startCoords={startCoords}
          endCoords={hasStarted ? endCoords : startCoords}
          transportMode={transportMode}
        />

        {/* Floating Widgets (Overlay) - Show when Focus or Map tab is active */}
        {(activeTab === 'Focus' || activeTab === 'Map') && (
          <FloatingWidgets
            formattedTime={formattedTime}
            distanceRemaining={distanceRemaining}
            onPause={handlePause}
            onEndTrip={handleEndTrip}
            isActive={isActive}
            startLocation={startLocationName}
            setStartLocation={handleStartLocationChange}
            endLocation={endLocationName}
            setEndLocation={handleEndLocationChange}
            onStartTrip={handlePrepareTrip}
            hasStarted={hasStarted}
            focusMiles={focusMiles}
          />
        )}

        {/* History Panel */}
        {activeTab === 'History' && <TravelHistoryPanel history={travelHistory} />}
        
        {/* Passport Panel */}
        {activeTab === 'Passport' && (
          <PassportPanel 
            ownedVisas={ownedVisas} 
            travelHistory={travelHistory} 
          />
        )}

        {/* Market Panel */}
        {activeTab === 'Market' && (
          <MarketPanel 
            balance={focusMiles} 
            owned={ownedVisas} 
            onBuy={handleBuyVisa} 
          />
        )}
        
        {/* Modals */}
        {showTransportModal && (
          <TransportModal 
            onSelect={handleSelectTransport} 
            onCancel={() => setShowTransportModal(false)} 
          />
        )}
        
        {showTicketModal && (
          <TicketModal
            startLocation={startLocationName}
            endLocation={endLocationName}
            distance={totalDistance}
            durationSeconds={totalDuration}
            onConfirm={startActualTrip}
            onCancel={() => setShowTicketModal(false)}
          />
        )}

        {visaAlert.show && (
          <VisaAlertModal
            cityName={visaAlert.cityName}
            visaName={visaAlert.visaName}
            onClose={() => setVisaAlert({ ...visaAlert, show: false })}
            onGoToMarket={() => {
              setVisaAlert({ ...visaAlert, show: false });
              setActiveTab('Market');
            }}
          />
        )}
      </main>
    </div>
  );
}
