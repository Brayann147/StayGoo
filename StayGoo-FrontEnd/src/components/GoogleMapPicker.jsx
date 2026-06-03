import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "100%"
};

const defaultCenter = {
  lat: 36.2704,
  lng: -121.8081
};

export function GoogleMapPicker({ apiKey, position, onChange, readOnly = false }) {
  const center = position || defaultCenter;
  const actualApiKey = apiKey && apiKey !== "your_google_maps_api_key_here" ? apiKey : null;

  const { isLoaded } = useJsApiLoader({
    id: "host-location-google-map",
    googleMapsApiKey: actualApiKey || ""
  });

  const handleMapClick = (event) => {
    if (readOnly) return;
    const lat = event.latLng?.lat();
    const lng = event.latLng?.lng();
    if (typeof lat === "number" && typeof lng === "number" && onChange) {
      onChange({ lat, lng });
    }
  };

  const handleMarkerDragEnd = (event) => {
    if (readOnly) return;
    const lat = event.latLng?.lat();
    const lng = event.latLng?.lng();
    if (typeof lat === "number" && typeof lng === "number" && onChange) {
      onChange({ lat, lng });
    }
  };

  if (!actualApiKey) {
    return (
      <div className="hostMapFallback">
        <p>Google Maps no está disponible.</p>
        <small>Configura VITE_GOOGLE_MAPS_API_KEY en tu archivo .env local.</small>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="hostMapFallback">Cargando mapa...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={13}
      onClick={handleMapClick}
      options={{
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        gestureHandling: readOnly ? "cooperative" : "auto",
        zoomControl: !readOnly,
        draggable: !readOnly,
        scrollwheel: !readOnly,
        disableDoubleClickZoom: readOnly
      }}
    >
      <MarkerF position={center} draggable={!readOnly} onDragEnd={handleMarkerDragEnd} />
    </GoogleMap>
  );
}
