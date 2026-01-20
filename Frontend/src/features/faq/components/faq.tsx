'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/core/components/ui/accordion';

export default function FAQPage() {
  return (
    <div className='mx-auto mt-0 flex w-full flex-col rounded-lg bg-zinc-100 px-4 py-8'>
      <h1 className='mb-8 text-center text-3xl font-bold'>
        Frequently Asked Questions
      </h1>
      <Accordion type='single' collapsible>
        <AccordionItem value='item-1'>
          <AccordionTrigger>
            What are the benefits of selling my property through your platform?
          </AccordionTrigger>
          <AccordionContent>
            <p>
              Our platform connects you with a wide network of potential buyers,
              offers market analysis, and manages all documentation to ensure a
              smooth transaction.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='item-2'>
          <AccordionTrigger>How do I list my rental property?</AccordionTrigger>
          <AccordionContent>
            <p>
              Simply create an account, upload detailed photos and descriptions,
              and our platform will help you reach thousands of prospective
              renters.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='item-3'>
          <AccordionTrigger>
            What fees are involved in using your services?
          </AccordionTrigger>
          <AccordionContent>
            <p>
              We maintain a transparent fee structure that varies based on your
              service needs. Check our pricing page or contact support for full
              details.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='item-4'>
          <AccordionTrigger>
            How can I schedule a property viewing?
          </AccordionTrigger>
          <AccordionContent>
            <p>
              Our integrated calendar system allows you to book a viewing at a
              convenient time. Confirmations are sent via email and SMS.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='item-5'>
          <AccordionTrigger>
            What security measures ensure safe transactions?
          </AccordionTrigger>
          <AccordionContent>
            <p>
              We use robust encryption, secure payment gateways, and continuous
              monitoring to protect all personal and transaction data.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='item-6'>
          <AccordionTrigger>
            Can I get professional advice on property valuation?
          </AccordionTrigger>
          <AccordionContent>
            <p>
              Yes, our platform provides access to certified experts for
              reliable property assessments and market insights tailored to your
              needs.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value='item-7'>
          <AccordionTrigger>
            How do I get in touch with customer support?
          </AccordionTrigger>
          <AccordionContent>
            <p>
              Our support team is available 24/7 via phone, email, and live
              chat. Visit our support page for more details.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
