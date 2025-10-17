import { useState, useCallback, useEffect } from 'react';
import { AppBar, Box, CssBaseline, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider, Collapse, Badge } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser, logOut } from '../pages/auth/authSlice';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useLocation } from 'react-router-dom';
import { apiSlice, useGetNotificationsQuery, useGetUnreadCountQuery, useGetInboxCountsQuery, useMarkInboxAsViewedMutation } from '../services/apiSlice';
import { useSignalR } from '../services/useSignalR';
import {
    setSignalRNotifications,
    addSignalRNotification,
    markSignalRNotificationAsRead,
    markAllSignalRNotificationsAsRead,
    setSignalRUnreadCount,
} from '../services/signalRNotificationSlice';
import NotificationBell from '../components/NotificationBell';

interface SignalRNotification {
    id: number;
    requestId: number;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}


const drawerWidth = 240;

const MainLayout = () => {
    const location = useLocation();
    const user = useSelector(selectCurrentUser);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [openWorklist, setOpenWorklist] = useState(true);
    const [openAdminMenu, setOpenAdminMenu] = useState(true);

    // Fetch notifications and inbox counts
    const { data: notifications } = useGetNotificationsQuery();
    const { data: unreadCountData } = useGetUnreadCountQuery();
    const { data: inboxCounts = {}, refetch: refetchInboxCounts } = useGetInboxCountsQuery();
    const [markInboxAsViewed] = useMarkInboxAsViewedMutation();

    // Update Redux state when notifications are fetched
    useEffect(() => {
        if (notifications) {
            dispatch(setSignalRNotifications(notifications));
        }
    }, [notifications, dispatch]);

    useEffect(() => {
        if (unreadCountData) {
            dispatch(setSignalRUnreadCount(unreadCountData.count));
        }
    }, [unreadCountData, dispatch]);

    // SignalR callbacks
    const handleNotificationReceived = useCallback((notification: SignalRNotification) => {
        dispatch(addSignalRNotification(notification));
    }, [dispatch]);

    const handleNotificationRead = useCallback((notificationId: number) => {
        dispatch(markSignalRNotificationAsRead(notificationId));
    }, [dispatch]);

    const handleAllNotificationsRead = useCallback(() => {
        dispatch(markAllSignalRNotificationsAsRead());
    }, [dispatch]);

    // Initialize SignalR connection
    useSignalR(handleNotificationReceived, handleNotificationRead, handleAllNotificationsRead);

    const userDisplayName = (user?.firstName || user?.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user?.username;


    const handleLogout = () => {
        dispatch(logOut());
        dispatch(apiSlice.util.resetApiState());
        navigate('/login');
    };

    const handleNavigate = (path: string) => {
        navigate(path);
    };

    // Role-based inbox items
    const getWorklistItems = () => {
        const userRoles = user?.roles || [];

        if (userRoles.includes('Requester')) {
            return [
                { text: '🔴 نیاز به اقدام', statuses: [2], countKey: 'requester_needsAction', color: 'error' },
                { text: '⏳ در حال بررسی', statuses: [0, 1], countKey: 'requester_underReview' },
                { text: '🎨 در حال طراحی', statuses: [3, 5], countKey: 'requester_inDesign' },
                { text: '✅ تکمیل شده', statuses: [6], countKey: 'requester_completed' },
                { text: '📋 همه درخواست‌های من', statuses: [] },
            ];
        }

        if (userRoles.includes('Designer')) {
            return [
                { text: '🔥 فوری - نیاز به شروع', statuses: [1], urgent: true, countKey: 'designer_urgentToStart', color: 'error' },
                { text: '🔴 نزدیک به سررسید', statuses: [3, 5], nearDeadline: true, countKey: 'designer_approachingDeadline', color: 'warning' },
                { text: '🎯 در حال انجام', statuses: [3, 5], countKey: 'designer_inProgress' },
                { text: '📬 منتظر شروع', statuses: [1], countKey: 'designer_waitingToStart' },
                { text: '✅ تکمیل شده', statuses: [6], countKey: 'designer_completed' },
                { text: '📋 همه کارهای من', statuses: [] },
            ];
        }

        if (userRoles.includes('Approver')) {
            return [
                { text: '🔴 منتظر تایید من', statuses: [4], countKey: 'approver_pendingApproval', color: 'error' },
                { text: '⏰ فوری - نیاز به تایید', statuses: [4], urgent: true, countKey: 'approver_urgentApproval', color: 'warning' },
                { text: '📋 سابقه تایید‌های من', statuses: [6] },
            ];
        }

        // Default (Admin or others)
        return [
            { text: 'درخواست‌های در حال انجام', statuses: [3, 5] },
            { text: 'درخواست‌های منتظر تایید', statuses: [4] },
            { text: 'درخواست‌های نیازمند اصلاح', statuses: [2] },
            { text: 'همه درخواست‌ها', statuses: [] },
        ];
    };

    const worklistItems = getWorklistItems();

    const adminMenuItems = [
        { text: 'مدیریت کاربران', path: '/admin/users' },
        { text: 'تنظیمات سیستم', path: '/admin/settings' },
        { text: 'مدیریت لیست‌ها', path: '/admin/lookups' },
        { text: 'گزارش‌گیری', path: '/admin/reports' },
    ];

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}>
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" noWrap>سامانه مدیریت درخواست‌ها</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <NotificationBell />
                        <Typography sx={{ ml: 2 }}>خوش آمدید، {userDisplayName}</Typography>
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer variant="permanent" anchor="left" sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        <ListItemButton onClick={() => handleNavigate('/')} selected={location.pathname === '/'}><ListItemIcon><DashboardIcon /></ListItemIcon><ListItemText primary="داشبورد" /></ListItemButton>
                        <ListItemButton onClick={() => handleNavigate('/requests/new')} selected={location.pathname === '/requests/new'}><ListItemIcon><AddCircleOutlineIcon /></ListItemIcon><ListItemText primary="ثبت درخواست" /></ListItemButton>

                        <ListItemButton onClick={() => setOpenWorklist(!openWorklist)}>
                            <ListItemIcon><FormatListBulletedIcon /></ListItemIcon>
                            <ListItemText primary="لیست درخواست‌ها" />
                            {openWorklist ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>
                        <Collapse in={openWorklist} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                {worklistItems.map((item: any) => {
                                    const queryParams = new URLSearchParams(item.statuses.map((s: number) => ['statuses', s.toString()])).toString();
                                    const path = `/requests?${queryParams}`;
                                    const count = item.countKey ? inboxCounts[item.countKey] : undefined;
                                    const showBadge = count !== undefined && count > 0;

                                    const handleInboxClick = async () => {
                                        // Mark inbox as viewed to reset counter
                                        if (item.countKey) {
                                            try {
                                                await markInboxAsViewed(item.countKey).unwrap();
                                                refetchInboxCounts();
                                            } catch (error) {
                                                console.error('Failed to mark inbox as viewed:', error);
                                            }
                                        }
                                        handleNavigate(path);
                                    };

                                    return (
                                        <ListItemButton
                                            key={item.text}
                                            sx={{ pr: 4 }}
                                            onClick={handleInboxClick}
                                            selected={location.pathname === '/requests' && location.search === `?${queryParams}`}
                                        >
                                            <ListItemText primary={item.text} />
                                            {showBadge && (
                                                <Badge
                                                    badgeContent={count}
                                                    color={item.color || 'primary'}
                                                    sx={{ ml: 1 }}
                                                />
                                            )}
                                        </ListItemButton>
                                    );
                                })}
                            </List>
                        </Collapse>
                    </List>
                    <Divider />
                    {user && user.roles?.includes('Admin') && (
                        <List>
                            <ListItemButton onClick={() => setOpenAdminMenu(!openAdminMenu)}>
                                <ListItemIcon><AdminPanelSettingsIcon /></ListItemIcon>
                                <ListItemText primary="پنل مدیریت" />
                                {openAdminMenu ? <ExpandLess /> : <ExpandMore />}
                            </ListItemButton>
                            <Collapse in={openAdminMenu} timeout="auto" unmountOnExit>
                                <List component="div" disablePadding>
                                    {adminMenuItems.map((item) => (
                                        <ListItemButton
                                            key={item.text}
                                            sx={{ pr: 4 }}
                                            onClick={() => handleNavigate(item.path)}
                                            selected={location.pathname === item.path}
                                        >
                                            <ListItemText primary={item.text} />
                                        </ListItemButton>
                                    ))}
                                </List>
                            </Collapse>
                        </List>
                    )}
                    <Divider />
                    <List>
                        <ListItemButton onClick={handleLogout}><ListItemIcon><LogoutIcon /></ListItemIcon><ListItemText primary="خروج" /></ListItemButton>
                    </List>
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default' }}>
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default MainLayout;