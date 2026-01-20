import { ReactNode } from 'react';

interface AuthContainerProps {
  children: ReactNode;
  title: string;
}

export function AuthContainer({ children, title }: AuthContainerProps) {
  return (
    <div className='bg-primary flex min-h-screen items-center justify-center'>
      <div className='w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg'>
        <h2 className='text-center text-3xl font-bold text-gray-900'>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
