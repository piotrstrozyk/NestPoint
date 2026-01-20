import { Label } from '@/core/components/ui/label';
import { render, screen } from '@testing-library/react';
import * as React from 'react';

describe('Label', () => {
  it('renders children', () => {
    render(<Label>Test Label</Label>);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Label className='custom-class'>Label</Label>);
    const label = screen.getByText('Label');
    expect(label).toHaveClass('custom-class');
  });

  it('sets htmlFor attribute', () => {
    render(<Label htmlFor='input-id'>Label</Label>);
    const label = screen.getByText('Label');
    expect(label).toHaveAttribute('for', 'input-id');
  });

  it('forwards ref to DOM element', () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Label</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });
});
