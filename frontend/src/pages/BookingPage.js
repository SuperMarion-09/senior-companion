import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Alert from '../components/Alert';
import Button from '../components/Button';
import FormCheckbox from '../components/FormCheckbox';
import FormInput from '../components/FormInput';
import PhoneInput from '../components/PhoneInput';
import FormSelect from '../components/FormSelect';
import FormTextarea from '../components/FormTextarea';
import Icon from '../components/Icon';
import MockModeNotice from '../components/MockModeNotice';
import PageHeader from '../components/PageHeader';
import { BOOKING_POLICIES, CONTACT, GUIDELINES, SERVICES, SERVICE_OPTIONS, serviceTitle } from '../content/siteContent';
import { useToast } from '../hooks/useToast';
import { createBooking } from '../services/bookingService';
import {
  AGREEMENTS,
  BOOKING_STEPS,
  DURATION_OPTIONS,
  EMPTY_BOOKING,
  MAX_DAYS_AHEAD,
  MIN_NOTICE_HOURS,
  firstBookableDate,
  formatDate,
  formatDuration,
  formatTime,
  startTimeOptionsFor,
  toIsoDate,
  validateBooking,
  validateBookingStep,
} from '../utils/booking';

const LAST_STEP = BOOKING_STEPS.length - 1;

// The points shown under "Read the guideline" for each agreement checkbox.
function guidelinePoints(guidelineId) {
  if (guidelineId === 'booking-policies') {
    return BOOKING_POLICIES.map((policy) => `${policy.title}: ${policy.description}`);
  }
  return GUIDELINES.find((guideline) => guideline.id === guidelineId)?.points || [];
}

function firstStepWithError(errors) {
  const index = BOOKING_STEPS.findIndex((step) => step.fields.some((field) => errors[field]));
  return index === -1 ? LAST_STEP : index;
}

