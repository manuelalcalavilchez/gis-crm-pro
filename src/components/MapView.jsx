import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";

// Parsear coordenadas del campo "lote" (formato "lat,lng")
function parseCoords(item) {
  if (!item?.lote) return null;
  const parts = item.lote.split(',');
  if (parts.length === 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) return [lat, lng];
  }
  return null;
}

function FlyTo({ selected }) {
  const map = useMap();

  useEffect(() => {
    const coords = parseCoords(selected);
    if (!coords) return;
    map.flyTo(coords, 14, {
      duration: 1.2,
      easeLinearity: 0.25
    });
  }, [selected, map]);

  return null;
}

export default function MapView({ items, selected, onSelect }) {
  // Centro en Almería por defecto
  const defaultCenter = [36.8381, -2.4597];

  // Determinar color según estado
  const getColor = (item) => {
    const isSelected = item.id === selected?.id;
    if (isSelected) return { color: '#3b82f6', fillColor: '#60a5fa' };
    switch (item.estado?.toLowerCase()) {
      case 'finalizado': return { color: '#10b981', fillColor: '#34d399' };
      case 'pendiente': return { color: '#f59e0b', fillColor: '#fbbf24' };
      case 'en proceso': return { color: '#8b5cf6', fillColor: '#a78bfa' };
      case 'cancelado': return { color: '#ef4444', fillColor: '#f87171' };
      default: return { color: '#94a3b8', fillColor: '#cbd5e1' };
    }
  };

  return (
    <MapContainer center={defaultCenter} zoom={9} style={{ height: "100%", width: "100%", zIndex: 1 }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />

      <FlyTo selected={selected} />

      {items.map((it) => {
        const coords = parseCoords(it);
        if (!coords) return null;
        const isSelected = it.id === selected?.id;
        const colors = getColor(it);

        return (
          <CircleMarker
            key={it.id}
            center={coords}
            radius={isSelected ? 12 : 7}
            pathOptions={{
              color: colors.color,
              fillColor: colors.fillColor,
              fillOpacity: isSelected ? 0.9 : 0.7,
              weight: isSelected ? 3 : 1.5
            }}
            eventHandlers={{
              click: () => onSelect(it)
            }}
          >
            <Popup>
              <div style={{ minWidth: '150px' }}>
                <strong>{it.referencia}</strong><br />
                <small>{it.localidad} - {it.tipo}</small><br />
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                  {Number(it.valor).toLocaleString('es-ES')} €
                </span>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
