import NestIcon from '@/core/components/svg/nest-2';

interface MenuItem {
  title: string;
  links: {
    text: string;
    url: string;
  }[];
}

interface Footer2Props {
  logo?: {
    url: string;
    alt: string;
    title: string;
  };
  tagline?: string;
  menuItems?: MenuItem[];
  copyright?: string;
  bottomLinks?: {
    text: string;
    url: string;
  }[];
}

const Footer = ({
  logo = {
    alt: 'NestPoint Logo',
    title: 'NestPoint.com',
    url: 'http://localhost:3000/',
  },
  tagline = 'Shelter for the masses.',
  menuItems = [
    {
      title: 'Explore',
      links: [
        { text: 'Home', url: '#' },
        { text: 'Active listings', url: '/apartment-list' },
        { text: 'View Map', url: '/apartment-list?map=true' },
      ],
    },
    {
      title: 'Company',
      links: [{ text: 'FAQ', url: '/faq' }],
    },
    {
      title: 'Contact',
      links: [
        { text: 'prezes.szef@studms.ug.edu.pl', url: '#' },
        { text: 'tel. (22) 695–12–04 ', url: '#' },
      ],
    },
  ],
  copyright = '© 2025 NestPoint.com. All rights reserved.',
  bottomLinks = [
    { text: 'Terms and Conditions', url: '#' },
    { text: 'Privacy Policy', url: '#' },
  ],
}: Footer2Props) => {
  return (
    <section className='mx-auto w-full border-t-2 bg-zinc-50 px-24 pt-8 pb-6'>
      <div>
        <footer className='mx-auto max-w-(--page-container)'>
          <div className='mx-auto grid max-w-(--page-container) grid-cols-2 gap-8 lg:grid-cols-6'>
            <div className='col-span-2 mb-8 lg:mb-0'>
              <div className='flex items-center gap-2 lg:justify-start'>
                <a href={logo.url}>
                  <NestIcon className='h-32 w-auto' />
                </a>
                <p className='text-xl font-semibold'>{logo.title}</p>
              </div>
              <p className='mt-4 font-bold'>{tagline}</p>
            </div>
            {menuItems.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className='mb-4 font-bold'>{section.title}</h3>
                <ul className='text-muted-foreground space-y-4'>
                  {section.links.map((link, linkIdx) => (
                    <li
                      key={linkIdx}
                      className='hover:text-primary font-medium'
                    >
                      <a href={link.url}>{link.text}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className='text-muted-foreground mt-12 flex flex-col justify-between gap-4 border-t pt-8 text-sm font-medium md:flex-row md:items-center'>
            <p>{copyright}</p>
            <ul className='flex gap-4'>
              {bottomLinks.map((link, linkIdx) => (
                <li key={linkIdx} className='hover:text-primary underline'>
                  <a href={link.url}>{link.text}</a>
                </li>
              ))}
            </ul>
          </div>
        </footer>
      </div>
    </section>
  );
};

export { Footer };
