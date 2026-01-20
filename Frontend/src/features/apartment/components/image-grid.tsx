import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';

interface ImageGridProps {
  photos: string[];
  photosLoading: boolean;
  photosError: boolean;
  index: number;
  setIndex: (val: number) => void;
  slides: { src: string }[];
  apartmentTitle: string;
}

export function ImageGrid({
  photos,
  photosLoading,
  photosError,
  index,
  setIndex,
  slides,
  apartmentTitle,
}: ImageGridProps) {
  if (photosLoading) {
    return <p>Loading photos…</p>;
  }
  if (photosError) {
    return <p className='text-red-600'>Error loading photos.</p>;
  }
  if (!photos || photos.length === 0) {
    return <p className='text-gray-500'>No photos available.</p>;
  }

  return (
    <section>
      <div className='grid h-[600px] grid-cols-3 grid-rows-2 gap-4'>
        {/* Main photo */}
        <button
          onClick={() => setIndex(0)}
          className='relative col-span-2 row-span-2 overflow-hidden rounded-lg'
        >
          <Image
            src={photos[0]!}
            alt={`Photo 1 of ${apartmentTitle}`}
            fill
            className='object-cover'
          />
        </button>

        {/* Thumbnails */}
        {[1, 2, 3, 4].map((i) => {
          const src = photos[i];
          if (!src) return <div key={i} />;
          const isLast = i === 4;
          return (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className='relative overflow-hidden rounded-lg'
            >
              <Image
                src={src}
                alt={`Photo ${i + 1}`}
                fill
                className='object-cover'
              />
              {isLast && photos.length > 5 && (
                <div className='absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white'>
                  All photos ({photos.length})
                </div>
              )}
            </button>
          );
        })}
      </div>

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={slides}
      />
    </section>
  );
}
