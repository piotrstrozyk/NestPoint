import {
  PhotoUploader,
  photoUploaderImageLoader,
} from '@/features/owner/components/edit-apartment/photo-uploader';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock next/image to render a normal img with correct types
vi.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
  }) => <img {...props} alt={props.alt || ''} />,
}));

describe('PhotoUploader', () => {
  let originalCreateObjectURL: typeof URL.createObjectURL;
  beforeEach(() => {
    originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = (obj: Blob | MediaSource) => {
      if (obj instanceof File && 'name' in obj) {
        return `blob:${obj.name}`;
      }
      return 'blob:mock';
    };
  });
  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
  });

  it('renders file input and label', () => {
    render(
      <PhotoUploader selectedPhotos={[]} onAdd={vi.fn()} onRemove={vi.fn()} />,
    );
    expect(screen.getByLabelText('Photos')).toBeInTheDocument();
    expect(screen.getByLabelText('Photos').getAttribute('type')).toBe('file');
  });

  it('calls onAdd with selected files and resets file input value', () => {
    const onAdd = vi.fn();
    render(
      <PhotoUploader selectedPhotos={[]} onAdd={onAdd} onRemove={vi.fn()} />,
    );
    const input = screen.getByLabelText('Photos') as HTMLInputElement;
    // Set a fake value to simulate a file selection
    Object.defineProperty(input, 'value', {
      writable: true,
      value: 'C:\\fakepath\\test.png',
    });
    const file = new File(['dummy'], 'test.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onAdd).toHaveBeenCalledWith([file]);
    expect(input.value).toBe('');
  });

  it('calls onAdd with empty array if no files are selected', () => {
    const onAdd = vi.fn();
    render(
      <PhotoUploader selectedPhotos={[]} onAdd={onAdd} onRemove={vi.fn()} />,
    );
    const input = screen.getByLabelText('Photos') as HTMLInputElement;
    // Simulate no files selected (files is null)
    fireEvent.change(input, { target: { files: null } });
    expect(onAdd).toHaveBeenCalledWith([]);
  });

  it('renders previews for selected photos', () => {
    const file1 = new File(['a'], 'a.png', { type: 'image/png' });
    const file2 = new File(['b'], 'b.jpg', { type: 'image/jpeg' });
    render(
      <PhotoUploader
        selectedPhotos={[file1, file2]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByAltText('a.png')).toBeInTheDocument();
    expect(screen.getByAltText('b.jpg')).toBeInTheDocument();
  });

  it('calls onRemove with correct index when remove button is clicked', () => {
    const file1 = new File(['a'], 'a.png', { type: 'image/png' });
    const file2 = new File(['b'], 'b.jpg', { type: 'image/jpeg' });
    const onRemove = vi.fn();
    render(
      <PhotoUploader
        selectedPhotos={[file1, file2]}
        onAdd={vi.fn()}
        onRemove={onRemove}
      />,
    );
    const removeButtons = screen.getAllByRole('button', { name: '×' });
    fireEvent.click(removeButtons[1]);
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('does not render previews when selectedPhotos is empty', () => {
    render(
      <PhotoUploader selectedPhotos={[]} onAdd={vi.fn()} onRemove={vi.fn()} />,
    );
    expect(screen.queryByAltText(/.*/)).toBeNull();
  });
});

describe('photoUploaderImageLoader', () => {
  it('returns the src as-is', () => {
    expect(photoUploaderImageLoader({ src: 'test-url' })).toBe('test-url');
  });
});
