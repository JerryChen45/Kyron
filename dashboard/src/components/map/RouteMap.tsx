import { MapContainer, TileLayer, Polyline, Polygon, CircleMarker, Popup } from 'react-leaflet';
import type { RoutePoint } from '../../models/mission';

type RouteMapProps = {
  boundary?: RoutePoint[];
  route?: RoutePoint[];
  completedRoute?: RoutePoint[];
  restrictedZones?: RoutePoint[][];
  robotPosition?: { latitude: number; longitude: number; headingDegrees?: number };
  height?: string;
};

function toLatLng(points: RoutePoint[]): [number, number][] {
  return points.map((p) => [p.latitude, p.longitude]);
}

export function RouteMap({
  boundary = [],
  route = [],
  completedRoute = [],
  restrictedZones = [],
  robotPosition,
  height = '400px',
}: RouteMapProps) {
  const allPoints = [...boundary, ...route, ...(robotPosition ? [robotPosition] : [])];
  const center: [number, number] = allPoints.length
    ? [allPoints[0].latitude, allPoints[0].longitude]
    : [38.297, -122.286];

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden border border-gray-200">
      <MapContainer center={center} zoom={16} scrollWheelZoom style={{ height: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {boundary.length > 0 && (
          <Polygon
            positions={toLatLng(boundary)}
            pathOptions={{ color: '#2d6a4f', weight: 2, fillOpacity: 0.05 }}
          />
        )}
        {restrictedZones.map((zone, i) => (
          <Polygon
            key={i}
            positions={toLatLng(zone)}
            pathOptions={{ color: '#e63946', weight: 2, fillOpacity: 0.2, dashArray: '6' }}
          />
        ))}
        {route.length > 0 && (
          <Polyline
            positions={toLatLng(route)}
            pathOptions={{ color: '#94a3b8', weight: 3, dashArray: '8 8' }}
          />
        )}
        {completedRoute.length > 0 && (
          <Polyline
            positions={toLatLng(completedRoute)}
            pathOptions={{ color: '#2d6a4f', weight: 4 }}
          />
        )}
        {robotPosition && (
          <CircleMarker
            center={[robotPosition.latitude, robotPosition.longitude]}
            radius={10}
            pathOptions={{ color: '#1b263b', fillColor: '#f4a261', fillOpacity: 1, weight: 2 }}
          >
            <Popup>Robot position</Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}

export type CameraSource = {
  type: 'placeholder' | 'video' | 'webrtc' | 'hls' | 'mjpeg';
  url?: string;
};

export function CameraPanel({ source }: { source: CameraSource }) {
  return (
    <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
      {source.type === 'video' && source.url ? (
        <video src={source.url} autoPlay loop muted className="w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70">
          <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center mb-3 animate-pulse">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
            </svg>
          </div>
          <p className="text-sm">Simulated camera feed</p>
          <p className="text-xs text-white/40 mt-1">Source: {source.type}</p>
        </div>
      )}
      <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-medium">
        LIVE SIM
      </div>
    </div>
  );
}
