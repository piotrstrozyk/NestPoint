import FAQIcon from '@/core/components/svg/faq';
import { render } from '@testing-library/react';

describe('FAQIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<FAQIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies the given className to the SVG', () => {
    const { container } = render(<FAQIcon className='test-class' />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('test-class');
  });

  it('renders a circle with expected attributes', () => {
    const { container } = render(<FAQIcon />);
    const circle = container.querySelector('circle');
    expect(circle).toBeInTheDocument();
    expect(circle).toHaveAttribute('cx', '276.039');
    expect(circle).toHaveAttribute('cy', '51');
    expect(circle).toHaveAttribute('r', '51');
    expect(circle).toHaveAttribute('fill', '#ff6584');
  });

  it('matches snapshot', () => {
    const { container } = render(<FAQIcon />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
