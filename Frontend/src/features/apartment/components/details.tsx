import {
  FaBed,
  FaCar,
  FaCouch,
  FaMoneyBillWave,
  FaPaw,
  FaSwimmer,
  FaTree,
  FaUtensils,
  FaWheelchair,
  FaWifi,
} from 'react-icons/fa';

interface Apartment {
  size: number;
  numberOfRooms: number;
  numberOfBeds: number;
  rentalPrice: number;
  furnished: boolean;
  kitchen: string;
  wifi: boolean;
  petsAllowed: boolean;
  parkingSpace: boolean;
  poolAccess: string;
  poolFee: number;
  disabilityFriendly: boolean;
  yardAccess: string;
}

interface KeyDetailsProps {
  apartment: Apartment;
}

export function KeyDetails({ apartment }: KeyDetailsProps) {
  const details = [
    {
      icon: <FaCouch />,
      label: 'Furnished',
      value: apartment.furnished ? 'Yes' : 'No',
    },
    { icon: <FaBed />, label: 'Beds', value: `${apartment.numberOfBeds}` },
    { icon: <FaUtensils />, label: 'Kitchen', value: apartment.kitchen },
    { icon: <FaWifi />, label: 'Wi‑Fi', value: apartment.wifi ? 'Yes' : 'No' },
    {
      icon: <FaPaw />,
      label: 'Pets',
      value: apartment.petsAllowed ? 'Yes' : 'No',
    },
    {
      icon: <FaCar />,
      label: 'Parking',
      value: apartment.parkingSpace ? 'Yes' : 'No',
    },
    { icon: <FaSwimmer />, label: 'Pool', value: apartment.poolAccess },
    {
      icon: <FaMoneyBillWave />,
      label: 'Pool Fee',
      value: `${apartment.poolFee} zł`,
    },
    { icon: <FaTree />, label: 'Yard', value: apartment.yardAccess },
    {
      icon: <FaWheelchair />,
      label: 'Accessible',
      value: apartment.disabilityFriendly ? 'Yes' : 'No',
    },
    {
      icon: (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-6 w-6'
          fill='none'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M3 16V6h10m4 12V10h4m0 0v8m0-8h-4m-8 0H3'
          />
        </svg>
      ),
      label: 'Size',
      value: `${apartment.size} m²`,
    },
    {
      icon: (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-6 w-6'
          fill='none'
          stroke='currentColor'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 21h8M8 7h8M5 7V3h14v4M5 21V7m14 14V7'
          />
        </svg>
      ),
      label: 'Rooms',
      value: `${apartment.numberOfRooms}`,
    },
  ];

  return (
    <section className='rounded-lg bg-white p-6 pb-8 shadow-lg'>
      <h2 className='mb-6 text-2xl font-bold text-gray-800'>Key Details</h2>
      <div className='grid grid-cols-2 gap-6'>
        {details.map(({ icon, label, value }) => (
          <div
            key={label}
            className='flex flex-col items-center rounded-lg bg-gray-50 p-4 text-center transition hover:bg-indigo-50'
          >
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100'>
              <span className='text-xl text-indigo-600'>{icon}</span>
            </div>
            <dt className='mt-2 text-sm font-medium text-gray-600'>{label}</dt>
            <dd className='mt-1 text-lg font-semibold text-gray-800'>
              {value}
            </dd>
          </div>
        ))}
      </div>
    </section>
  );
}
