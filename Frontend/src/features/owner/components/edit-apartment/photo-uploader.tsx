import Image from 'next/image';
import { useRef } from 'react';

type Props = {
  selectedPhotos: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
};

// Export the loader function for test coverage
export const photoUploaderImageLoader = ({ src }: { src: string }) => src;

export function PhotoUploader({ selectedPhotos, onAdd, onRemove }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    onAdd(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <label htmlFor='photo-uploader-input' className='block font-medium'>
        Photos
      </label>
      <input
        ref={fileInputRef}
        id='photo-uploader-input'
        type='file'
        accept='image/*'
        multiple
        onChange={handleFiles}
        className='cursor-pointer rounded border bg-gray-100 px-3 py-2 transition hover:bg-gray-200'
      />

      {selectedPhotos.length > 0 && (
        <div className='mt-2 flex flex-wrap gap-2'>
          {selectedPhotos.map((file, idx) => {
            const blobUrl = URL.createObjectURL(file);
            return (
              <div
                key={idx}
                className='relative h-20 w-20 overflow-hidden rounded'
                title={file.name}
              >
                <Image
                  loader={photoUploaderImageLoader}
                  src={blobUrl}
                  alt={file.name}
                  width={80}
                  height={80}
                  className='object-cover'
                />
                <button
                  type='button'
                  onClick={() => onRemove(idx)}
                  className='bg-opacity-50 hover:bg-opacity-75 absolute top-0 right-0 m-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-xs text-white'
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
