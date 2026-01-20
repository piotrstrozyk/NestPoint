import { render } from '@testing-library/react';
import Nest2icon from '../../../../src/core/components/svg/nest-2';

describe('Nest2icon', () => {
  it('renders an SVG element', () => {
    const { container } = render(<Nest2icon />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies given props to the SVG', () => {
    const { container } = render(
      <Nest2icon className='custom-class' data-testid='nest-2-icon' />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('matches snapshot', () => {
    const { container } = render(<Nest2icon />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
