import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinates } from '../hooks/useFlightTimer';
import { TransportMode } from './TransportModal';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const airplaneSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 5-3 3-3-1-2 2 5 5 2-2-1-3 3-3 5 6 1.2-.7c.4-.2.7-.6.6-1.1z"/></svg>`;
const carSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;
const footSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/></svg>`;

// Custom Icons
const airplaneIcon = new L.DivIcon({
  html: `<div class="drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] airplane-icon">${airplaneSvg}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
  className: 'custom-airplane-icon',
});

const carIcon = new L.DivIcon({
  html: `<div class="drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">${carSvg}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
  className: 'custom-car-icon',
});

const footIcon = new L.DivIcon({
  html: `<div class="drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">${footSvg}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
  className: 'custom-foot-icon',
});

const destinationSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

// Custom Destination Icon
const destinationIcon = new L.DivIcon({
  html: `<div class="drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">${destinationSvg}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
  className: 'custom-destination-icon',
});

interface MapCanvasProps {
  currentCoords: Coordinates;
  startCoords: Coordinates;
  endCoords: Coordinates;
  transportMode: TransportMode;
}

export function MapCanvas({ currentCoords, startCoords, endCoords, transportMode }: MapCanvasProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const currentIcon = transportMode === 'car' ? carIcon : transportMode === 'foot' ? footIcon : airplaneIcon;

  return (
    <div className="absolute inset-0 w-full h-full z-0 bg-[#0a0f12]">
      <MapContainer
        center={[currentCoords.lat, currentCoords.lng]}
        zoom={4}
        zoomControl={false}
        className="w-full h-full"
        style={{ width: '100%', height: '100%', background: '#0a0f12' }}
        maxBounds={[
          [-90, -180],
          [90, 180],
        ]}
        maxBoundsViscosity={1.0}
        minZoom={3}
      >
        {/* Dark Matter Tile Layer from CartoDB */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          noWrap={true}
        />

        {/* Flight Path */}
        <Polyline
          positions={[
            [startCoords.lat, startCoords.lng],
            [endCoords.lat, endCoords.lng],
          ]}
          color="#2dd4bf"
          weight={2}
          dashArray="10, 10"
          opacity={0.5}
        />

        {/* Moving Marker */}
        <Marker position={[currentCoords.lat, currentCoords.lng]} icon={currentIcon}>
          <Popup className="custom-popup">
            <div className="text-gray-900 font-bold">Trip in Progress</div>
          </Popup>
        </Marker>

        {/* Destination Marker */}
        <Marker position={[endCoords.lat, endCoords.lng]} icon={destinationIcon}>
          <Popup>Destination</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
