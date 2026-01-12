import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// default marker icon in React/Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Function to parse DMS (Degrees Minutes Seconds) format 
// Example: "51°27'41.8"N 0°11'34.8"W" -> { lat: 51.461611, lng: -0.193000 }
const parseDMS = (dmsString) => {
  if (!dmsString || typeof dmsString !== 'string') return null;
  
  // Pattern to match DMS format: degrees°minutes'seconds"direction
  // Example: "51°27'41.8"N" or "0°11'34.8"W"
  const dmsPattern = /(\d+)°(\d+)'([\d.]+)"([NSEW])/gi;
  const matches = [...dmsString.matchAll(dmsPattern)];
  
  if (matches.length < 2) return null;
  
  let lat = null;
  let lng = null;
  
  for (const match of matches) {
    const degrees = parseFloat(match[1]);
    const minutes = parseFloat(match[2]);
    const seconds = parseFloat(match[3]);
    const direction = match[4].toUpperCase();
    
    // Convert DMS to decimal degrees
    const decimal = degrees + minutes / 60 + seconds / 3600;
    
    if (direction === 'N' || direction === 'S') {
      lat = direction === 'N' ? decimal : -decimal;
    } else if (direction === 'E' || direction === 'W') {
      lng = direction === 'E' ? decimal : -decimal;
    }
  }
  
  if (lat !== null && lng !== null) {
    return { lat, lng };
  }
  
  return null;
};

const LocationMap = ({ latitude, longitude, location, height = '288px' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    // Parse coordinates - handle different formats
    let lat = null;
    let lng = null;

    // If coordinates are provided as a single string (from Column P)
    if (latitude && typeof latitude === 'string') {
      const coordString = latitude.trim();
      
      // First, try DMS format (e.g., "51°27'41.8"N 0°11'34.8"W")
      const dmsResult = parseDMS(coordString);
      if (dmsResult) {
        lat = dmsResult.lat;
        lng = dmsResult.lng;
      }
      // Try decimal degrees formats like "51.123, -0.456" or "51.123,-0.456" or "51.123|-0.456"
      else if (coordString.includes(',')) {
        const coords = coordString.split(',').map(c => c.trim());
        if (coords.length >= 2) {
          lat = parseFloat(coords[0]);
          lng = parseFloat(coords[1]);
        }
      }
      // Try pipe-separated
      else if (coordString.includes('|')) {
        const coords = coordString.split('|').map(c => c.trim());
        if (coords.length >= 2) {
          lat = parseFloat(coords[0]);
          lng = parseFloat(coords[1]);
        }
      }
      // Try space-separated
      else if (coordString.includes(' ')) {
        const coords = coordString.split(/\s+/);
        if (coords.length >= 2) {
          lat = parseFloat(coords[0]);
          lng = parseFloat(coords[1]);
        }
      }
    } 
    // If separate lat/lng are provided
    else if (latitude && longitude) {
      lat = parseFloat(latitude);
      lng = parseFloat(longitude);
    }

    // Default to London if no valid coordinates
    const defaultLat = 51.5074;
    const defaultLng = -0.1278;

    if (!mapInstanceRef.current && mapRef.current) {
      // Initialize map
      const map = L.map(mapRef.current).setView(
        lat && lng && !isNaN(lat) && !isNaN(lng) ? [lat, lng] : [defaultLat, defaultLng],
        lat && lng && !isNaN(lat) && !isNaN(lng) ? 15 : 10
      );

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add marker if valid coordinates
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        const marker = L.marker([lat, lng]).addTo(map);
        markerRef.current = marker;

        // Add popup with location info
        if (location) {
          marker.bindPopup(`<b>${location}</b>`).openPopup();
        }
      }
    } else if (mapInstanceRef.current) {
      // Update map if coordinates change
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        mapInstanceRef.current.setView([lat, lng], 15);

        // Update or create marker
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng]).addTo(mapInstanceRef.current);
          markerRef.current = marker;
        }

        // Update popup
        if (location && markerRef.current) {
          markerRef.current.bindPopup(`<b>${location}</b>`).openPopup();
        }
      }
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [latitude, longitude, location]);

  return (
    <div
      ref={mapRef}
      style={{
        height: height,
        width: '100%',
        borderRadius: '0.5rem',
        zIndex: 0,
      }}
    />
  );
};

export default LocationMap;

