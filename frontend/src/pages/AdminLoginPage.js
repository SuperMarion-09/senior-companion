import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';

export default function AdminLoginPage() {
  const { login, isAuthenticated } = useAuth();
  const toast = useToast();
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
      const admin = await login(form.email, form.password);
      toast.success(`Welcome back, ${admin.name}.`);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const errors = error.errors || {};
      setFieldErrors(errors);
      // Field problems are shown under each field; keep the summary short and plain.
      setMessage(Object.keys(errors).length > 0 ? 'Please check the details below and try again.' : error.message);
      setForm((current) => ({ ...current, password: '' }));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page page--narrow">
      <section className="card">
        <div className="auth-card__header">
          <span className="icon-badge">
            <Icon name="lock" size={26} />
          </span>
          <h1>Administrator login</h1>
          <p className="text-muted">For Senior Companion staff only.</p>
        </div>

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
          <Button type="submit" size="lg" fullWidth isLoading={isSubmitting} loadingText="Logging in…">
            Log in
          </Button>
        </form>
      </section>

      <p className="auth-back">
        <Link to="/">Back to the website</Link>
      </p>
    </div>
  );
}
