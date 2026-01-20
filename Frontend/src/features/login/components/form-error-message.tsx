interface FormErrorMessageProps {
  message: string | null;
}

export function FormErrorMessage({ message }: FormErrorMessageProps) {
  if (!message) return null;

  return <p className='text-center text-red-500'>{message}</p>;
}
