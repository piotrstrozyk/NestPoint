import { render } from '@testing-library/react';
import Plus from '../../../../src/core/components/svg/plus';

describe('Plus', () => {
  it('renders an SVG element', () => {
    const { container } = render(<Plus />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('has correct width, height, and viewBox', () => {
    const { container } = render(<Plus />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '28');
    expect(svg).toHaveAttribute('height', '29');
    expect(svg).toHaveAttribute('viewBox', '0 0 28 29');
  });

  it('applies className prop', () => {
    const { container } = render(<Plus className='test-class' />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('test-class');
  });

  it('applies fill and strokeWidth props', () => {
    const { container } = render(<Plus fill='red' strokeWidth='3' />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('fill', 'red');
  });

  it('renders two path elements with correct d attributes', () => {
    const { container } = render(<Plus />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(2);
    expect(paths[0]).toHaveAttribute('d', 'M14 6.33331V22.6666');
    expect(paths[1]).toHaveAttribute('d', 'M5.83337 14.5H22.1667');
  });

  it('matches snapshot', () => {
    const { container } = render(<Plus />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
