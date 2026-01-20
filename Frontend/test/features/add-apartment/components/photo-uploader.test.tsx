/* eslint-disable @next/next/no-img-element */
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import { PhotoUploader } from '../../../../src/features/add-apartment/components/photo-uploader';

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img {...props} alt={props.alt ?? ''} />
  ),
}));

// Mock URL.createObjectURL
const createObjectURLMock = vi.fn((file) => `blob:${file.name}`);
beforeAll(() => {
  vi.stubGlobal('URL', { createObjectURL: createObjectURLMock });
});
afterAll(() => {
  vi.unstubAllGlobals();
});

function createFile(name = 'photo.png', type = 'image/png') {
  return new File(['dummy'], name, { type });
}

describe('PhotoUploader', () => {
  it('renders the "Upload photos" label and the hidden file input', () => {
    render(
      <PhotoUploader
        selectedPhotos={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    // The label wrapping the input has text "Upload photos"
    expect(screen.getByLabelText(/upload photos/i)).toBeInTheDocument();
  });

  it('renders selected photos with remove buttons', () => {
    const files = [createFile('a.png'), createFile('b.jpg')];
    render(
      <PhotoUploader
        selectedPhotos={files}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    // Two <img> tags for previews
    expect(screen.getAllByRole('img')).toHaveLength(2);
    // Titles match filenames
    expect(screen.getByTitle('a.png')).toBeInTheDocument();
    expect(screen.getByTitle('b.jpg')).toBeInTheDocument();
  });

  it('calls onAdd when files are selected through the input', () => {
    const onAdd = vi.fn();
    render(
      <PhotoUploader
        selectedPhotos={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    const input = screen.getByLabelText(/upload photos/i) as HTMLInputElement;
    const files = [createFile('x.png'), createFile('y.jpg')];
    fireEvent.change(input, {
      target: { files },
    });
    expect(onAdd).toHaveBeenCalledWith(files);
  });

  it('calls onAdd with empty array when change event has no files', () => {
    const onAdd = vi.fn();
    render(
      <PhotoUploader
        selectedPhotos={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    const input = screen.getByLabelText(/upload photos/i) as HTMLInputElement;
    // Simulate change with null files
    fireEvent.change(input, {
      target: { files: null },
    });
    expect(onAdd).toHaveBeenCalledWith([]);
  });

  it('calls onClear when the Clear All button is clicked', () => {
    const onClear = vi.fn();
    const files = [createFile('a.png')];
    render(
      <PhotoUploader
        selectedPhotos={files}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onClear={onClear}
      />,
    );
    // The "Clear All" button only appears when there's at least one photo
    const clearButton = screen.getByRole('button', { name: /clear all/i });
    fireEvent.click(clearButton);
    expect(onClear).toHaveBeenCalled();
  });

  it('calls onAdd with dropped image files', () => {
    const onAdd = vi.fn();
    render(
      <PhotoUploader
        selectedPhotos={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    const dropZone = screen.getByText(/upload photos/i).closest('div');
    const file = createFile('dropped.png');
    const data = {
      dataTransfer: {
        files: [file],
        length: 1,
      },
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };
    fireEvent.dragEnter(dropZone!, data);
    fireEvent.dragOver(dropZone!, data);
    fireEvent.drop(dropZone!, {
      ...data,
      dataTransfer: { files: [file], length: 1 },
    });
    expect(onAdd).toHaveBeenCalledWith([file]);
  });

  it('does not call onAdd if dropped files are not images', () => {
    const onAdd = vi.fn();
    render(
      <PhotoUploader
        selectedPhotos={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    const dropZone = screen.getByText(/upload photos/i).closest('div');
    const file = new File(['dummy'], 'not-image.txt', { type: 'text/plain' });
    const data = {
      dataTransfer: {
        files: [file],
        length: 1,
      },
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };
    fireEvent.drop(dropZone!, {
      ...data,
      dataTransfer: { files: [file], length: 1 },
    });
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('shows Add More button and triggers file input on click', () => {
    const files = [createFile('a.png')];
    render(
      <PhotoUploader
        selectedPhotos={files}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    const addMore = screen.getByText(/add more/i).closest('div');
    // Simulate click
    const input = screen.getByLabelText(/upload photos/i);
    const clickSpy = vi.spyOn(input, 'click');
    fireEvent.click(addMore!);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('shows "Drop Here" text when dragging over Add More', () => {
    const files = [createFile('a.png')];
    render(
      <PhotoUploader
        selectedPhotos={files}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    const addMore = screen.getByText(/add more/i).closest('div');
    fireEvent.dragEnter(addMore!);
    // Now "Drop Here" should be visible
    expect(screen.getByText(/drop here/i)).toBeInTheDocument();
  });

  it('removes drag state on drag leave', () => {
    render(
      <PhotoUploader
        selectedPhotos={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    const dropZone = screen.getByText(/upload photos/i).closest('div');
    // Drag enter to set isDragging true
    fireEvent.dragEnter(dropZone!);
    // Drag leave to set isDragging false
    fireEvent.dragLeave(dropZone!);
    // The drop zone should not have the drag style
    expect(dropZone).not.toHaveClass('border-indigo-600', 'bg-indigo-50');
  });

  it('does not change drag state if already dragging on drag over', () => {
    render(
      <PhotoUploader
        selectedPhotos={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    const dropZone = screen.getByText(/upload photos/i).closest('div');
    // Drag enter to set isDragging true
    fireEvent.dragEnter(dropZone!);
    // Drag over while already dragging
    fireEvent.dragOver(dropZone!);
    // The drop zone should still have the drag style
    expect(dropZone).toHaveClass(
      'flex',
      'flex-col',
      'items-center',
      'text-sm',
      'text-gray-600',
    );
  });

  it('does not change drag state if already dragging on drag over (outer drop zone)', () => {
    render(
      <PhotoUploader
        selectedPhotos={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    // Get the outer drop zone
    const flexDiv = screen.getByText(/upload photos/i).closest('div');
    const dropZone = flexDiv?.parentElement?.parentElement;
    // Drag enter to set isDragging true
    fireEvent.dragEnter(dropZone!);
    // Drag over while already dragging
    fireEvent.dragOver(dropZone!);
    // The drop zone should still have the drag style
    expect(dropZone).toHaveClass('border-indigo-600', 'bg-indigo-50');
  });

  it('does not call onAdd if handleDrop is called with no files', () => {
    const onAdd = vi.fn();
    render(
      <PhotoUploader
        selectedPhotos={[]}
        onAdd={onAdd}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    const dropZone = screen.getByText(/upload photos/i).closest('div');
    const data = {
      dataTransfer: {
        files: [],
        length: 0,
      },
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    };
    fireEvent.drop(dropZone!, data);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('applies drag style to Add More drop zone', () => {
    const files = [createFile('a.png')];
    render(
      <PhotoUploader
        selectedPhotos={files}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    const addMore = screen.getByText(/add more/i).closest('div');
    fireEvent.dragEnter(addMore!);
    expect(addMore).toHaveClass('border-indigo-600', 'bg-indigo-50');
    fireEvent.dragLeave(addMore!);
    expect(addMore).not.toHaveClass('border-indigo-600', 'bg-indigo-50');
  });

  it('does not render photo grid when selectedPhotos is empty', () => {
    render(
      <PhotoUploader
        selectedPhotos={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    // The photo grid should not be in the document
    expect(screen.queryByText(/selected photos/i)).not.toBeInTheDocument();
  });

  it('renders truncated file name if name is longer than 20 chars', () => {
    const longName = 'averyveryverylongfilename.png';
    const files = [createFile(longName)];
    render(
      <PhotoUploader
        selectedPhotos={files}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    // The truncated name should be rendered
    expect(screen.getByText('averyveryverylong...')).toBeInTheDocument();
  });

  it('does not change drag state if already dragging on drag over (Add More drop zone)', () => {
    const files = [createFile('a.png')];
    render(
      <PhotoUploader
        selectedPhotos={files}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    const addMore = screen.getByText(/add more/i).closest('div');
    // Drag enter to set isDragging true
    fireEvent.dragEnter(addMore!);
    // Drag over while already dragging
    fireEvent.dragOver(addMore!);
    // The Add More drop zone should still have the drag style
    expect(addMore).toHaveClass('border-indigo-600', 'bg-indigo-50');
  });

  it('sets drag state on drag over (Add More drop zone, isDragging false)', () => {
    const files = [createFile('a.png')];
    render(
      <PhotoUploader
        selectedPhotos={files}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    const addMore = screen.getByText(/add more/i).closest('div');
    // Drag over with isDragging false (initial state)
    fireEvent.dragOver(addMore!);
    // The Add More drop zone should now have the drag style
    expect(addMore).toHaveClass('border-indigo-600', 'bg-indigo-50');
  });

  it('triggers file input click when Select Files button is clicked', () => {
    render(
      <PhotoUploader
        selectedPhotos={[]}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );
    const input = screen.getByLabelText(/upload photos/i);
    const clickSpy = vi.spyOn(input, 'click');
    const selectFilesBtn = screen.getByRole('button', {
      name: /select files/i,
    });
    fireEvent.click(selectFilesBtn);
    expect(clickSpy).toHaveBeenCalled();
  });
});
