import MapPlaceholder from '@/features/maps/components/map-placeholder';
import dynamic from 'next/dynamic';
import { FaMapMarkerAlt } from 'react-icons/fa';

const MyMap = dynamic(
  () =>
    import('@/features/maps/components/address-map').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <MapPlaceholder />,
  },
);

interface MapCardProps {
  latitude: number | null;
  longitude: number | null;
  address: string;
  photo?: string;
}

export function MapCard({ latitude, longitude, address }: MapCardProps) {
  return (
    <section className='rounded-lg bg-gray-50 p-6'>
      <h2 className='mb-4 flex items-center gap-2 text-2xl font-semibold'>
        <FaMapMarkerAlt className='text-primary' />
        Address
      </h2>
      <div className='mb-4 h-80 w-full overflow-hidden rounded-lg'>
        {latitude != null && longitude != null ? (
          <MyMap address={address} zoom={18} />
        ) : (
          <MapPlaceholder />
        )}
      </div>
      <p className='text-gray-700'>{address}</p>
    </section>
  );
}
