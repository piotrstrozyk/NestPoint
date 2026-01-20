import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/core/components/ui/card';
import { render, screen } from '@testing-library/react';

describe('Card', () => {
  it('renders Card with data-slot', () => {
    render(<Card>Card Content</Card>);
    const card = screen.getByText('Card Content').closest('[data-slot="card"]');
    expect(card).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Card className='custom-class'>Card Content</Card>);
    const card = screen.getByText('Card Content').closest('[data-slot="card"]');
    expect(card).toHaveClass('custom-class');
  });
});

describe('CardHeader', () => {
  it('renders CardHeader with data-slot', () => {
    render(<CardHeader>Header</CardHeader>);
    const header = screen
      .getByText('Header')
      .closest('[data-slot="card-header"]');
    expect(header).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CardHeader className='header-class'>Header</CardHeader>);
    const header = screen
      .getByText('Header')
      .closest('[data-slot="card-header"]');
    expect(header).toHaveClass('header-class');
  });
});

describe('CardTitle', () => {
  it('renders CardTitle with data-slot', () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByText('Title').closest('[data-slot="card-title"]');
    expect(title).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CardTitle className='title-class'>Title</CardTitle>);
    const title = screen.getByText('Title').closest('[data-slot="card-title"]');
    expect(title).toHaveClass('title-class');
  });
});

describe('CardDescription', () => {
  it('renders CardDescription with data-slot', () => {
    render(<CardDescription>Description</CardDescription>);
    const desc = screen
      .getByText('Description')
      .closest('[data-slot="card-description"]');
    expect(desc).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <CardDescription className='desc-class'>Description</CardDescription>,
    );
    const desc = screen
      .getByText('Description')
      .closest('[data-slot="card-description"]');
    expect(desc).toHaveClass('desc-class');
  });
});

describe('CardAction', () => {
  it('renders CardAction with data-slot', () => {
    render(<CardAction>Action</CardAction>);
    const action = screen
      .getByText('Action')
      .closest('[data-slot="card-action"]');
    expect(action).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CardAction className='action-class'>Action</CardAction>);
    const action = screen
      .getByText('Action')
      .closest('[data-slot="card-action"]');
    expect(action).toHaveClass('action-class');
  });
});

describe('CardContent', () => {
  it('renders CardContent with data-slot', () => {
    render(<CardContent>Content</CardContent>);
    const content = screen
      .getByText('Content')
      .closest('[data-slot="card-content"]');
    expect(content).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CardContent className='content-class'>Content</CardContent>);
    const content = screen
      .getByText('Content')
      .closest('[data-slot="card-content"]');
    expect(content).toHaveClass('content-class');
  });
});

describe('CardFooter', () => {
  it('renders CardFooter with data-slot', () => {
    render(<CardFooter>Footer</CardFooter>);
    const footer = screen
      .getByText('Footer')
      .closest('[data-slot="card-footer"]');
    expect(footer).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CardFooter className='footer-class'>Footer</CardFooter>);
    const footer = screen
      .getByText('Footer')
      .closest('[data-slot="card-footer"]');
    expect(footer).toHaveClass('footer-class');
  });
});
