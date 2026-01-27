import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { TrainingPage } from './pages/TrainingPage';
import { TrainingDetailsPage } from './pages/TrainingDetailsPage';
import { ToursPage } from './pages/ToursPage';
import { ActiveTourPage } from './pages/ActiveTourPage';
import { HRPage } from './pages/HRPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { RoutePath } from './types';

// Simple wrapper to check authentication
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const isPublicRoute = [RoutePath.LOGIN, RoutePath.FORGOT_PASSWORD].includes(location.pathname as RoutePath);
    
    if (!isAuthenticated && !isPublicRoute) {
      navigate(RoutePath.LOGIN, { replace: true });
    }
  }, [navigate, location]);

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path={RoutePath.LOGIN} element={<LoginPage />} />
      <Route path={RoutePath.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      
      <Route path={RoutePath.HOME} element={<HomePage />} />
      <Route path={RoutePath.PROFILE} element={<ProfilePage />} />
      <Route path={RoutePath.PROJECTS} element={<ProjectsPage />} />
      <Route path={RoutePath.PROJECT_DETAILS} element={<ProjectDetailsPage />} />
      <Route path={RoutePath.TRAINING} element={<TrainingPage />} />
      <Route path={RoutePath.TRAINING_DETAILS} element={<TrainingDetailsPage />} />
      <Route path={RoutePath.TOURS} element={<ToursPage />} />
      <Route path={RoutePath.ACTIVE_TOUR} element={<ActiveTourPage />} />
      <Route path={RoutePath.HR} element={<HRPage />} />
      <Route path={RoutePath.NOTIFICATIONS} element={<NotificationsPage />} />
      <Route path={RoutePath.SETTINGS} element={<PlaceholderPage title="Settings" />} />
      <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
    </Routes>
  );
}

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <AuthGuard>
          <AppRoutes />
        </AuthGuard>
      </Layout>
    </HashRouter>
  );
};

export default App;