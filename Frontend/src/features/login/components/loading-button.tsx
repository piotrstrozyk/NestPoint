interface LoadingButtonProps {
  isLoading: boolean;
  disabled: boolean;
  loadingText: string;
  text: string;
  type?: 'button' | 'submit' | 'reset';
}

export function LoadingButton({
  isLoading,
  disabled,
  loadingText,
  text,
  type = 'submit',
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className='w-full rounded bg-indigo-600 py-2 text-white disabled:opacity-50'
    >
      {isLoading ? loadingText : text}
    </button>
  );
}
