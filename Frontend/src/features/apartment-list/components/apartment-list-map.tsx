'use client';

import { Apartment } from '@/features/apartment-list/types/apartment';
import ApartmentMarker from '@/features/maps/components/apartment-marker';
import L, { DivIcon } from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import 'react-image-gallery/styles/css/image-gallery.css';
import { MapContainer, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';

interface ApartmentListMapProps {
  apartments: Apartment[];
  zoom?: number;
  fallbackCenter: [number, number];
}

export default function ApartmentListMap({
  apartments,
  zoom = 4,
  fallbackCenter,
}: ApartmentListMapProps) {
  const [center, setCenter] = useState<[number, number] | null>(null);

  const [useSatellite, setUseSatellite] = useState(false);

  useEffect(() => {
    if (apartments.length > 0) {
      const first = apartments[0];
      if (
        typeof first.address.latitude === 'number' &&
        typeof first.address.longitude === 'number'
      ) {
        setCenter([first.address.latitude, first.address.longitude]);
        return;
      }
    }
    setCenter(fallbackCenter);
  }, [apartments, fallbackCenter]);

  if (center === null) {
    return (
      <div className='flex h-full w-full items-center justify-center text-gray-500'>
        Loading map…
      </div>
    );
  }

  // Custom cluster icon
  function makeClusterIcon(cluster: L.MarkerCluster): DivIcon {
    const count = cluster.getChildCount();
    let size = 40;
    const bgColor = '#875256';

    if (count < 5) {
      size = 40;
    } else if (count < 10) {
      size = 50;
    } else {
      size = 60;
    }

    const html = `
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: white;
          font-weight: bold;
          border: 2px solid white;
          background-color: ${bgColor};
          width: ${size}px;
          height: ${size}px;
          font-size: ${size / 2.5}px;
        "
      >
        ${count}
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-cluster-icon',
      iconSize: L.point(size, size),
    });
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

      <MapContainer center={center} zoom={zoom} className='h-full w-full'>
        {/* Conditionally render the TileLayer */}
        {useSatellite ? (
          <TileLayer
            url='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            attribution='Tiles © Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          />
        ) : (
          <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        )}

        <MarkerClusterGroup iconCreateFunction={makeClusterIcon}>
          {apartments.map((apt) => {
            if (
              typeof apt.address.latitude === 'number' &&
              typeof apt.address.longitude === 'number'
            ) {
              return <ApartmentMarker key={apt.id} apt={apt} />;
            }
            return null;
          })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
