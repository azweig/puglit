import type { Metadata } from 'next';
import ManageSubscriptionClient from './ManageSubscriptionClient';

export const metadata: Metadata = {
  title: 'Gestionar suscripción — StatusPe',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ManageSubscriptionPage() {
  return (
    <>
      <h1 className='sr-only'>Gestionar suscripción — StatusPe</h1>
      <ManageSubscriptionClient />
    </>
  );
}
