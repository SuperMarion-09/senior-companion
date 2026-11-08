import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../hooks/useAuth';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Admin start page. The bookings list is added in a later phase.
 */
export default function AdminHomePage() {
  const { admin } = useAuth();
  const firstName = admin.name.split(' ')[0];

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`${greeting()}, ${firstName}`}
        description="This is where you will manage companionship bookings."
      />

      <section className="card">
        <EmptyState icon="calendar" title="No bookings yet">
          When families request a companion through the website, their bookings will appear here.
        </EmptyState>
      </section>
    </>
  );
}
