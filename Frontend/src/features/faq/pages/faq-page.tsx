import FAQIcon from '@/core/components/svg/faq';
import FAQ from '@/features/faq/components/faq';

export default function FAQPage() {
  return (
    <div className='mx-auto my-24 flex w-1/2 max-w-(--page-container) flex-col justify-center gap-4 p-2 pb-14 sm:gap-4 sm:p-8 sm:pb-4'>
      <FAQIcon className='mx-auto flex w-full' />
      <FAQ />
    </div>
  );
}
