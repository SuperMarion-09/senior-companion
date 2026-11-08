import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import PublicLayout from './layouts/PublicLayout';
import AdminHomePage from './pages/AdminHomePage';
import AdminLoginPage from './pages/AdminLoginPage';
import NotFoundPage from './pages/NotFoundPage';
import StyleGuidePage from './pages/StyleGuidePage';
import SystemStatusPage from './pages/SystemStatusPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<SystemStatusPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        {/* Every design-system component on one page. Only exists during `npm start`. */}
        {process.env.NODE_ENV === 'development' && <Route path="/styleguide" element={<StyleGuidePage />} />}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminHomePage />} />
        </Route>
      </Route>
    </Routes>
  );
}
