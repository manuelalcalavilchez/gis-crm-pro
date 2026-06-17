import { MapContainer, TileLayer, CircleMarker, useMap } from "react-leaflet";
import { useEffect } from "react";

function FlyTo({ selected }) {
  const map = useMap();

  useEffect(() => {
    if (!selected || !selected.latitud || !selected.longitud) return;
    map.flyTo([selected.latitud, selected.longitud], 16, {
      duration: 1.5,
      easeLinearity: 0.25
    });
  }, [selected, map]);

  return null;
}

export default function MapView({ items, selected, onSelect }) {
  // Centro en España por defecto
  const defaultCenter = [39.4699, -0.3763]; 

  return (
    <MapContainer center={defaultCenter} zoom={6} style={{ height: "100%", width: "100%", zIndex: 1 }}>
      <TileLayer 
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      <FlyTo selected={selected} />

      {items.map((it) => {
        if (!it.latitud || !it.longitud) return null;
        const isSelected = it.id === selected?.id;
        return (
          <CircleMarker
            key={it.id}
            center={[it.latitud, it.longitud]}
            radius={isSelected ? 12 : 6}
            pathOptions={{ 
              color: isSelected ? '#3b82f6' : '#94a3b8', 
              fillColor: isSelected ? '#60a5fa' : '#475569', 
              fillOpacity: 0.8,
              weight: isSelected ? 3 : 1
            }}
            eventHandlers={{
              click: () => onSelect(it)
            }}
          />
        );
      })}
    </MapContainer>
  );
}
