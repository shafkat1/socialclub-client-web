import { useEffect, useState, useCallback, useRef } from "react";
import { Venue, CheckIn } from "../types";
import { toast } from "sonner@2.0.3";

interface GeofenceManagerProps {
  venues: Venue[];
  currentCheckIn: CheckIn | null;
  onCheckInDetected: (venue: Venue) => void;
  onCheckOutDetected: () => void;
  enabled: boolean;
}

const GEOFENCE_RADIUS_METERS = 100; // Adjustable between 100-500 meters
const POSITION_UPDATE_INTERVAL = 10000; // Check every 10 seconds
const DISTANCE_THRESHOLD_BUFFER = 20; // 20 meter buffer to prevent flickering
const FALLBACK_POSITION_INTERVAL = 30000; // Fallback check every 30 seconds if watchPosition fails

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function GeofenceManager({
  venues,
  currentCheckIn,
  onCheckInDetected,
  onCheckOutDetected,
  enabled,
}: GeofenceManagerProps) {
  const [userPosition, setUserPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [lastNotifiedVenue, setLastNotifiedVenue] = useState<string | null>(null);
  const [useWatchPosition, setUseWatchPosition] = useState(true);
  const fallbackIntervalRef = useRef<number | null>(null);
  const hasShownPermissionError = useRef(false);
  const [geolocationBlocked, setGeolocationBlocked] = useState(false);

  // Check if user is within geofence of any venue
  const checkGeofences = useCallback(
    (position: { lat: number; lng: number }) => {
      if (!enabled || venues.length === 0) {
        return;
      }

      // Find closest venue within geofence
      let closestVenue: Venue | null = null;
      let closestDistance = Infinity;

      venues.forEach((venue) => {
        const distance = calculateDistance(
          position.lat,
          position.lng,
          venue.coordinates.lat,
          venue.coordinates.lng
        );

        if (distance < GEOFENCE_RADIUS_METERS && distance < closestDistance) {
          closestVenue = venue;
          closestDistance = distance;
        }
      });

      // Handle check-in/check-out logic
      if (closestVenue) {
        // User is within a geofence
        if (!currentCheckIn || currentCheckIn.venue.id !== closestVenue.id) {
          // Not checked in or checked in to a different venue
          if (lastNotifiedVenue !== closestVenue.id) {
            console.log(
              `✅ Automatic check-in detected: ${closestVenue.name} (${Math.round(closestDistance)}m away)`
            );
            setLastNotifiedVenue(closestVenue.id);
            onCheckInDetected(closestVenue);
          }
        }
      } else {
        // User is not within any geofence
        if (currentCheckIn) {
          // User was checked in but has left the geofence
          const distanceFromCheckIn = calculateDistance(
            position.lat,
            position.lng,
            currentCheckIn.venue.coordinates.lat,
            currentCheckIn.venue.coordinates.lng
          );

          // Add buffer to prevent premature checkout
          if (distanceFromCheckIn > GEOFENCE_RADIUS_METERS + DISTANCE_THRESHOLD_BUFFER) {
            console.log(
              `🚪 Automatic check-out detected: ${currentCheckIn.venue.name} (${Math.round(distanceFromCheckIn)}m away)`
            );
            setLastNotifiedVenue(null);
            onCheckOutDetected();
          }
        }
      }
    },
    [venues, currentCheckIn, enabled, lastNotifiedVenue, onCheckInDetected, onCheckOutDetected]
  );

  // Start watching user position
  useEffect(() => {
    if (!enabled) {
      // Stop watching if disabled
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      if (fallbackIntervalRef.current !== null) {
        window.clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
      return;
    }

    if (geolocationBlocked) {
      // Geolocation is blocked - automatic check-in disabled, but this is expected
      return;
    }

    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser");
      if (!hasShownPermissionError.current) {
        toast.error("Geolocation is not supported by your browser. Please use manual check-in.");
        hasShownPermissionError.current = true;
      }
      setGeolocationBlocked(true);
      return;
    }

    // Try to use watchPosition first
    if (useWatchPosition) {
      try {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const newPosition = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserPosition(newPosition);
            checkGeofences(newPosition);
          },
          (error) => {
            // Handle geolocation errors with detailed messages
            let errorMessage = "Location error";
            
            // Check if geolocation is blocked by permissions policy
            if (error.message && error.message.includes("permissions policy")) {
              console.log("Geolocation blocked by permissions policy - disabling automatic check-in");
              if (!hasShownPermissionError.current) {
                toast.error("Automatic check-in is unavailable in this environment. Please use manual check-in.", {
                  duration: 5000,
                });
                hasShownPermissionError.current = true;
              }
              setGeolocationBlocked(true);
              setUseWatchPosition(false);
              return;
            }
            
            switch (error.code) {
              case 1: // PERMISSION_DENIED
                errorMessage = "Location permission denied. Please enable location access in your browser settings.";
                console.error("Geolocation permission denied:", error.message);
                if (!hasShownPermissionError.current) {
                  toast.error("Automatic check-in requires location access. Please use manual check-in.", {
                    duration: 5000,
                  });
                  hasShownPermissionError.current = true;
                }
                // Disable geofencing if permission denied
                setGeolocationBlocked(true);
                setUseWatchPosition(false);
                break;
              case 2: // POSITION_UNAVAILABLE
                errorMessage = "Location information unavailable. Please check your device settings.";
                console.error("Geolocation position unavailable:", error.message);
                // Try fallback method
                setUseWatchPosition(false);
                break;
              case 3: // TIMEOUT
                console.error("Geolocation timeout:", error.message);
                // Don't show error for timeout, just retry
                break;
              default:
                errorMessage = `Location error: ${error.message || "Unknown error"}`;
                console.error("Geolocation error:", {
                  code: error.code,
                  message: error.message,
                  PERMISSION_DENIED: error.PERMISSION_DENIED,
                  POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
                  TIMEOUT: error.TIMEOUT
                });
            }
          },
          {
            enableHighAccuracy: false, // Use false for better compatibility
            timeout: 15000,
            maximumAge: 30000, // Allow cached position up to 30 seconds old
          }
        );

        setWatchId(id);

        return () => {
          if (id !== null) {
            navigator.geolocation.clearWatch(id);
          }
        };
      } catch (error) {
        console.error("Error setting up watchPosition:", error);
        setUseWatchPosition(false);
      }
    } else {
      // Fallback: use getCurrentPosition with polling
      const getCurrentPos = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newPosition = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserPosition(newPosition);
            checkGeofences(newPosition);
          },
          (error) => {
            // Check if geolocation is blocked by permissions policy
            if (error.message && error.message.includes("permissions policy")) {
              console.log("Geolocation blocked by permissions policy in fallback - disabling");
              if (!hasShownPermissionError.current) {
                toast.error("Automatic check-in is unavailable in this environment. Please use manual check-in.", {
                  duration: 5000,
                });
                hasShownPermissionError.current = true;
              }
              setGeolocationBlocked(true);
              // Clear the interval
              if (fallbackIntervalRef.current !== null) {
                window.clearInterval(fallbackIntervalRef.current);
                fallbackIntervalRef.current = null;
              }
              return;
            }
            console.error("getCurrentPosition error:", error.message || error);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 30000,
          }
        );
      };

      // Get position immediately
      getCurrentPos();

      // Then poll every 30 seconds
      const intervalId = window.setInterval(getCurrentPos, FALLBACK_POSITION_INTERVAL);
      fallbackIntervalRef.current = intervalId;

      return () => {
        if (fallbackIntervalRef.current !== null) {
          window.clearInterval(fallbackIntervalRef.current);
          fallbackIntervalRef.current = null;
        }
      };
    }
  }, [enabled, checkGeofences, useWatchPosition]);

  // Periodic check in case watchPosition doesn't trigger
  useEffect(() => {
    if (!enabled || !userPosition) return;

    const interval = setInterval(() => {
      checkGeofences(userPosition);
    }, POSITION_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [enabled, userPosition, checkGeofences]);

  // This component doesn't render anything
  return null;
}
