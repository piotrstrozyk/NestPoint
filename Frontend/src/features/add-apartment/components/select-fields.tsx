import { ApartmentForm } from '@/features/add-apartment/schemas/add-apartment';
import { AlertCircle, ChefHat, Droplet, Home, Trees } from 'lucide-react';
import { FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form';

// Options with display names and icons
const kitchenOptions = [
  { value: 'PRIVATE', label: 'Private Kitchen', description: 'Exclusive use' },
  {
    value: 'SHARED',
    label: 'Shared Kitchen',
    description: 'Shared with others',
  },
];

const yardOptions = [
  { value: 'NONE', label: 'No Yard Access', description: 'No outdoor space' },
  { value: 'SHARED', label: 'Shared Yard', description: 'Common outdoor area' },
  {
    value: 'PRIVATE',
    label: 'Private Yard',
    description: 'Exclusive outdoor space',
  },
];

const poolOptions = [
  { value: 'NONE', label: 'No Pool Access', description: 'No swimming pool' },
  {
    value: 'SHARED',
    label: 'Shared Pool',
    description: 'Common swimming pool',
  },
  { value: 'PRIVATE', label: 'Private Pool', description: 'Exclusive pool' },
];

const propertyOptions = [
  {
    value: 'APARTMENT',
    label: 'Apartment',
    description: 'Residential unit in a building',
  },
  {
    value: 'ROOM',
    label: 'Room',
    description: 'Single room in a shared property',
  },
  {
    value: 'PROPERTY',
    label: 'Full Property',
    description: 'Complete house or villa',
  },
];

const selectConfigs = [
  {
    name: 'kitchen' as const,
    options: kitchenOptions,
    icon: <ChefHat className='text-primary h-5 w-5' />,
  },
  {
    name: 'yardAccess' as const,
    options: yardOptions,
    icon: <Trees className='text-primary h-5 w-5' />,
  },
  {
    name: 'poolAccess' as const,
    options: poolOptions,
    icon: <Droplet className='text-primary h-5 w-5' />,
  },
  {
    name: 'propertyType' as const,
    options: propertyOptions,
    icon: <Home className='text-primary h-5 w-5' />,
  },
];

type SelectProps = {
  register: UseFormRegister<ApartmentForm>;
  errors: FieldErrors<ApartmentForm>;
  watch?: UseFormWatch<ApartmentForm>;
};

export function SelectFields({ register, errors, watch }: SelectProps) {
  // Safely get current values without depending on useFormContext
  const getOptionDescription = (
    name: keyof ApartmentForm,
    options: Array<{ value: string; label: string; description: string }>,
  ) => {
    if (watch) {
      const currentValue = watch(name);
      return options.find((o) => o.value === currentValue)?.description || '';
    }
    return '';
  };

  return (
    <div className='space-y-5'>
      {selectConfigs.map(({ name, options, icon }) => (
        <div key={name} className='mb-4'>
          <label className='mb-1 flex items-center text-sm font-medium text-gray-700 capitalize'>
            {icon}
            <span className='ml-2'>
              {name.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          </label>
          <select
            {...register(name)}
            className='mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none'
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Show description of selected option if watch is available */}
          {watch && (
            <p className='mt-1 text-xs text-gray-500'>
              {getOptionDescription(name, options)}
            </p>
          )}

          {errors[name]?.message && (
            <p className='mt-1 flex items-center text-sm text-red-600'>
              <AlertCircle className='mr-1 h-4 w-4' />
              {errors[name]?.message as string}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
