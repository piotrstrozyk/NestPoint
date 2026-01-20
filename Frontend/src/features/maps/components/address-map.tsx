import type { GeoJsonObject } from 'geojson';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { GeoJSON, MapContainer, Marker, TileLayer } from 'react-leaflet';

interface MyMapProps {
  address: string;
  zoom: number;
}

const AddressMap: React.FC<MyMapProps> = ({ address, zoom }) => {
  const [center, setCenter] = useState<[number, number] | null>(null);
  const [buildingGeoJSON, setBuildingGeoJSON] = useState<GeoJsonObject | null>(
    null,
  );
  const [useSatellite, setUseSatellite] = useState(false);

  useEffect(() => {
    // Whenever `address` changes, re‐geocode.
    const fetchGeo = async () => {
      try {
        const params = new URLSearchParams({
          q: address,
          format: 'json',
          polygon_geojson: '1',
        });

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        );
        const results = await res.json();

        if (Array.isArray(results) && results.length > 0) {
          const first = results[0];
          const lat = parseFloat(first.lat);
          const lon = parseFloat(first.lon);
          setCenter([lat, lon]);

          // If Nominatim returned a geojson polygon, store it
          if (first.geojson) {
            setBuildingGeoJSON(first.geojson);
          }
        }
      } catch (err) {
        console.error('Nominatim fetch error', err);
      }
    };

    fetchGeo();
  }, [address]);

  // Don’t render a Leaflet map until center is non‐null.
  if (center === null) {
    return (
      <div className='flex h-full w-full items-center justify-center text-gray-500'>
        Loading map…
      </div>
    );
  }

  return (
    <div className='relative h-full w-full'>
      {/* Satellite toggle button */}
      <button
        onClick={() => setUseSatellite((prev) => !prev)}
        className='bg-opacity-90 hover:bg-opacity-100 absolute top-4 right-4 z-20 rounded bg-white px-3 py-1 text-sm font-medium shadow'
      >
        {useSatellite ? 'OSM View' : 'Satellite View'}
      </button>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className='h-full w-full'
      >
        {/* Conditionally render the TileLayer */}
        {useSatellite ? (
          <TileLayer
            url='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            attribution='Tiles © Esri &mdash; Source: The GIS User Community'
          />
        ) : (
          <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        )}

        {/* If we got a building polygon back, draw it */}
        {buildingGeoJSON && (
          <GeoJSON
            data={buildingGeoJSON}
            style={{
              color: '#4f39f6',
              weight: 3,
              fillColor: '#4f39f6',
              fillOpacity: 0.3,
            }}
          />
        )}

        {/* Always draw a marker at the geocoded center */}
        <Marker position={center} />
      </MapContainer>
    </div>
  );
};

export default AddressMap;
