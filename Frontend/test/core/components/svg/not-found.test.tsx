import { render } from '@testing-library/react';
import NotFoundIcon from '../../../../src/core/components/svg/not-found';

describe('NotFoundIcon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<NotFoundIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('has correct width, height, and viewBox', () => {
    const { container } = render(<NotFoundIcon />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '750');
    expect(svg).toHaveAttribute('height', '500');
    expect(svg).toHaveAttribute('viewBox', '0 0 750 500');
  });

  it('contains key SVG groups by id', () => {
    const { container } = render(<NotFoundIcon />);
    expect(container.querySelector('g#Background_Simple')).toBeInTheDocument();
    expect(container.querySelector('g#Birds')).toBeInTheDocument();
    expect(container.querySelector('g#Clouds')).toBeInTheDocument();
    expect(container.querySelector('g#Mountains')).toBeInTheDocument();
    expect(container.querySelector('g#Text')).toBeInTheDocument();
  });

  it('forwards props to the SVG element', () => {
    const { container } = render(
      <NotFoundIcon className='test-class' data-testid='notfound-svg' />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('test-class');
    expect(svg).toHaveAttribute('data-testid', 'notfound-svg');
  });

  it('matches snapshot', () => {
    const { container } = render(<NotFoundIcon />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
