import { useFetchStats } from '@/features/landing-page/hooks/use-fetch-stats';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  Bar,
  BarChart,
  ResponsiveContainer as BarResponsive,
  Tooltip as BarTooltip,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer as PieResponsive,
  Tooltip as PieTooltip,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  XAxis,
  YAxis,
} from 'recharts';

export default function StatsSection() {
  const { stats, loading } = useFetchStats();

  // Generate property type distribution from stats
  const propertyTypeData = stats.propertyTypes
    ? Object.entries(stats.propertyTypes).map(([name, value]) => ({ name, value }))
    : [];
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  const barData = [
    { name: 'Auctions', value: stats.activeAuctions },
    { name: 'Tenants', value: stats.tenants },
    { name: 'Apartments', value: stats.apartments },
    { name: 'Rentals', value: stats.rentals },
  ];

  // Simple sum for 'APARTMENT' propertyType
  const apartmentCount = Array.isArray(stats.apartments)
    ? stats.apartments.filter(
        (apt: { propertyType: string }) => apt.propertyType === 'APARTMENT',
      ).length
    : 0;
  console.log('Number of APARTMENT propertyTypes:', apartmentCount);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className='mx-auto my-20 max-w-6xl px-4'>
          <h2 className='mb-6 text-center text-3xl font-semibold'>
            Live Website Stats
          </h2>
          <p className='text-muted-foreground mb-10 text-center text-lg'>
            Real-time snapshot of activity across NestPoint.
          </p>
          {/* Counters skeleton */}
          <div className='mb-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4'>
            {[...barData].map((_, i) => (
              <div key={i} className='rounded-xl border bg-slate-50 p-6'>
                <Skeleton height={24} width={100} />
                <div className='mt-4'>
                  <Skeleton height={48} />
                </div>
              </div>
            ))}
          </div>

          {/* Charts skeleton */}
          <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
            {/* Occupancy gauge skeleton */}
            <div className='rounded-xl border bg-slate-50 p-6'>
              <Skeleton circle width={150} height={150} />
              <div className='mt-4'>
                <Skeleton height={16} width={80} />
              </div>
            </div>

            {/* Bar chart skeleton */}
            <div className='rounded-xl border bg-slate-50 p-6'>
              <Skeleton height={24} width={120} />
              <div className='mt-4'>
                <Skeleton height={200} />
              </div>
            </div>

            {/* Pie chart skeleton */}
            <div className='rounded-xl border bg-slate-50 p-6'>
              <Skeleton height={24} width={120} />
              <div className='mt-4 flex justify-center'>
                <Skeleton circle width={150} height={150} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const rentalPercentage = ((stats.rentals / stats.apartments) * 100).toFixed(
    1,
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className='mx-auto my-20 max-w-6xl px-4'>
        <h2 className='mb-6 text-center text-3xl font-semibold'>
          Live Website Stats
        </h2>
        <p className='text-muted-foreground mb-10 text-center text-lg'>
          Real-time snapshot of activity across NestPoint.
        </p>

        {/* Animated counters */}
        <div className='mb-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          {barData.map((item) => (
            <div
              key={item.name}
              className='rounded-xl border bg-slate-50 p-6 shadow transition hover:shadow-lg'
            >
              <h3 className='mb-2 text-xl font-medium'>{item.name}</h3>
              <p className='text-primary text-4xl font-bold'>
                <CountUp end={item.value} duration={1.5} separator=',' />
              </p>
            </div>
          ))}
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          {/* Occupancy */}
          <div className='relative rounded-xl border bg-slate-50 p-6 shadow'>
            <h3 className='mb-4 text-xl font-medium'>Occupancy</h3>

            <div className='flex items-center justify-center'>
              <BarResponsive width={200} height={200}>
                <RadialBarChart
                  innerRadius='70%'
                  outerRadius='100%'
                  data={[{ name: 'Occ', value: parseFloat(rentalPercentage) }]}
                  startAngle={90}
                  endAngle={-270}
                >
                  {/* Force scale 0 → 100 so value% renders correctly */}
                  <PolarAngleAxis
                    type='number'
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                  />

                  <RadialBar
                    dataKey='value'
                    cornerRadius={10}
                    fill='#3b82f6'
                    background={{ fill: '#e5e7eb' }}
                  />
                </RadialBarChart>
              </BarResponsive>

              {/* Centered percentage */}
              <div className='text-primary absolute text-3xl font-bold'>
                {rentalPercentage}%
              </div>
            </div>

            <p className='text-muted-foreground mt-4 text-sm'>
              <CountUp end={stats.rentals} duration={1.5} separator=',' /> /{' '}
              <CountUp end={stats.apartments} duration={1.5} separator=',' />
            </p>
          </div>

          {/* Bar chart */}
          <div className='rounded-xl border bg-slate-50 p-6 shadow'>
            <h3 className='mb-4 text-xl font-medium'>Platform Activity</h3>
            <BarResponsive width='100%' height={250}>
              <BarChart data={barData}>
                <XAxis dataKey='name' />
                <YAxis allowDecimals={false} />
                <BarTooltip />
                <Bar dataKey='value' fill='#e11d48' radius={[6, 6, 0, 0]} />
              </BarChart>
            </BarResponsive>
          </div>

          {/* Pie chart */}
          <div className='rounded-xl border bg-slate-50 p-6 shadow'>
            <h3 className='mb-4 text-xl font-medium'>Property Types</h3>
            <PieResponsive width='100%' height={250}>
              <PieChart>
                <Pie
                  data={propertyTypeData}
                  dataKey='value'
                  nameKey='name'
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  label
                >
                  {propertyTypeData.map((_, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={PIE_COLORS[idx % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <PieTooltip />
                <Legend verticalAlign='bottom' height={36} />
              </PieChart>
            </PieResponsive>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
