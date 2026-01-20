import { Camera, Image as ImageIcon, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { DragEvent, useRef, useState } from 'react';

type Props = {
  selectedPhotos: File[];
  onAdd: (files: File[]) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
};

export function PhotoUploader({
  selectedPhotos,
  onAdd,
  onRemove,
  onClear,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    onAdd(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Function to clear all photos
  const clearAllPhotos = () => {
    // This will set the selectedPhotos array to empty in the parent component
    onClear();
  };

  // Drag & drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/'),
      );

      if (droppedFiles.length > 0) {
        onAdd(droppedFiles);
      }
    }
  };

  return (
    <div className='space-y-4'>
      <div
        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-indigo-500'}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className='space-y-2'>
          <div className='flex justify-center'>
            <Camera
              className={`h-10 w-10 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`}
            />
          </div>
          <div className='flex flex-col items-center text-sm text-gray-600'>
            <label
              htmlFor='photo-uploader-input'
              className='text-primary relative cursor-pointer rounded-md bg-white font-medium focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:outline-none hover:text-indigo-500'
            >
              <span>Upload photos</span>
              <input
                ref={fileInputRef}
                id='photo-uploader-input'
                type='file'
                accept='image/*'
                multiple
                onChange={handleFiles}
                className='sr-only'
              />
            </label>
            <p className='mt-1 text-center'>
              {isDragging ? (
                <span className='font-medium text-indigo-600'>
                  Drop files here
                </span>
              ) : (
                <span>or drag and drop image files</span>
              )}
            </p>
          </div>
          <p className='text-xs text-gray-500'>PNG, JPG up to 10MB each</p>
        </div>

        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          className='mt-4 inline-flex items-center rounded-md border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm hover:bg-indigo-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none'
        >
          <Upload className='mr-2 h-4 w-4' />
          Select Files
        </button>
      </div>

      {selectedPhotos.length > 0 && (
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-medium text-gray-700'>
              Selected Photos ({selectedPhotos.length})
            </h3>
            <button
              type='button'
              onClick={clearAllPhotos}
              className='text-xs text-red-600 hover:text-red-800'
            >
              Clear All
            </button>
          </div>

          <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
            {selectedPhotos.map((file, idx) => {
              const blobUrl = URL.createObjectURL(file);
              return (
                <div
                  key={idx}
                  className='group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100'
                >
                  <div className='aspect-w-4 aspect-h-3 w-full'>
                    <Image
                      loader={({ src }) => src}
                      src={blobUrl}
                      alt={file.name}
                      width={200}
                      height={150}
                      className='h-full w-full object-cover'
                    />
                  </div>
                  <div className='bg-opacity-40 absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-opacity group-hover:opacity-100'>
                    <button
                      type='button'
                      onClick={() => onRemove(idx)}
                      className='rounded-full bg-white p-1.5 text-gray-900 hover:bg-red-100 hover:text-red-700'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </div>
                  <div
                    className='truncate p-2 text-xs text-gray-500'
                    title={file.name}
                  >
                    {file.name.length > 20
                      ? `${file.name.substring(0, 17)}...`
                      : file.name}
                  </div>
                </div>
              );
            })}

            {/* Add more photos button */}
            <div
              className={`relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors ${isDragging ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-indigo-500'}`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <ImageIcon
                className={`mb-1 h-8 w-8 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`}
              />
              <span className='text-primary text-xs'>
                {isDragging ? 'Drop Here' : 'Add More'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
