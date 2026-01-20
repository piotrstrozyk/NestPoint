import Nest1Icon from '@/core/components/svg/nest-1';

const HeroSection = () => {
  return (
    <section className='bg-primary flex min-h-screen w-full flex-col justify-between p-4 pt-32'>
      {/* Top */}
      <div className='ml-4 w-1/4 sm:ml-16'>
        <h1 className='font-serif text-[4rem] font-bold text-white sm:text-[5rem] md:text-[8rem]'>
          NestPoint
        </h1>
      </div>

      {/* Bottom */}
      <div className='flex items-end justify-between'>
        <div className='mb-64 ml-4 w-[24rem] sm:ml-16 lg:mb-16 xl:w-[32rem]'>
          <h2 className='text-[3rem] text-white md:text-[4rem] xl:text-[5rem]'>
            Shelter For The Masses
          </h2>
        </div>
        <div>
          <Nest1Icon
            className='absolute right-12 bottom-12 h-[12rem] w-[12rem] sm:h-[18rem] sm:w-[18rem] lg:h-[28rem] lg:w-[28rem] xl:h-[32rem] xl:w-[32rem] 2xl:right-4 2xl:bottom-0 2xl:h-[48rem] 2xl:w-[48rem]'
            fill='white'
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
