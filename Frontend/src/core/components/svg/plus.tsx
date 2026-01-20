interface PlusProps {
  className?: string;
  fill?: string;
  strokeWidth?: string;
}

const Plus = ({ className, fill = 'none', strokeWidth = '1.5' }: PlusProps) => {
  return (
    <svg
      className={className}
      width='28'
      height='29'
      viewBox='0 0 28 29'
      fill={fill}
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M14 6.33331V22.6666'
        stroke='currentColor'
        strokeWidth={strokeWidth}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M5.83337 14.5H22.1667'
        stroke='currentColor'
        strokeWidth={strokeWidth}
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
};

export default Plus;
