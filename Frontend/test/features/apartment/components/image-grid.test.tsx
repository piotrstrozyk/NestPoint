import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ImageGrid } from '../../../../src/features/apartment/components/image-grid';

// Mock dependencies
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ComponentProps<'img'>) => {
    // Always provide an alt prop to avoid lint errors
    const { alt = '', ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...rest} />;
  },
}));

vi.mock('yet-another-react-lightbox', () => ({
  default: ({
    open,
    index,
  }: {
    open: boolean;
    close: () => void;
    index: number;
    slides: Array<{ src: string }>;
  }) =>
    open ? (
      <div data-testid='lightbox' data-index={index}>
        Lightbox
      </div>
    ) : null,
}));

describe('ImageGrid', () => {
  it('should show loading state when photos are loading', () => {
    render(
      <ImageGrid
        photos={[]}
        photosLoading={true}
        photosError={false}
        index={-1}
        setIndex={() => {}}
        slides={[]}
        apartmentTitle='Test Apartment'
      />,
    );

    expect(screen.getByText('Loading photos…')).toBeInTheDocument();
  });

  it('should show error state when there is an error loading photos', () => {
    render(
      <ImageGrid
        photos={[]}
        photosLoading={false}
        photosError={true}
        index={-1}
        setIndex={() => {}}
        slides={[]}
        apartmentTitle='Test Apartment'
      />,
    );

    expect(screen.getByText('Error loading photos.')).toBeInTheDocument();
    expect(screen.getByText('Error loading photos.')).toHaveClass(
      'text-red-600',
    );
  });

  it('should show no photos message when photos array is empty', () => {
    render(
      <ImageGrid
        photos={[]}
        photosLoading={false}
        photosError={false}
        index={-1}
        setIndex={() => {}}
        slides={[]}
        apartmentTitle='Test Apartment'
      />,
    );

    expect(screen.getByText('No photos available.')).toBeInTheDocument();
    expect(screen.getByText('No photos available.')).toHaveClass(
      'text-gray-500',
    );
  });

  it('should render photos when they are available', () => {
    const photos = [
      'photo1.jpg',
      'photo2.jpg',
      'photo3.jpg',
      'photo4.jpg',
      'photo5.jpg',
    ];

    render(
      <ImageGrid
        photos={photos}
        photosLoading={false}
        photosError={false}
        index={-1}
        setIndex={() => {}}
        slides={photos.map((src) => ({ src }))}
        apartmentTitle='Test Apartment'
      />,
    );

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(5);
    expect(images[0]).toHaveAttribute('src', 'photo1.jpg');
    expect(images[0]).toHaveAttribute('alt', 'Photo 1 of Test Apartment');
  });

  it('should call setIndex when a photo is clicked', () => {
    const photos = [
      'photo1.jpg',
      'photo2.jpg',
      'photo3.jpg',
      'photo4.jpg',
      'photo5.jpg',
    ];

    const setIndex = vi.fn();

    render(
      <ImageGrid
        photos={photos}
        photosLoading={false}
        photosError={false}
        index={-1}
        setIndex={setIndex}
        slides={photos.map((src) => ({ src }))}
        apartmentTitle='Test Apartment'
      />,
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(setIndex).toHaveBeenCalledWith(0);

    fireEvent.click(buttons[1]);
    expect(setIndex).toHaveBeenCalledWith(1);
  });

  it('should show "All photos" overlay on the last thumbnail when there are more than 5 photos', () => {
    const photos = [
      'photo1.jpg',
      'photo2.jpg',
      'photo3.jpg',
      'photo4.jpg',
      'photo5.jpg',
      'photo6.jpg',
    ];

    render(
      <ImageGrid
        photos={photos}
        photosLoading={false}
        photosError={false}
        index={-1}
        setIndex={() => {}}
        slides={photos.map((src) => ({ src }))}
        apartmentTitle='Test Apartment'
      />,
    );

    expect(
      screen.getByText(`All photos (${photos.length})`),
    ).toBeInTheDocument();
  });

  it('should not show "All photos" overlay when there are 5 or fewer photos', () => {
    const photos = [
      'photo1.jpg',
      'photo2.jpg',
      'photo3.jpg',
      'photo4.jpg',
      'photo5.jpg',
    ];

    render(
      <ImageGrid
        photos={photos}
        photosLoading={false}
        photosError={false}
        index={-1}
        setIndex={() => {}}
        slides={photos.map((src) => ({ src }))}
        apartmentTitle='Test Apartment'
      />,
    );

    expect(
      screen.queryByText(`All photos (${photos.length})`),
    ).not.toBeInTheDocument();
  });

  it('should render the lightbox when index is >= 0', () => {
    const photos = ['photo1.jpg', 'photo2.jpg'];
    const slides = photos.map((src) => ({ src }));

    render(
      <ImageGrid
        photos={photos}
        photosLoading={false}
        photosError={false}
        index={1}
        setIndex={() => {}}
        slides={slides}
        apartmentTitle='Test Apartment'
      />,
    );

    expect(screen.getByTestId('lightbox')).toBeInTheDocument();
    expect(screen.getByTestId('lightbox')).toHaveAttribute('data-index', '1');
  });

  it('should not render the lightbox when index is negative', () => {
    const photos = ['photo1.jpg', 'photo2.jpg'];
    const slides = photos.map((src) => ({ src }));

    render(
      <ImageGrid
        photos={photos}
        photosLoading={false}
        photosError={false}
        index={-1}
        setIndex={() => {}}
        slides={slides}
        apartmentTitle='Test Apartment'
      />,
    );

    expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument();
  });
});
