import { useState, useEffect } from 'react';

export interface Coordinates {
  lat: number;
  lng: number;
}

export function useFlightTimer(
  startCoords: Coordinates,
  endCoords: Coordinates,
  totalDurationSeconds: number,
  totalDistanceKm: number,
  isActive: boolean
) {
  const [timeRemaining, setTimeRemaining] = useState(totalDurationSeconds);
  const [currentCoords, setCurrentCoords] = useState<Coordinates>(startCoords);

  useEffect(() => {
    setTimeRemaining(totalDurationSeconds);
    setCurrentCoords(startCoords);
  }, [startCoords, endCoords, totalDurationSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          
          // Calculate progress (0 to 1)
          const progress = 1 - (newTime / totalDurationSeconds);
          
          // Interpolate coordinates (simple linear interpolation for now)
          // For a real globe, you'd use spherical linear interpolation (Slerp) or turf.js along a great circle
          const newLat = startCoords.lat + (endCoords.lat - startCoords.lat) * progress;
          const newLng = startCoords.lng + (endCoords.lng - startCoords.lng) * progress;
          
          setCurrentCoords({ lat: newLat, lng: newLng });
          
          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeRemaining, startCoords, endCoords, totalDurationSeconds]);

  const distanceRemaining = (timeRemaining / totalDurationSeconds) * totalDistanceKm;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    if (h > 0) {
      return `${h}:${m}:${s}`;
    }
    return `${m}:${s}`;
  };

  return {
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    distanceRemaining: distanceRemaining.toFixed(1),
    currentCoords,
    progress: 1 - (timeRemaining / totalDurationSeconds)
  };
}
