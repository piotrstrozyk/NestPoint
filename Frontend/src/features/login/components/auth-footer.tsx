import Link from 'next/link';

interface AuthFooterProps {
  text: string;
  linkText: string;
  linkHref: string;
}

export function AuthFooter({ text, linkText, linkHref }: AuthFooterProps) {
  return (
    <p className='text-center text-sm text-gray-600'>
      {text}{' '}
      <Link href={linkHref} className='text-indigo-600 hover:underline'>
        {linkText}
      </Link>
    </p>
  );
}
