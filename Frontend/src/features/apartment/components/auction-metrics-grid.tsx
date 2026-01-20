import AuctionStatusBadge from './auction-status-badge';
import { Calendar, Clock, User, Gift } from 'lucide-react';

interface Fmt {
  (iso: string): string;
}

interface Auction {
  status: string;
  startTime: string;
  endTime: string;
  rentalStartDate: string;
  rentalEndDate: string;
  startingPrice: number;
  bids: { bidderId: string | number; amount: number }[];
}

type AuctionMetricsGridProps = {
  auction: Auction;
  fmt: Fmt;
  currentHighestBid: number | null;
  currentBidderCount: number | null;
  currentHighestBidder: number | null;
  userId: string | number | null;
  auctionStatus: string;
};

export default function AuctionMetricsGrid({
  auction,
  auctionStatus,
  fmt,
  currentHighestBid,
  currentBidderCount,
  currentHighestBidder,
  userId,
}: AuctionMetricsGridProps) {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Auction Overview</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status */}
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-gray-700">Status:</span>
          <AuctionStatusBadge status={auctionStatus} />
        </div>

        {/* Start Time */}
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Start</p>
            <p className="font-medium text-gray-800">{fmt(auction.startTime)}</p>
          </div>
        </div>

        {/* End Time */}
        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-gray-500 rotate-180" />
          <div>
            <p className="text-sm text-gray-500">End</p>
            <p className="font-medium text-gray-800">{fmt(auction.endTime)}</p>
          </div>
        </div>

        {/* Rental Start */}
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Rental Start</p>
            <p className="font-medium text-gray-800">{fmt(auction.rentalStartDate)}</p>
          </div>
        </div>

        {/* Rental End */}
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-sm text-gray-500">Rental End</p>
            <p className="font-medium text-gray-800">{fmt(auction.rentalEndDate)}</p>
          </div>
        </div>

        {/* Starting Price */}
        <div className="flex items-center space-x-3">
          <Gift className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-sm text-gray-500">Starting Price</p>
            <p className="font-medium text-gray-800">{auction.startingPrice} zł</p>
          </div>
        </div>

        {/* Highest Bid */}
        <div className="flex items-center space-x-3">
          <User className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Highest Bid</p>
            {currentHighestBid != null && currentHighestBid > auction.startingPrice ? (
              <>
                <p className="font-medium text-gray-800">{currentHighestBid} zł</p>
                {currentHighestBidder && userId === currentHighestBidder && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold text-green-600 bg-green-100 rounded-full">
                    You are winning!
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-gray-400">No bidders yet</span>
            )}
          </div>
        </div>

        {/* Observers */}
        <div className="flex items-center space-x-3">
          <User className="w-5 h-5 text-indigo-500" />
          <div>
            <p className="text-sm text-gray-500">Observing</p>
            {currentBidderCount != null && currentBidderCount > 0 ? (
              <p className="font-medium text-gray-800">{currentBidderCount}</p>
            ) : (
              <span className="text-sm text-gray-400">No observers yet</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
