import { Metadata } from 'next';

const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: `NestPoint`,
    description: 'Property rental management system',
    icons: {
      icon: '/favicon.ico',
      apple: '/apple-icon.webp',
    },
  };
};

export default generateMetadata;
