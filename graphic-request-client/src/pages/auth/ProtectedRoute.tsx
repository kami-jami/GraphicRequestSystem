import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { selectCurrentUserToken } from './authSlice';

const ProtectedRoute = () => {
    const token = useSelector(selectCurrentUserToken);

    // اگر توکن وجود دارد، به کاربر اجازه دسترسی به صفحه مورد نظر را بده (توسط Outlet)
    // در غیر این صورت، او را به صفحه لاگین هدایت کن
    return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;