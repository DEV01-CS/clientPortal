import { useEffect, useRef, useState } from 'react';
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

// Function to geocode postcode using Nominatim (OpenStreetMap)
const geocodePostcode = async (postcode) => {
  if (!postcode) return null;
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(postcode)}&limit=1`,
      {
        headers: {
          'User-Agent': 'ClientPortal/1.0'
        }
      }
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Geocoding error:', error);
    }
  }
  return null;
};

const LocationMap = ({ latitude, longitude, location, postcode, height = '288px' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const [coordinates, setCoordinates] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Geocode postcode if coordinates not available
  useEffect(() => {
    const getCoordinates = async () => {
      let lat = null;
      let lng = null;

      // First, try to parse provided coordinates
      if (latitude && typeof latitude === 'string') {
        const coordString = latitude.trim();
        
        // Try DMS format
        const dmsResult = parseDMS(coordString);
        if (dmsResult) {
          lat = dmsResult.lat;
          lng = dmsResult.lng;
        }
        // Try decimal degrees formats
        else if (coordString.includes(',')) {
          const coords = coordString.split(',').map(c => c.trim());
          if (coords.length >= 2) {
            lat = parseFloat(coords[0]);
            lng = parseFloat(coords[1]);
          }
        }
        else if (coordString.includes('|')) {
          const coords = coordString.split('|').map(c => c.trim());
          if (coords.length >= 2) {
            lat = parseFloat(coords[0]);
            lng = parseFloat(coords[1]);
          }
        }
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

      // If we have valid coordinates, use them
      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        setCoordinates({ lat, lng });
        return;
      }

      // Otherwise, try to geocode the postcode
      if (postcode) {
        setIsGeocoding(true);
        const geocoded = await geocodePostcode(postcode);
        if (geocoded) {
          setCoordinates(geocoded);
        } else {
          // Fallback: try geocoding the full location string
          if (location) {
            const geocodedLocation = await geocodePostcode(location);
            if (geocodedLocation) {
              setCoordinates(geocodedLocation);
            }
          }
        }
        setIsGeocoding(false);
      }
    };

    getCoordinates();
  }, [latitude, longitude, postcode, location]);

  useEffect(() => {
    // Default to London if no valid coordinates
    const defaultLat = 51.5074;
    const defaultLng = -0.1278;
    
    const lat = coordinates?.lat;
    const lng = coordinates?.lng;
    const hasValidCoords = lat && lng && !isNaN(lat) && !isNaN(lng);

    if (!mapInstanceRef.current && mapRef.current) {
      // Initialize map
      const map = L.map(mapRef.current).setView(
        hasValidCoords ? [lat, lng] : [defaultLat, defaultLng],
        hasValidCoords ? 15 : 10
      );

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add marker and circle if valid coordinates
      if (hasValidCoords) {
        // Add marker with custom styling
        const marker = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: icon,
            shadowUrl: iconShadow,
            iconSize: [20, 28],
            iconAnchor: [16, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }).addTo(map);
        markerRef.current = marker;


        // Add popup with location info
        if (location || postcode) {
          marker.bindPopup(`<b>${location || postcode}</b>`).openPopup();
        }
      }
    } else if (mapInstanceRef.current) {
      // Update map if coordinates change
      if (hasValidCoords) {
        mapInstanceRef.current.setView([lat, lng], 15);

        // Update or create marker
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], {
            icon: L.icon({
              iconUrl: icon,
              shadowUrl: iconShadow,
              iconSize: [32, 41],
              iconAnchor: [16, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })
          }).addTo(mapInstanceRef.current);
          markerRef.current = marker;
        }

        // Update or create circle
        if (circleRef.current) {
          circleRef.current.setLatLng([lat, lng]);
        } else {
          const circle = L.circle([lat, lng], {
            color: '#14B8A6',
            fillColor: '#14B8A6',
            fillOpacity: 0.2,
            radius: 200
          }).addTo(mapInstanceRef.current);
          circleRef.current = circle;
        }

        // Update popup
        if ((location || postcode) && markerRef.current) {
          markerRef.current.bindPopup(`<b>${location || postcode}</b>`).openPopup();
        }
      }
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
  }, [coordinates, location, postcode]);

  return (
    <div style={{ position: 'relative', width: '100%', height: height }}>
      <div
        ref={mapRef}
        style={{
          height: height,
          width: '100%',
          borderRadius: '0.5rem',
          zIndex: 0,
        }}
      />
      {isGeocoding && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '8px 16px',
            borderRadius: '4px',
            zIndex: 1000,
            fontSize: '14px',
            color: '#666',
          }}
        >
          Locating...
        </div>
      )}
    </div>
  );
};

export default LocationMap;

