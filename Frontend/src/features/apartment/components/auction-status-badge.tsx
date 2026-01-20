type StatusBadgeProps = {
  status: string;
};

export default function AuctionStatusBadge({ status }: StatusBadgeProps) {
  const statusClasses =
    status === 'ACTIVE'
      ? 'bg-green-100 text-green-700'
      : status === 'PENDING'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-gray-100 text-gray-600';

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${statusClasses}`}
    >
      {status}
    </span>
  );
}
