'use client';

import NestIcon from '@/core/components/svg/nest-2';
import { Button, buttonVariants } from '@/core/components/ui/button';
import ChatButton from '@/features/chat/components/chat-button';
import { Menu, User2, X } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const handleLoginClick = () => {
    if (status === 'unauthenticated') {
      window.location.href = '/login';
    } else {
      toast.success('Already signed in!');
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  // Determine profile link based on user role
  const getProfileLink = () => {
    if (!session?.user?.role) return '/profile';

    if (session.user.role.includes('OWNER')) {
      return '/owner-profile';
    } else if (session.user.role.includes('TENANT')) {
      return '/tenant-profile';
    } else if (session.user.role.includes('ADMIN')) {
      return '/admin-panel';
    } else {
      return '/profile';
    }
  };

  const profileLink = getProfileLink();

  return (
    <nav className='fixed inset-x-0 top-0 z-50 bg-zinc-50 shadow-md'>
      <div className='mx-auto px-4 sm:px-6 lg:px-6'>
        <div className='flex h-16 items-center justify-between'>
          {/* Logo */}
          <Link href='/' className='flex items-center'>
            <NestIcon className='text-primary w-17' />
            <span className='text-primary ml-2 hidden text-2xl font-bold md:inline'>
              NestPoint
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className='hidden items-center justify-center space-x-2 md:flex'>
            <Link
              href='/apartment-list'
              className={buttonVariants({ variant: 'ghostPrimary' })}
            >
              Listings
            </Link>
            <Link
              href='/faq'
              className={buttonVariants({ variant: 'ghostPrimary' })}
            >
              FAQ
            </Link>

            {status === 'loading' && <span>Loading…</span>}

            {session ? (
              <div className='flex items-center space-x-4'>
                {session.user?.role?.includes('OWNER') && (
                  <Link
                    href='/add-apartment'
                    className={buttonVariants({
                      variant: 'indigoGreen',
                    })}
                  >
                    Add Apartment
                  </Link>
                )}
                <Link
                  href={profileLink}
                  className={buttonVariants({
                    variant: 'pill',
                  })}
                >
                  <User2 className='h-4 w-4 opacity-90' />
                  <span>{session.user?.name}</span>
                </Link>

                <ChatButton />

                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                  variant='logoutPill'
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handleLoginClick();
                }}
                variant='loginPill'
              >
                Login
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className='flex items-center gap-3 md:hidden'>
            <ChatButton />
            <button
              onClick={toggleMenu}
              aria-label='Toggle menu'
              className='focus:ring-primary rounded-full p-2 transition hover:bg-zinc-200 focus:ring-2 focus:outline-none'
            >
              {isOpen ? (
                <X className='hover:text-primary h-6 w-6 text-zinc-800 transition-colors' />
              ) : (
                <Menu className='hover:text-primary h-6 w-6 text-zinc-800 transition-colors' />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className='animate-slide-down absolute top-18 right-6 z-40 overflow-hidden rounded-lg bg-white/60 shadow-lg backdrop-blur-md md:hidden'>
          <div className='flex flex-col space-y-4 px-14 py-6'>
            <Link
              href='/apartment-list'
              className={buttonVariants({ variant: 'ghostPrimary' })}
            >
              Listings
            </Link>
            <Link
              href='/faq'
              className={buttonVariants({ variant: 'ghostPrimary' })}
            >
              FAQ
            </Link>

            {status === 'loading' && (
              <span className='block px-3 py-2 text-zinc-500'>Loading…</span>
            )}

            {session ? (
              <>
                <Link
                  href={profileLink}
                  className={buttonVariants({
                    variant: 'pill',
                  })}
                >
                  <User2 className='h-4 w-4 opacity-90' />
                  <span>{session.user?.name}</span>
                </Link>
                {session.user?.role?.includes('OWNER') && (
                  <Link
                    href='/add-apartment'
                    className={buttonVariants({
                      variant: 'indigoGreen',
                    })}
                  >
                    Add Apartment
                  </Link>
                )}
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                  variant='logoutPill'
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  handleLoginClick();
                }}
                variant='loginPill'
              >
                Login
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
