import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { selectCurrentUser } from './authSlice';

const AdminRoute = () => {
    const user = useSelector(selectCurrentUser);

    // اگر کاربر نقش "Admin" را داشت، اجازه دسترسی بده
    if (user && user.roles?.includes('Admin')) {
        return <Outlet />;
    }

    // در غیر این صورت، او را به صفحه اصلی هدایت کن
    return <Navigate to="/" replace />;
};

export default AdminRoute;