import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";

function parseCoords(item) {
  if (item?.latitud && item?.longitud) {
    const lat = parseFloat(item.latitud);
    const lng = parseFloat(item.longitud);
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) return [lat, lng];
  }
  return null;
}

function FlyTo({ selected }) {
  const map = useMap();
  useEffect(() => {
    const coords = parseCoords(selected);
    if (!coords) return;
    map.flyTo(coords, 14, { duration: 1.2, easeLinearity: 0.25 });
  }, [selected, map]);
  return null;
}

export default function MapView({ items, selected, onSelect }) {
  const defaultCenter = [36.8381, -2.4597];

  const getColor = (item) => {
    const isSelected = item.id === selected?.id;
    if (isSelected) return { color: '#3b82f6', fillColor: '#60a5fa' };
    const estado = (item.estado_actual || '').toLowerCase();
    if (estado.includes('explotaci')) return { color: '#10b981', fillColor: '#34d399' };
    if (estado.includes('abandon')) return { color: '#f59e0b', fillColor: '#fbbf24' };
    if (estado.includes('proceso')) return { color: '#8b5cf6', fillColor: '#a78bfa' };
    return { color: '#94a3b8', fillColor: '#cbd5e1' };
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
            eventHandlers={{ click: () => onSelect(it) }}
          >
            <Popup>
              <div style={{ minWidth: '160px' }}>
                <strong>{it.numero_informe || it.referencia_cliente || `ID-${it.id}`}</strong><br />
                <small>{it.municipio} ({it.provincia})</small><br />
                <small>{it.clase_general}</small><br />
                {it.valor_mercado_adoptado && (
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                    {Number(it.valor_mercado_adoptado).toLocaleString('es-ES')} \u20ac
                  </span>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
