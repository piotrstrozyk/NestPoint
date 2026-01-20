'use client';

import { Search as SearchIcon } from 'lucide-react';
import { FormEvent, useState } from 'react';

const Search = () => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Searching for:', query);
  };

  return (
    <form onSubmit={handleSearch} className='flex items-center space-x-2'>
      <div className='relative w-full'>
        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search...'
          className='w-full rounded-md border border-gray-300 bg-zinc-50 py-2 pr-10 pl-3 text-sm text-gray-900 placeholder-gray-400'
        />
        <span className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
          <SearchIcon className='h-5 w-5 text-gray-500' />
        </span>
      </div>
    </form>
  );
};

export default Search;
