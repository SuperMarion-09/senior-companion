import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';

/**
 * Placeholder shown after login, proving authentication works.
 * The admin dashboard is built in a later phase.
 */
export default function AdminHomePage() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout().catch(() => {});
    navigate('/admin/login', { replace: true });
  };

  return (
    <section className="card">
      <h1>Welcome, {admin.name}</h1>
      <Alert type="success">
        You are logged in as <strong>{admin.email}</strong>.
      </Alert>
      <p>The administrator dashboard will be added in a later phase.</p>
      <Button variant="secondary" onClick={handleLogout} isLoading={isLoggingOut} loadingText="Logging out…">
        Log out
      </Button>
    </section>
  );
}
