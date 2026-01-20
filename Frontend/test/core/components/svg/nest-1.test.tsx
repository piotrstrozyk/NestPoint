import { render } from '@testing-library/react';
import Nest1icon from '../../../../src/core/components/svg/nest-1';

describe('Nest1icon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<Nest1icon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies given props to the SVG', () => {
    const { container } = render(
      <Nest1icon className='custom-class' data-testid='nest-1-icon' />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('matches snapshot', () => {
    const { container } = render(<Nest1icon />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