function Stepper({ current }) {
  return (
    <ol className="stepper" aria-label="Booking progress">
      {BOOKING_STEPS.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo';
        return (
          <li key={step.title} className={`stepper__step stepper__step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="stepper__marker" aria-hidden="true">
              {state === 'done' ? <Icon name="check" size={20} strokeWidth="3" /> : index + 1}
            </span>
            <span className="stepper__label">
              <span className="visually-hidden">
                Step {index + 1}
                {state === 'done' ? ', completed' : ''}:{' '}
              </span>
              {step.title}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function SummaryList({ items }) {
  return (
    <dl className="summary-list">
      {items
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <div key={label} className="summary-list__row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  );
}

export default function BookingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const headingRef = useRef(null);
  const isFirstRender = useRef(true);

  // "Book this service" buttons on the homepage link to /book?service=walking.
  const [form, setForm] = useState(() => {
    const service = searchParams.get('service');
    return { ...EMPTY_BOOKING, serviceType: SERVICES.some((item) => item.value === service) ? service : '' };
  });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // After moving between steps, bring the step heading into view and give it focus.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    headingRef.current?.scrollIntoView({ block: 'start' });
  }, [step]);

  const today = new Date();
  const latestDate = new Date(today);
  latestDate.setDate(latestDate.getDate() + MAX_DAYS_AHEAD);
  // Times less than MIN_NOTICE_HOURS from now are left out of the list.
  const startTimeOptions = startTimeOptionsFor(form.bookingDate, today);
  const selectedService = SERVICES.find((service) => service.value === form.serviceType);

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) {
      const remaining = { ...errors, [name]: undefined };
      setErrors(remaining);
      // Once every highlighted field has been changed, the summary at the top is no longer true.
      if (!Object.values(remaining).some(Boolean)) setMessage('');
    }
  };

  const showErrors = (problems) => {
    setErrors(problems);
    const count = Object.keys(problems).length;
    setMessage(count === 1 ? 'Please fix 1 problem below.' : `Please fix ${count} problems below.`);
    // Wait for the error messages to render, then put the cursor in the first field with a problem.
    window.requestAnimationFrame(() => document.getElementById(Object.keys(problems)[0])?.focus());
  };

  const goToStep = (index) => {
    setErrors({});
    setMessage('');
    setStep(index);
  };

  const handleNext = () => {
    const problems = validateBookingStep(step, form);
    if (Object.keys(problems).length > 0) {
      showErrors(problems);
      return;
    }
    goToStep(step + 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (step < LAST_STEP) {
      handleNext();
      return;
    }

    const problems = validateBooking(form);
    if (Object.keys(problems).length > 0) {
      setStep(firstStepWithError(problems));
      showErrors(problems);
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      const booking = await createBooking(form);
      toast.success('Your booking request has been sent.');
      navigate('/book/confirmation', { state: { booking } });
    } catch (error) {
      const fieldErrors = error.errors || {};
      if (Object.keys(fieldErrors).length > 0) {
        setStep(firstStepWithError(fieldErrors));
        setErrors(fieldErrors);
        setMessage('Some details need to be corrected. Please check the highlighted fields.');
      } else {
        setMessage(error.message);
      }
      setIsSubmitting(false);
    }
  };

  const field = (id) => ({ id, value: form[id], onChange: handleChange, error: errors[id] });

  return (
    <div className="booking-layout">
      <div className="booking-layout__main">
        <PageHeader
          eyebrow="Book a companion"
          title="Request a companion"
          description="Tell us about your loved one and the visit you need. It takes about 5 minutes. Fields are required unless marked optional."
        />

        <MockModeNotice />
        <Stepper current={step} />

        <form className="card booking-form" onSubmit={handleSubmit} noValidate>
          <h2 ref={headingRef} tabIndex={-1} className="booking-form__title">
            <span className="booking-form__step">
              Step {step + 1} of {BOOKING_STEPS.length}
            </span>
            {BOOKING_STEPS[step].title}
          </h2>

          {message && <Alert type="error">{message}</Alert>}

          {step === 0 && (
            <>
              <fieldset className="form-section">
                <legend className="form-section__legend">Senior or client</legend>
                <FormInput {...field('clientName')} label="Full name of the senior or client" autoComplete="off" />
              </fieldset>

              <fieldset className="form-section">
                <legend className="form-section__legend">Family contact person</legend>
                <p className="form-section__hint">The person we will call to confirm the booking.</p>
                <FormInput {...field('contactPersonName')} label="Contact person’s full name" autoComplete="name" />
                <PhoneInput
                  {...field('contactNumber')}
                  label="Contact number"
                  hint="11 digits, for example 09171234567. You will need this number to check your booking."
                />
                <FormInput
                  {...field('email')}
                  label="Email"
                  type="email"
                  autoComplete="email"
                  optional
                  hint="We will send a copy of the booking details here."
                />
              </fieldset>

              <fieldset className="form-section">
                <legend className="form-section__legend">Emergency contact</legend>
                <p className="form-section__hint">Someone we can reach right away if something happens during the visit.</p>
                <FormInput {...field('emergencyContactName')} label="Emergency contact’s full name" autoComplete="off" />
                <PhoneInput
                  {...field('emergencyContactNumber')}
                  label="Emergency contact number"
                  autoComplete="off"
                  hint="11 digits, for example 09187654321"
                />
              </fieldset>
            </>
          )}

          {step === 1 && (
            <>
              <fieldset className="form-section">
                <legend className="form-section__legend">The service</legend>
                <FormSelect {...field('serviceType')} label="Type of service" options={SERVICE_OPTIONS} placeholder="Choose a service…" />
                {selectedService && <p className="service-preview">{selectedService.description}</p>}
              </fieldset>

              <fieldset className="form-section">
                <legend className="form-section__legend">Date and time</legend>
                <FormInput
                  {...field('bookingDate')}
                  label="Date of service"
                  type="date"
                  min={firstBookableDate(today)}
                  max={toIsoDate(latestDate)}
                  hint={`Please book at least ${MIN_NOTICE_HOURS} hours ahead`}
                />
                <div className="form-row">
                  <FormSelect
                    {...field('startTime')}
                    label="Start time"
                    options={startTimeOptions}
                    placeholder={startTimeOptions.length ? 'Choose a time…' : 'No times left on this date'}
                    hint={
                      startTimeOptions.length
                        ? `Between ${startTimeOptions[0].label} and ${startTimeOptions.at(-1).label}`
                        : 'Please choose another date'
                    }
                  />
                  <FormSelect
                    {...field('durationHours')}
                    label="Duration"
                    options={DURATION_OPTIONS}
                    placeholder="Choose…"
                    hint="Minimum of 3 hours"
                  />
                </div>
              </fieldset>

              <fieldset className="form-section">
                <legend className="form-section__legend">Where</legend>
                <FormInput
                  {...field('pickupLocation')}
                  label="Pickup or meeting location"
                  autoComplete="street-address"
                  hint="House number, street, barangay and city, or a landmark"
                />
                <FormInput
                  {...field('destination')}
                  label="Destination"
                  hint="For example: SM Megamall, St. Luke’s Medical Center, the park near home"
                />
                <FormInput
                  {...field('plannedActivity')}
                  label="Planned activity"
                  optional
                  hint="For example: buy groceries, attend a check-up, morning walk and merienda"
                />
                <FormTextarea
                  {...field('specialInstructions')}
                  label="Special instructions"
                  optional
                  rows={4}
                  hint="Walking aids, preferred language, things your loved one enjoys, or anything else we should know."
                />
              </fieldset>
            </>
          )}

          {step === 2 && (
            <>
              <div className="review">
                <section className="review__block" aria-labelledby="review-client">
                  <div className="review__header">
                    <h3 id="review-client">Client details</h3>
                    <Button variant="ghost" size="sm" onClick={() => goToStep(0)}>
                      Edit<span className="visually-hidden"> client details</span>
                    </Button>
                  </div>
                  <SummaryList
                    items={[
                      ['Senior / client', form.clientName],
                      ['Contact person', form.contactPersonName],
                      ['Contact number', form.contactNumber],
                      ['Email', form.email],
                      ['Emergency contact', `${form.emergencyContactName} · ${form.emergencyContactNumber}`],
                    ]}
                  />
                </section>
                <section className="review__block" aria-labelledby="review-service">
                  <div className="review__header">
                    <h3 id="review-service">Service details</h3>
                    <Button variant="ghost" size="sm" onClick={() => goToStep(1)}>
                      Edit<span className="visually-hidden"> service details</span>
                    </Button>
                  </div>
                  <SummaryList
                    items={[
                      ['Service', serviceTitle(form.serviceType)],
                      ['Date', formatDate(form.bookingDate)],
                      ['Start time', formatTime(form.startTime)],
                      ['Duration', formatDuration(form.durationHours)],
                      ['Pickup / meeting place', form.pickupLocation],
                      ['Destination', form.destination],
                      ['Planned activity', form.plannedActivity],
                      ['Special instructions', form.specialInstructions],
                    ]}
                  />
                </section>
              </div>

              <fieldset className="form-section">
                <legend className="form-section__legend">Service agreement</legend>
                <p className="form-section__hint">Please read and tick each box to confirm you agree.</p>
                {AGREEMENTS.map((agreement) => (
                  <FormCheckbox
                    key={agreement.id}
                    id={agreement.id}
                    label={agreement.label}
                    checked={form[agreement.id]}
                    onChange={handleChange}
                    error={errors[agreement.id]}
                  >
                    <details className="agreement-details">
                      <summary>Read the details</summary>
                      <ul className="check-list">
                        {guidelinePoints(agreement.guideline).map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </details>
                  </FormCheckbox>
                ))}
              </fieldset>
            </>
          )}

          <div className="booking-form__actions">
            {step > 0 && (
              <Button variant="secondary" icon="arrow-left" onClick={() => goToStep(step - 1)} disabled={isSubmitting}>
                Back
              </Button>
            )}
            {step < LAST_STEP ? (
              <Button type="submit" size="lg" className="booking-form__next">
                Continue
                <Icon name="arrow-right" size={20} />
              </Button>
            ) : (
              <Button type="submit" size="lg" icon="check-circle" isLoading={isSubmitting} loadingText="Sending your request…" className="booking-form__next">
                Submit booking request
              </Button>
            )}
          </div>
        </form>
      </div>

      <aside className="booking-layout__aside" aria-labelledby="good-to-know">
        <div className="card info-panel">
          <h2 id="good-to-know" className="info-panel__title">
            Good to know
          </h2>
          <ul className="info-panel__list">
            {BOOKING_POLICIES.map((policy) => (
              <li key={policy.title}>
                <Icon name={policy.icon} />
                <span>
                  <strong>{policy.title}.</strong> {policy.description}
                </span>
              </li>
            ))}
          </ul>
          <div className="info-panel__help">
            <p>
              <strong>Prefer to book by phone?</strong>
            </p>
            <a href={CONTACT.phoneHref} className="info-panel__phone">
              <Icon name="phone" size={20} />
              {CONTACT.phone}
            </a>
            <p className="text-muted">{CONTACT.hours}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
