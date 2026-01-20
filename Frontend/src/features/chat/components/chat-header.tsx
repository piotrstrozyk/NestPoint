import { DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ChatHeaderProps {
  senderName: string;
  onClose: () => void;
}

export default function ChatHeader({ senderName, onClose }: ChatHeaderProps) {
  return (
    <div className='flex items-center justify-between border-b p-4 dark:border-gray-700'>
      <DialogTitle className='text-lg font-semibold text-gray-900 dark:text-gray-100'>
        Chat with {senderName}
      </DialogTitle>
      <button
        onClick={onClose}
        className='rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700'
      >
        <XMarkIcon className='h-5 w-5 text-gray-600 dark:text-gray-300' />
      </button>
    </div>
  );
}
