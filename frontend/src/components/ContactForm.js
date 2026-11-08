import { useState } from 'react';
import { useToast } from '../hooks/useToast';
import { USE_MOCK_CONTACT, sendContactMessage } from '../services/contactService';
import { isValidPhone } from '../utils/booking';
import Alert from './Alert';
import Button from './Button';
import FormInput from './FormInput';
import FormTextarea from './FormTextarea';
import MockModeNotice from './MockModeNotice';

const EMPTY_MESSAGE = { name: '', contactNumber: '', email: '', message: '' };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Please enter your name.';
  if (!form.contactNumber.trim()) {
    errors.contactNumber = 'Please enter a number we can call or text you on.';
  } else if (!isValidPhone(form.contactNumber)) {
    errors.contactNumber = 'Please enter a valid Philippine phone number, for example 0917 123 4567.';
  }
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address, or leave it empty.';
  }
  if (!form.message.trim()) {
    errors.message = 'Please write your message or question.';
  } else if (form.message.trim().length > 2000) {
    errors.message = 'Please keep your message under 2,000 characters.';
  }
  return errors;
}

/**
 * The "Send us a message" form in the homepage's Contact section.
 */
export default function ContactForm() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY_MESSAGE);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setIsSent(false);

    const problems = validate(form);
    setErrors(problems);
    if (Object.keys(problems).length > 0) {
      setMessage('Please check the details below and try again.');
      document.getElementById(Object.keys(problems)[0])?.focus();
      return;
    }

    setIsSending(true);
    try {
      await sendContactMessage(form);
      setForm(EMPTY_MESSAGE);
      setIsSent(true);
      toast.success('Thank you! Your message has been received.');
    } catch (error) {
      setErrors(error.errors || {});
      setMessage(error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <MockModeNotice active={USE_MOCK_CONTACT}>The contact form is not connected yet, so messages are not sent. Please call or email us instead.</MockModeNotice>
      {message && <Alert type="error">{message}</Alert>}
      {isSent && (
        <Alert type="success" title="Message received">
          Thank you for reaching out. We will reply within one working day.
        </Alert>
      )}

      <FormInput id="name" label="Your name" autoComplete="name" value={form.name} onChange={handleChange} error={errors.name} />
      <FormInput
        id="contactNumber"
        label="Contact number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        hint="For example 0917 123 4567"
        value={form.contactNumber}
        onChange={handleChange}
        error={errors.contactNumber}
      />
      <FormInput
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        optional
        value={form.email}
        onChange={handleChange}
        error={errors.email}
      />
      <FormTextarea id="message" label="Your message" value={form.message} onChange={handleChange} error={errors.message} />
      <Button type="submit" size="lg" fullWidth isLoading={isSending} loadingText="Sending…">
        Send message
      </Button>
    </form>
  );
}
