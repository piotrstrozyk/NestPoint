interface SubmitButtonProps {
  isValid: boolean;
  isSubmitting: boolean;
  label: string;
  submittingLabel: string;
}

export default function SubmitButton({
  isValid,
  isSubmitting,
  label,
  submittingLabel,
}: SubmitButtonProps) {
  return (
    <button
      type='submit'
      disabled={!isValid || isSubmitting}
      className='ml-30 rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50'
    >
      {isSubmitting ? submittingLabel : label}
    </button>
  );
}
