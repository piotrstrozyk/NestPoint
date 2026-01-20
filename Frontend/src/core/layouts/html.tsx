import { PublicEnvScript } from 'next-runtime-env';
import { DM_Sans } from 'next/font/google';

const dmSansFont = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
});

const HtmlLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html suppressHydrationWarning>
      <head>
        <PublicEnvScript />
      </head>
      <body className={dmSansFont.className}>{children}</body>
    </html>
  );
};

export default HtmlLayout;
