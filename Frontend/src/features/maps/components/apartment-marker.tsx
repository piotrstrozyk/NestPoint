import { Apartment } from '@/features/apartment-list/types/apartment';
import ApartmentPopup from '@/features/maps/components/apartment-popup';
import { Marker, Popup } from 'react-leaflet';

interface ApartmentMarkerProps {
  apt: Apartment;
}

export default function ApartmentMarker({ apt }: ApartmentMarkerProps) {
  if (apt.address.latitude == null || apt.address.longitude == null) {
    return null;
  }

  return (
    <Marker position={[apt.address.latitude, apt.address.longitude]}>
      <Popup closeOnClick={true} closeOnEscapeKey={true}>
        <ApartmentPopup apt={apt} />
      </Popup>
    </Marker>
  );
}
