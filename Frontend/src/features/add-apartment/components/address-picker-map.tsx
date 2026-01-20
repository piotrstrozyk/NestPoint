import useReverseGeocode from '@/features/add-apartment/hooks/use-reverse-geocode';
import { Address } from '@/features/apartment-list/types/apartment';
import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import {
  Circle,
  GeoJSON,
  MapContainer,
  Marker,
  TileLayer,
  useMapEvents,
} from 'react-leaflet';
import { PolygonGeoJSON } from '../types/polygon-geojson';

interface AddressPickerMapProps {
  fallbackCenter: [number, number];
  zoom: number;
  onAddressChange?: (address: Address | null) => void;
}

const userIcon = new L.Icon.Default();

export default function AddressPickerMap({
  fallbackCenter,
  zoom,
  onAddressChange,
}: AddressPickerMapProps) {
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const lat = markerPos?.[0] ?? null;
  const lon = markerPos?.[1] ?? null;
  const [displayAddress, setDisplayAddress] = useState<string>('');
  const { data: revData, loading, error } = useReverseGeocode(lat, lon);

  useEffect(() => {
    if (revData?.address?.fullAddress) {
      setDisplayAddress(revData.address.fullAddress);
      onAddressChange?.(revData.address);
    } else {
      setDisplayAddress('');
      onAddressChange?.(null);
    }
  }, [revData, onAddressChange]);

  // click handler
  function ClickHandler() {
    useMapEvents({
      click(e) {
        if (e.latlng?.lat != null && e.latlng?.lng != null) {
          setMarkerPos([e.latlng.lat, e.latlng.lng]);
        }
      },
    });
    return null;
  }

  // show notice if clicked, done loading, no error, but nothing to draw
  const noGeoData =
    markerPos !== null && !loading && !error && !revData?.geojson;

  return (
    <MapContainer
      center={fallbackCenter}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      className='h-full w-full'
    >
      {/* OVERLAYED ADDRESS BOX */}
      <div className='bg-opacity-90 absolute top-2 left-1/2 z-20 w-3/4 max-w-lg -translate-x-1/2 transform rounded bg-white p-2 shadow-md'>
        <input
          type='text'
          value={displayAddress}
          readOnly
          placeholder='Click on the map to get an address'
          className='w-full rounded border border-gray-300 px-2 py-1 text-sm'
        />
      </div>

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />

      <ClickHandler />

      {/* user marker */}
      {markerPos && <Marker position={markerPos} icon={userIcon} />}

      {/* draw shape when available */}
      {revData?.geojson?.type === 'Polygon' ||
      revData?.geojson?.type === 'MultiPolygon' ? (
        <GeoJSON
          key={`${lat}-${lon}`}
          data={revData.geojson}
          style={{ color: '#3880ff', weight: 2, fillOpacity: 0.1 }}
        />
      ) : revData?.geojson?.type === 'Point' &&
        Array.isArray((revData.geojson as PolygonGeoJSON).coordinates) ? (
        (() => {
          const pointGeoJson = revData.geojson as unknown as GeoJSON.Point;
          if (
            Array.isArray(pointGeoJson.coordinates) &&
            pointGeoJson.coordinates.length === 2 &&
            typeof pointGeoJson.coordinates[0] === 'number' &&
            typeof pointGeoJson.coordinates[1] === 'number'
          ) {
            const [lng, latPt] = pointGeoJson.coordinates;
            return (
              <Circle
                key={`${lat}-${lon}`}
                center={[latPt, lng]}
                radius={5}
                pathOptions={{ color: '#3880ff', weight: 2, fillOpacity: 0.1 }}
              />
            );
          }
          return null;
        })()
      ) : null}

      {/* loading / error overlays */}
      {loading && markerPos && (
        <div className='absolute top-2 left-2 rounded bg-white p-2 shadow'>
          Drawing shape...
        </div>
      )}
      {error && (
        <div className='absolute top-2 left-2 rounded bg-red-100 p-2 text-red-800 shadow'>
          Error drawing shape
        </div>
      )}

      {/* no result notice */}
      {noGeoData && (
        <div className='absolute top-2 left-2 rounded bg-yellow-100 p-2 text-yellow-800 shadow'>
          Could not find an address here.
        </div>
      )}
    </MapContainer>
  );
}
