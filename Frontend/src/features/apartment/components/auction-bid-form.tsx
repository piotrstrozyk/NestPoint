import { Dispatch, SetStateAction } from 'react';

type AuctionBidFormProps = {
  connected: boolean;
  bidAmount: string;
  setBidAmount: Dispatch<SetStateAction<string>>;
  placeBid: () => void;
  wsStatus: string;
  disabled?: boolean;
};

export default function AuctionBidForm({
  connected,
  bidAmount,
  setBidAmount,
  placeBid,
  wsStatus,
  disabled,
}: AuctionBidFormProps) {
  return (
    <div className='mt-6 space-y-4'>
      <p className='text-sm text-gray-600'>
        {connected ? 'Connected to auction. Place your bid:' : 'Connecting...'}
      </p>

      <div className='flex flex-col gap-2 sm:flex-row'>
        <input
          type='number'
          min='0'
          step='1'
          placeholder='Your offer (zł)'
          value={bidAmount}
          onChange={(e) => setBidAmount(e.target.value)}
          className='flex-1 rounded-lg border-gray-300 bg-gray-50 p-2 focus:border-indigo-500 focus:ring-indigo-500'
        />
        <button
          onClick={placeBid}
          disabled={!connected || !bidAmount || disabled}
          className='w-full rounded-lg bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:opacity-50 sm:w-1/3'
        >
          Place bid
        </button>
      </div>

      {wsStatus && <p className='text-sm text-gray-500 italic'>{wsStatus}</p>}
    </div>
  );
}
