import { render } from '@testing-library/react';
import FindSVG from '../../../../src/core/components/svg/find';

describe('FindSVG', () => {
  it('renders an SVG element', () => {
    const { container } = render(<FindSVG />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies given props to the SVG', () => {
    const { container } = render(
      <FindSVG className='custom-class' data-testid='find-svg' />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
    expect(svg).toHaveAttribute('data-testid', 'find-svg');
  });

  it('renders circles with expected attributes', () => {
    const { container } = render(<FindSVG />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThanOrEqual(2);
    expect(circles[0]).toHaveAttribute('cx', '248.187');
    expect(circles[0]).toHaveAttribute('cy', '325.819');
    expect(circles[0]).toHaveAttribute('r', '44.682');
    expect(circles[1]).toHaveAttribute('cx', '157.782');
    expect(circles[1]).toHaveAttribute('cy', '197.087');
    expect(circles[1]).toHaveAttribute('r', '90.087');
  });

  it('matches snapshot', () => {
    const { container } = render(<FindSVG />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
