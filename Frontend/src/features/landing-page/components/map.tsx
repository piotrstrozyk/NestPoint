import { Apartment } from '@/features/apartment-list/types/apartment';
import ApartmentPopup from '@/features/maps/components/apartment-popup';
import L from 'leaflet';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

function ChangeView({
  center,
  zoom,
  offsetY = 100,
}: {
  center: [number, number];
  zoom: number;
  offsetY?: number;
}) {
  const map = useMap();
  useEffect(() => {
    // 1) project the target latLng to container (pixel) coordinates
    const targetPoint = map.latLngToContainerPoint(center);
    // 2) subtract from its y to move it *up* by offsetY pixels
    const offsetPoint = L.point(targetPoint.x, targetPoint.y - offsetY);
    // 3) convert back to latLng
    const offsetLatLng = map.containerPointToLatLng(offsetPoint);
    // 4) flyTo that adjusted location
    map.flyTo(offsetLatLng, zoom, { animate: true, duration: 1 });
  }, [center, zoom, map, offsetY]);

  return null;
}

interface MyMapProps {
  position: [number, number];
  zoom: number;
  apt: Apartment;
}

export default function MyMap({ position, zoom, apt }: MyMapProps) {
  const markerRef = useRef<L.Marker | null>(null);

  return (
    <MapContainer
      center={position}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
      dragging={false}
      touchZoom={false}
      doubleClickZoom={false}
      keyboard={false}
      className='h-full w-full'
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      <Marker
        position={position}
        ref={markerRef}
        eventHandlers={{
          add: () => {
            // once this marker is actually on the map, open its popup
            markerRef.current?.openPopup();
          },
        }}
      >
        <Popup
          closeButton={false}
          maxWidth={250}
          keepInView={true}
          closeOnClick={false}
        >
          <ApartmentPopup apt={apt} />
        </Popup>
      </Marker>
      <ChangeView center={position} zoom={zoom} offsetY={100} />
    </MapContainer>
  );
}
