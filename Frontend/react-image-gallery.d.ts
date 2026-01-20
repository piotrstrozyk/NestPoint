declare module 'react-image-gallery' {
  import * as React from 'react';

  export interface ReactImageGalleryItem {
    original: string;
    thumbnail?: string;
    originalAlt?: string;
    thumbnailAlt?: string;
    description?: string;
    renderItem?: () => React.ReactNode;
    renderThumbInner?: () => React.ReactNode;
    originalClass?: string;
    thumbnailClass?: string;
    imageSet?: Array<{ srcSet: string; media: string }>;
    srcSet?: string;
    sizes?: string;
  }

  export interface ReactImageGalleryProps {
    items: ReactImageGalleryItem[];
    showNav?: boolean;
    showFullscreenButton?: boolean;
    showPlayButton?: boolean;
    showThumbnails?: boolean;
    showBullets?: boolean;
    showIndex?: boolean;
    autoPlay?: boolean;
    lazyLoad?: boolean;
    infinite?: boolean;
    additionalClass?: string;
    renderItem?: (item: ReactImageGalleryItem) => React.ReactNode;
    renderLeftNav?: (
      onClick?: React.MouseEventHandler<HTMLButtonElement>,
    ) => React.ReactNode;
    renderRightNav?: (
      onClick?: React.MouseEventHandler<HTMLButtonElement>,
    ) => React.ReactNode;
    renderBullet?: (index: number, isActive: boolean) => React.ReactNode;
    onSlide?: (currentIndex: number) => void;
    onScreenChange?: (fullScreenElement: boolean) => void;
    onPause?: (currentIndex: number) => void;
    onPlay?: (currentIndex: number) => void;
    onClick?: (event: React.MouseEvent) => void;
    onImageLoad?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
    onImageError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
    onThumbnailError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
    onThumbnailClick?: (event: React.MouseEvent, index: number) => void;
    startIndex?: number;
    slideDuration?: number;
    slideInterval?: number;
    slideOnThumbnailOver?: boolean;
    disableThumbnailScroll?: boolean;
    disableKeyDown?: boolean;
    flickThreshold?: number;
    swipingTransitionDuration?: number;
    renderCustomControls?: () => React.ReactNode;
    renderThumbInner?: (item: ReactImageGalleryItem) => React.ReactNode;
    stopPropagation?: boolean;
  }

  export default class ReactImageGallery extends React.Component<ReactImageGalleryProps> {}
}
