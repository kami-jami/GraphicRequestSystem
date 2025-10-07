import { Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './pages/auth/ProtectedRoute';
import RequestsListPage from './pages/RequestsListPage';
import CreateRequestPage from './pages/CreateRequestPage';
import RequestDetailPage from './pages/RequestDetailPage';
import AdminRoute from './pages/auth/AdminRoute';
import UserManagementPage from './pages/admin/UserManagementPage';
import SettingsPage from './pages/admin/SettingsPage';
import Notification from './components/Notification';
import LookupManagementPage from './pages/admin/LookupManagementPage';

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* تمام مسیرهای داخلی را داخل این نگهبان قرار می‌دهیم */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/requests" element={<RequestsListPage />} />
            <Route path="/requests/new" element={<CreateRequestPage />} />
            <Route path="/requests/:id" element={<RequestDetailPage />} />

            <Route element={<AdminRoute />}>
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/lookups" element={<LookupManagementPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
      <Notification />
    </>
  );
}

export default App;