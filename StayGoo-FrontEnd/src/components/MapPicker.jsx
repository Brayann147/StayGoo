import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons under Vite/production using CDN resources
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// Configure default Leaflet marker
L.Marker.prototype.options.icon = DefaultIcon;

// Center of Colombia as fallback
const defaultCenter = {
  lat: 4.7110,
  lng: -74.0721
};

export function MapPicker({ position, onChange, readOnly = false }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Determine starting coordinates
  const lat = position && typeof position.lat === "number" ? position.lat : defaultCenter.lat;
  const lng = position && typeof position.lng === "number" ? position.lng : defaultCenter.lng;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      zoomControl: !readOnly,
      dragging: !readOnly,
      touchZoom: !readOnly,
      scrollWheelZoom: !readOnly,
      doubleClickZoom: !readOnly,
      boxZoom: !readOnly,
      keyboard: !readOnly,
      attributionControl: true
    }).setView([lat, lng], 13);

    mapRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Create marker
    const marker = L.marker([lat, lng], {
      draggable: !readOnly
    }).addTo(map);

    markerRef.current = marker;

    // Hook events if interactive
    if (!readOnly && onChange) {
      marker.on("dragend", () => {
        const latLng = marker.getLatLng();
        onChange({ lat: latLng.lat, lng: latLng.lng });
      });

      map.on("click", (e) => {
        const latLng = e.latlng;
        marker.setLatLng(latLng);
        onChange({ lat: latLng.lat, lng: latLng.lng });
      });
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [readOnly]); // Re-init map if readOnly status changes

  // Update position reactively if parent coordinates change
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !position) return;
    const currentLat = position.lat;
    const currentLng = position.lng;

    if (typeof currentLat === "number" && typeof currentLng === "number") {
      const markerLatLng = markerRef.current.getLatLng();
      if (markerLatLng.lat !== currentLat || markerLatLng.lng !== currentLng) {
        markerRef.current.setLatLng([currentLat, currentLng]);
        mapRef.current.setView([currentLat, currentLng], 13);
      }
    }
  }, [position]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ width: "100%", height: "100%", minHeight: "250px", zIndex: 1 }}
      className="osm-map-container"
    />
  );
}

export default MapPicker;
