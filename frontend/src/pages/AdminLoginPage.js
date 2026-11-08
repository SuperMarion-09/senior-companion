import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { useAuth } from '../hooks/useAuth';

export default function AdminLoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/admin';

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setMessage('');

    try {
      await login(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFieldErrors(error.errors || {});
      setMessage(error.message);
      setForm((current) => ({ ...current, password: '' }));
      setIsSubmitting(false);
    }
  };

  return (
    <section className="card card--narrow">
      <h1>Administrator login</h1>

      {message && <Alert type="error">{message}</Alert>}

      <form onSubmit={handleSubmit} noValidate>
        <FormInput
          id="email"
          label="Email address"
          type="email"
          autoComplete="username"
          value={form.email}
          onChange={handleChange}
          error={fieldErrors.email}
          required
        />
        <FormInput
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          error={fieldErrors.password}
          required
        />
        <Button type="submit" isLoading={isSubmitting} loadingText="Logging in…">
          Log in
        </Button>
      </form>
    </section>
  );
}
