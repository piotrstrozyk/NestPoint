import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className='flex items-center space-x-2 border-t p-4 dark:border-gray-700'>
      <textarea
        rows={1}
        className='min-h-0 flex-1 resize-none rounded-full border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-300 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder='Type a message…'
      />
      <button
        onClick={handleSend}
        disabled={!input.trim()}
        className='disabled:bg-primary/50 rounded-full bg-[#b93242] p-2 hover:bg-[#b932428f] disabled:cursor-not-allowed'
      >
        <PaperAirplaneIcon className='h-5 w-5 text-white' />
      </button>
    </div>
  );
}
