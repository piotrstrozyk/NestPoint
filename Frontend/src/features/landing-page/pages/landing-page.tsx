'use client';

import FindSVG from '@/core/components/svg/find';
import useFetchApartments from '@/features/apartment-list/hooks/use-fetch-apartments';
import HeroSection from '@/features/landing-page/components/hero-section';
import StatsSection from '@/features/landing-page/components/stats-section';
import MapPlaceholder from '@/features/maps/components/map-placeholder';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

export default function LandingPage() {
  // Dynamically import the map component to avoid SSR issues.
  const MyMap = useMemo(
    () =>
      dynamic(() => import('@/features/landing-page/components/map'), {
        ssr: false,
        loading: () => <MapPlaceholder />,
      }),
    [],
  );

  const mapZoom = 16;
  const { apartments = [] } = useFetchApartments();

  const lastFiveApts = useMemo(
    () => (apartments ?? []).slice(-5),
    [apartments],
  );

  const [locations, setLocations] = useState<[number, number][]>([]);
  const [visibleApts, setVisibleApts] = useState<typeof lastFiveApts>([]);

  const [activeCoordIndex, setActiveCoordIndex] = useState(0);

  useEffect(() => {
    const coords = lastFiveApts
      .map(
        (apt) =>
          [apt.address.latitude, apt.address.longitude] as [number, number],
      )

      .filter(([lat, lng]) => lat != null && lng != null);

    setLocations(coords);
    setVisibleApts(lastFiveApts);
    setActiveCoordIndex(0);
  }, [lastFiveApts]);

  // 3) Auto‑rotate through the coords:
  useEffect(() => {
    if (locations.length <= 1) return;
    const iv = setInterval(() => {
      setActiveCoordIndex((i) => (i + 1) % locations.length);
    }, 5000);
    return () => clearInterval(iv);
  }, [locations]);

  return (
    <div>
      <HeroSection />
      <StatsSection />

      <div className='relative mx-auto my-24 flex w-1/2 max-w-(--page-container) flex-col items-center justify-center gap-4 p-2 pb-14 sm:gap-4 sm:p-8 sm:pb-4'>
        <FindSVG />
        <h2 className='text-center text-3xl font-semibold'>
          Welcome to NestPoint!
        </h2>
        <p className='text-center text-lg'>
          Whether you&apos;re looking for a cozy studio or a spacious family
          home, we have a wide range of apartments available in top locations.
        </p>
        <p className='text-center text-lg'>
          Browse listings, view photos, and find the perfect place that fits
          your lifestyle and budget.
        </p>
        <a
          href='/apartment-list'
          className='bg-primary mt-4 rounded-xl px-6 py-3 text-white shadow-md transition hover:bg-rose-800'
        >
          Browse Active Listings
        </a>
      </div>

      <div className='z-0 mx-auto h-[48rem] w-full'>
        {locations.length === 0 ? (
          <MapPlaceholder />
        ) : (
          <MyMap
            position={locations[activeCoordIndex]}
            zoom={mapZoom}
            apt={visibleApts[activeCoordIndex]}
          />
        )}
      </div>
    </div>
  );
}
