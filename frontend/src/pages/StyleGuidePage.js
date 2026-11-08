import { useState } from 'react';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import FormTextarea from '../components/FormTextarea';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';
import { useToast } from '../hooks/useToast';

const COLOURS = [
  ['Background', '--color-bg'],
  ['Surface', '--color-surface'],
  ['Surface muted', '--color-surface-muted'],
  ['Text', '--color-text'],
  ['Text muted', '--color-text-muted'],
  ['Primary', '--color-primary'],
  ['Primary soft', '--color-primary-soft'],
  ['Accent', '--color-accent'],
  ['Success', '--color-success'],
  ['Warning', '--color-warning'],
  ['Error', '--color-error'],
  ['Info', '--color-info'],
];

const SERVICES = [
  { value: 'errands', label: 'Errands and shopping' },
  { value: 'walking', label: 'Walking companion' },
  { value: 'appointments', label: 'Accompaniment to appointments' },
  { value: 'visits', label: 'Social visits' },
];

/**
 * Development-only page showing every design-system component.
 * Check here first before building something new, and reuse what exists.
 */
export default function StyleGuidePage() {
  const toast = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Development only"
        title="Style guide"
        description="The colours, text styles and components used across the public site and the admin area."
      />

      <section className="card">
        <h2>Colours</h2>
        <div className="swatches">
          {COLOURS.map(([name, token]) => (
            <div key={token}>
              <div className="swatch__color" style={{ background: `var(${token})` }} />
              <span className="swatch__name">{name}</span>
              <code className="swatch__value">{token}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <p className="eyebrow">Eyebrow text</p>
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
        <p>
          Body text is 18px with generous line spacing so it is comfortable to read. Links look like{' '}
          <a href="#top">this</a> and are always underlined.
        </p>
        <p className="text-muted">Muted text is used for secondary information.</p>
      </section>

      <section className="card">
        <h2>Buttons</h2>
        <div className="cluster">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button isLoading loadingText="Saving…">
            Save
          </Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="cluster" style={{ marginTop: 'var(--space-4)' }}>
          <Button size="lg" icon="calendar">
            Book a companion
          </Button>
          <Button size="sm" variant="secondary">
            Small
          </Button>
        </div>
      </section>

      <section className="card">
        <h2>Form controls</h2>
        <form onSubmit={(event) => event.preventDefault()} noValidate>
          <FormInput id="sg-name" label="Your full name" autoComplete="name" />
          <FormInput
            id="sg-phone"
            label="Phone number"
            type="tel"
            hint="We will only call you about this booking."
            error="Please enter a phone number we can reach you on."
          />
          <FormInput id="sg-password" label="Password" type="password" />
          <FormSelect id="sg-service" label="Type of service" options={SERVICES} />
          <FormTextarea id="sg-notes" label="Anything we should know?" optional />
        </form>
      </section>

      <section className="card">
        <h2>Messages</h2>
        <Alert type="info" title="Good to know">
          Our companions provide non-medical support only.
        </Alert>
        <Alert type="success" title="Booking received">
          We will call you within one working day to confirm.
        </Alert>
        <Alert type="warning" title="Almost full">
          Only a few time slots are left this week.
        </Alert>
        <Alert type="error" title="Something went wrong">
          Your booking was not sent. Please try again.
        </Alert>

        <h3>Badges</h3>
        <div className="cluster">
          <Badge tone="warning">Pending</Badge>
          <Badge tone="success">Confirmed</Badge>
          <Badge tone="info">Completed</Badge>
          <Badge tone="error">Cancelled</Badge>
          <Badge>New</Badge>
        </div>

        <h3 style={{ marginTop: 'var(--space-5)' }}>Notifications</h3>
        <div className="cluster">
          <Button variant="secondary" onClick={() => toast.success('Your changes have been saved.')}>
            Show success
          </Button>
          <Button variant="secondary" onClick={() => toast.error('We could not save your changes.')}>
            Show error
          </Button>
        </div>
      </section>

      <section className="card">
        <h2>Confirmation dialog</h2>
        <Button variant="danger" onClick={() => setIsDialogOpen(true)}>
          Cancel booking…
        </Button>
        <ConfirmDialog
          open={isDialogOpen}
          title="Cancel this booking?"
          confirmLabel="Yes, cancel booking"
          cancelLabel="Keep booking"
          onConfirm={() => {
            setIsDialogOpen(false);
            toast.success('The booking has been cancelled.');
          }}
          onCancel={() => setIsDialogOpen(false)}
        >
          The family will be told that the visit is cancelled. This cannot be undone.
        </ConfirmDialog>
      </section>

      <section className="card">
        <h2>Loading and empty states</h2>
        <Spinner label="Loading bookings…" />
        <EmptyState icon="calendar" title="No bookings yet" action={<Button variant="secondary">Refresh</Button>}>
          When families request a companion through the website, their bookings will appear here.
        </EmptyState>
      </section>
    </div>
  );
}
