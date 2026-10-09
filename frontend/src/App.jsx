import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import FeedPage from './pages/FeedPage';
import ClubsPage from './pages/ClubsPage';
import ClubDetailPage from './pages/ClubDetailPage';
import MyEventsPage from './pages/MyEventsPage';
import CreateEventPage from './pages/CreateEventPage';
import CoordinatorPage from './pages/CoordinatorPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';

const Guard = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login"        element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/register"     element={user ? <Navigate to="/" /> : <RegisterPage />} />
      {/* ✅ FIX 4: email verification landing page – public, no auth needed */}
      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index                 element={<FeedPage />} />
        <Route path="clubs"          element={<ClubsPage />} />
        <Route path="clubs/:id"      element={<ClubDetailPage />} />
        <Route path="my-events"      element={<MyEventsPage />} />
        <Route path="create-event"   element={<CreateEventPage />} />
        <Route path="edit-event/:id" element={<CreateEventPage />} />
        <Route path="coordinator"    element={<Guard roles={['coordinator']}><CoordinatorPage /></Guard>} />
        <Route path="admin"          element={<Guard roles={['admin']}><AdminPage /></Guard>} />
        <Route path="profile"        element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e1e1e', color: '#e2e8f0', border: '1px solid #ff6b00' },
            success: { iconTheme: { primary: '#ff6b00', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
