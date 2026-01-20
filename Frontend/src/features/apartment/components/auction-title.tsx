export default function AuctionTitle({ title }: { title: string }) {
  return (
    <div className='flex flex-col items-start space-y-1'>
      <h2 className='bg-primary bg-clip-text text-2xl font-extrabold tracking-tight text-transparent'>
        {title}
      </h2>
      <div className='h-1 w-16 rounded-full bg-indigo-600' />
    </div>
  );
}
