import { useEffect, useRef, useState } from "react";
import { Venue } from "../types";
import { Users } from "lucide-react";

interface MapViewProps {
  venues: Venue[];
  onVenueClick: (venueId: string) => void;
}

export function MapView({ venues, onVenueClick }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initMap = async () => {
      if (!mapRef.current) return;
      
      // Load Leaflet CSS first
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
        
        // Wait for CSS to load
        await new Promise(resolve => {
          link.onload = resolve;
          setTimeout(resolve, 1000); // Fallback timeout
        });
      }

      // Import Leaflet
      const L = (await import("leaflet")).default;

      if (!mounted || !mapRef.current) return;

      // Initialize map
      const map = L.map(mapRef.current, {
        center: [37.7749, -122.4194],
        zoom: 13,
      });

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;

      // Wait for map to be ready
      map.whenReady(() => {
        if (mounted) {
          setIsReady(true);
        }
      });
    };

    initMap();

    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady || !mapInstanceRef.current || !venues.length) return;

    const loadMarkers = async () => {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      // Clear existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Add venue markers
      venues.forEach((venue) => {
        const iconColor = 
          venue.type === "cafe" ? "#8B4513" :
          venue.type === "bar" ? "#FF6B35" :
          venue.type === "nightclub" ? "#9B59B6" :
          "#E74C3C";

        const icon = L.divIcon({
          className: "custom-marker",
          html: `
            <div style="position: relative;">
              <div style="
                background: ${iconColor};
                width: 40px;
                height: 40px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ">
                <span style="transform: rotate(45deg);">
                  ${venue.checkInCount}
                </span>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40],
        });

        const popup = L.popup({
          maxWidth: 300,
          className: "venue-popup",
        });

        const popupContent = `
          <div style="
            padding: 12px;
            background: white;
            border-radius: 8px;
          ">
            <div style="font-weight: 600; margin-bottom: 4px;">${venue.name}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${venue.address}</div>
            <div style="
              display: flex;
              align-items: center;
              gap: 4px;
              margin-bottom: 8px;
              font-size: 12px;
            ">
              <span style="
                background: ${iconColor};
                color: white;
                padding: 2px 8px;
                border-radius: 4px;
              ">${venue.type}</span>
              <span>${venue.checkInCount} people checked in</span>
            </div>
            <button onclick="handleVenueClick('${venue.id}')" style="
              width: 100%;
              background: ${iconColor};
              color: white;
              border: none;
              padding: 8px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              font-size: 14px;
            ">
              View People
            </button>
          </div>
        `;

        popup.setContent(popupContent);
        const marker = L.marker([venue.coordinates.lat, venue.coordinates.lng], { icon });
        marker.bindPopup(popup);
        marker.addTo(map);
        markersRef.current.push(marker);
      });

      // Add global handler for venue clicks
      (window as any).handleVenueClick = (venueId: string) => {
        // Call the parent component's handler immediately
        onVenueClick(venueId);
      };
    };

    loadMarkers();
  }, [isReady, venues, onVenueClick]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-lg overflow-hidden" style={{ zIndex: 0 }} />
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-background border rounded-lg shadow-lg p-4 space-y-2 z-[40]">
        <h4 className="font-medium text-sm mb-2">Venue Types</h4>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ background: "#8B4513" }} />
          <span className="text-sm">Cafe</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ background: "#FF6B35" }} />
          <span className="text-sm">Bar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ background: "#9B59B6" }} />
          <span className="text-sm">Nightclub</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ background: "#E74C3C" }} />
          <span className="text-sm">Restaurant</span>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 left-4 bg-background border rounded-lg shadow-lg p-4 z-[40]">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">{venues.reduce((acc, v) => acc + v.checkInCount, 0)} people</p>
            <p className="text-xs text-muted-foreground">checked in nearby</p>
          </div>
        </div>
      </div>
    </div>
  );
}
