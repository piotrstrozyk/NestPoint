'use client';

import { useFetchAuction } from '@/features/apartment/hooks/use-fetch-auction';
import { Client, Frame, IMessage } from '@stomp/stompjs';
import { useSession } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { toast } from 'sonner';
import AuctionBidForm from './auction-bid-form';
import AuctionMetricsGrid from './auction-metrics-grid';
import AuctionTitle from './auction-title';

type AuctionDetailsProps = {
  apartmentId: number;
  auctionId?: number;
};

let stompClient: Client | null = null;

export default function AuctionDetails({ apartmentId, auctionId }: AuctionDetailsProps) {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id || null;
  const { auction, loading, error } = useFetchAuction(auctionId ?? apartmentId);
  const isTenant = session?.user?.role?.includes('TENANT');

  const [currentHighestBid, setCurrentHighestBid] = useState<number | null>(
    null,
  );
  const [currentBidderCount, setCurrentBidderCount] = useState<number | null>(
    null,
  );
  const [currentHighestBidder, setCurrentHighestBidder] = useState<
    number | null
  >(null);

  // Track last bid time
  const [lastBidTime, setLastBidTime] = useState<Date | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const [connected, setConnected] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [wsStatus, setWsStatus] = useState<string>('');
  const [auctionStatus, setAuctionStatus] = useState<string>('');
  const joinedRef = useRef(false);

  const bidIncrement = auction?.minimumBidIncrement || 0;

  useEffect(() => {
    if (!auction) return;

    
    setCurrentBidderCount(auction.currentBidderCount);
    setCurrentHighestBidder(
      auction.bids.length > 0 ? auction.bids.at(-1)!.bidderId : null,
    );
    setAuctionStatus(auction.status);

    // Find this user's most recent bid
    if (userId !== null && auction && Array.isArray(auction.bids)) {
      const userBids = auction.bids.filter((b) => b.bidderId === userId);
      if (userBids.length > 0) {
        setLastBidTime(new Date(userBids.at(-1)!.bidTime));
      } else {
        setLastBidTime(null);
        setRemainingSeconds(0);
      }
    }

    joinedRef.current = false;
  }, [auction, userId]);

  useEffect(() => {
    if (
      sessionStatus !== 'authenticated' ||
      !session?.accessToken ||
      !auction ||
      auction.status === 'COMPLETED' ||
      joinedRef.current
    ) {
      return;
    }

    // open SockJS + STOMP
    const sock = new SockJS(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ws`);
    stompClient = new Client({
      webSocketFactory: () => sock,
      connectHeaders: { Authorization: `Bearer ${session.accessToken}` },
      onConnect: () => {
        setConnected(true);
        setWsStatus('Joined auction.');
        joinedRef.current = true;

        stompClient?.subscribe(
          `/topic/auction/${auction.id}/status`,
          (msg: IMessage) => {
            const { activeObservers, status, winningBidAmount, winningBidderId } = JSON.parse(msg.body);
            setCurrentHighestBid(winningBidAmount);
            setCurrentHighestBidder(winningBidderId);
            setCurrentBidderCount(activeObservers);
            setAuctionStatus(status);
          },
        );
        stompClient?.subscribe(
          `/topic/auction/${auction.id}/bids`,
          (msg: IMessage) => {
            const { bidderId, bidTime } = JSON.parse(msg.body);
            console.log('Received bid:', msg.body);
            //setCurrentHighestBid(bidAmount);
            setCurrentHighestBidder(bidderId);

            // If this user placed the bid, update their last bid time
            if (bidderId === userId) {
              setLastBidTime(new Date(bidTime));
            }
          },
        );

        // tell server we joined
        stompClient?.publish({
          destination: `/app/auction/${auction.id}/join`,
          body: JSON.stringify({ userId, auctionId: auction.id }),
        });
      },
      onStompError: (frame: Frame) => {
        setWsStatus(`Error: ${frame.headers.message}`);
      },
      onWebSocketError: () => {
        setWsStatus('WebSocket error.');
      },
      onDisconnect: () => {
        setConnected(false);
        setWsStatus('Disconnected.');
      },
    });

    stompClient.activate();

    return () => {
      if (stompClient && connected) {
        stompClient.deactivate();
        stompClient = null;
        setConnected(false);
      }
    };
  }, [
    auction,
    auction?.id,
    auction?.status,
    sessionStatus,
    session?.accessToken,
    isTenant,
    userId,
    connected,
  ]);

  // Countdown effect
  useEffect(() => {
    if (!lastBidTime) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastBidTime.getTime()) / 1000);
      const remaining = 15 * 60 - diff;
      setRemainingSeconds(remaining > 0 ? remaining : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastBidTime]);

  const placeBid = () => {
    if (!stompClient || !connected) {
      toast.error('No connection to auction.');
      return;
    }
    const amt = parseFloat(bidAmount);

    if (isNaN(amt)) {
      toast.error('Please enter a valid number for your bid.');
      return;
    }

    if (currentHighestBid !== null) {
      if (amt < currentHighestBid + bidIncrement) {
        toast.error(
          `Offer must exceed the highest bid by at least ${bidIncrement} zł.`,
        );
        return;
      }
    }

    const bidMsg = {
      bidderId: userId,
      bidAmount: amt,
      bidderUsername: session?.user.name,
      isAutoBid: false,
      maxAutoBidAmount: 0,
    };

    stompClient.publish({
      destination: `/app/auction/${auction?.id}/bid`,
      body: JSON.stringify(bidMsg),
    });

    toast.success(`Offer ${amt} zł sent.`);
    setBidAmount('');
  };

  // 3) Render logic
  if (loading) {
    return <p className='py-4 text-center'>Loading auction…</p>;
  }
  if (error || !auction) {
    return (
      <p className='py-4 text-center text-red-600'>
        Error loading auction details.
      </p>
    );
  }

  // format dates once
  interface Fmt {
    (iso: string): string;
  }

  const fmt: Fmt = (iso) =>
    new Date(iso).toLocaleString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // format remaining seconds to mm:ss
  const formatCountdown = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className='space-y-6 rounded-lg bg-white p-6 shadow-lg'>
      <AuctionTitle title={auction.apartmentTitle} />

      <AuctionMetricsGrid
        auction={auction}
        auctionStatus={auctionStatus}
        fmt={fmt}
        currentHighestBid={currentHighestBid}
        currentBidderCount={currentBidderCount}
        currentHighestBidder={currentHighestBidder}
        userId={userId}
      />

      {/* Show this bidder's cooldown */}
      {remainingSeconds > 0 && (
        <p className='text-sm text-blue-600'>
          Your next bid available in: {formatCountdown(remainingSeconds)}
        </p>
      )}

      {auctionStatus === 'ACTIVE' && isTenant && (
        <AuctionBidForm
          connected={connected}
          bidAmount={bidAmount}
          setBidAmount={setBidAmount}
          placeBid={placeBid}
          wsStatus={wsStatus}
          // disable form if still in cooldown
          disabled={remainingSeconds > 0}
        />
      )}

      {!(auctionStatus === 'ACTIVE' && isTenant) && (
        <p className='mt-4 text-sm text-gray-500'>
          {auctionStatus !== 'ACTIVE' && 'Auction is not active.'}
        </p>
      )}
    </div>
  );
}
