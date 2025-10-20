import { useState, useCallback, useEffect } from 'react';
import {
    AppBar,
    Box,
    CssBaseline,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Divider,
    Collapse,
    Avatar,
    Stack,
    Chip,
    useTheme,
    alpha
} from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser, logOut } from '../pages/auth/authSlice';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BrushIcon from '@mui/icons-material/Brush';
import InboxIcon from '@mui/icons-material/Inbox';
import SendIcon from '@mui/icons-material/Send';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AllInboxIcon from '@mui/icons-material/AllInbox';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { useLocation } from 'react-router-dom';
import {
    apiSlice,
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useGetInboxCountsQuery,
    useMarkInboxAsViewedMutation
} from '../services/apiSlice';
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

interface InboxItem {
    text: string;
    icon: React.ReactNode;
    inboxType: 'inbox' | 'outbox' | 'completed' | 'all';
    statuses: number[];
    countKey?: string;
    color?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
    description?: string;
}

interface AdminMenuItem {
    text: string;
    icon: React.ReactNode;
    path: string;
}

const drawerWidth = 280;

const MainLayout = () => {
    const location = useLocation();
    const user = useSelector(selectCurrentUser);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const theme = useTheme();
    const [openInbox, setOpenInbox] = useState(true);
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

    const handleInboxUpdate = useCallback(() => {
        refetchInboxCounts();
    }, [refetchInboxCounts]);

    // Initialize SignalR connection
    useSignalR(handleNotificationReceived, handleNotificationRead, handleAllNotificationsRead, handleInboxUpdate);

    const userDisplayName = (user?.firstName || user?.lastName)
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
        : user?.username;

    const handleLogout = () => {
        dispatch(logOut());
        dispatch(apiSlice.util.resetApiState());
        navigate('/login');
    };

    const handleNavigate = (path: string) => {
        navigate(path);
    };

    // Email-like inbox structure - supports multiple roles
    const getInboxItems = (): InboxItem[] => {
        const userRoles = user?.roles || [];
        const items: InboxItem[] = [];

        // Add Requester items
        if (userRoles.includes('Requester')) {
            items.push(
                {
                    text: '� درخواست‌های من',
                    icon: <InboxIcon fontSize="small" />,
                    inboxType: 'inbox',
                    statuses: [0, 1],
                    countKey: 'requester_underReview',
                    color: 'primary',
                    description: 'درخواست‌های جدید و در حال بررسی (درخواست‌کننده)'
                },
                {
                    text: '✏️ نیاز به اصلاح من',
                    icon: <EditNoteIcon fontSize="small" />,
                    inboxType: 'inbox',
                    statuses: [2],
                    countKey: 'requester_needsRevision',
                    color: 'error',
                    description: 'درخواست‌های برگشتی من که نیاز به ویرایش دارند'
                },
                {
                    text: '📤 ارسالی من',
                    icon: <SendIcon fontSize="small" />,
                    inboxType: 'outbox',
                    statuses: [0, 1, 2, 3, 4, 5],
                    color: 'info',
                    description: 'درخواست‌های ارسالی من و در حال بررسی'
                },
                {
                    text: '✅ تکمیل شده من',
                    icon: <TaskAltIcon fontSize="small" />,
                    inboxType: 'completed',
                    statuses: [6],
                    countKey: 'requester_completed',
                    color: 'success',
                    description: 'درخواست‌های نهایی و تحویل گرفته شده من'
                }
            );
        }

        // Add Designer items
        if (userRoles.includes('Designer')) {
            items.push(
                {
                    text: '🎨 کارهای طراحی من',
                    icon: <InboxIcon fontSize="small" />,
                    inboxType: 'inbox',
                    statuses: [1, 5],
                    countKey: 'designer_pendingAction',
                    color: 'primary',
                    description: 'تخصیص‌های جدید و درخواست‌های برگشتی (طراح)'
                },
                {
                    text: '📤 در حال طراحی',
                    icon: <SendIcon fontSize="small" />,
                    inboxType: 'outbox',
                    statuses: [3, 4],
                    color: 'info',
                    description: 'پروژه‌های در دست کار و ارسال شده برای تایید من'
                },
                {
                    text: '✅ تکمیل شده طراحی',
                    icon: <TaskAltIcon fontSize="small" />,
                    inboxType: 'completed',
                    statuses: [6],
                    countKey: 'designer_completed',
                    color: 'success',
                    description: 'پروژه‌های تحویل داده شده من'
                }
            );
        }

        // Add Approver items
        if (userRoles.includes('Approver')) {
            items.push(
                {
                    text: '� تاییدهای من',
                    icon: <InboxIcon fontSize="small" />,
                    inboxType: 'inbox',
                    statuses: [4],
                    countKey: 'approver_pendingApproval',
                    color: 'primary',
                    description: 'درخواست‌های منتظر تایید من (تاییدکننده)'
                },
                {
                    text: '📤 بررسی شده توسط من',
                    icon: <SendIcon fontSize="small" />,
                    inboxType: 'outbox',
                    statuses: [3, 5, 6],
                    color: 'info',
                    description: 'درخواست‌هایی که بررسی کرده‌ام'
                },
                {
                    text: '✅ تایید شده توسط من',
                    icon: <TaskAltIcon fontSize="small" />,
                    inboxType: 'completed',
                    statuses: [6],
                    countKey: 'approver_completed',
                    color: 'success',
                    description: 'درخواست‌های تایید و نهایی شده توسط من'
                }
            );
        }

        // Add "All" item if user has any role-specific items
        if (items.length > 0) {
            items.push({
                text: 'همه درخواست‌ها',
                icon: <AllInboxIcon fontSize="small" />,
                inboxType: 'all',
                statuses: []
            });
        } else {
            // Default (Admin or others)
            items.push(
                {
                    text: '📥 فعال',
                    icon: <InboxIcon fontSize="small" />,
                    inboxType: 'inbox',
                    statuses: [1, 2, 3, 4, 5],
                    color: 'primary'
                },
                {
                    text: '✅ تکمیل شده',
                    icon: <TaskAltIcon fontSize="small" />,
                    inboxType: 'completed',
                    statuses: [6],
                    color: 'success'
                },
                {
                    text: 'همه درخواست‌ها',
                    icon: <AllInboxIcon fontSize="small" />,
                    inboxType: 'all',
                    statuses: []
                }
            );
        }

        return items;
    };

    const inboxItems = getInboxItems();

    const adminMenuItems: AdminMenuItem[] = [
        { text: 'مدیریت کاربران', icon: <PeopleIcon fontSize="small" />, path: '/admin/users' },
        { text: 'تنظیمات سیستم', icon: <SettingsIcon fontSize="small" />, path: '/admin/settings' },
        { text: 'مدیریت لیست‌ها', icon: <ListAltIcon fontSize="small" />, path: '/admin/lookups' },
        { text: 'گزارش‌گیری', icon: <AssessmentIcon fontSize="small" />, path: '/admin/reports' },
    ];

    // Get user initials for avatar
    const getUserInitials = () => {
        if (user?.firstName && user?.lastName) {
            return `${user.firstName[0]}${user.lastName[0]}`;
        }
        if (user?.username) {
            return user.username.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <CssBaseline />

            {/* AppBar */}
            <AppBar
                position="fixed"
                sx={{
                    width: `calc(100% - ${drawerWidth}px)`,
                    ml: `${drawerWidth}px`,
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            سامانه مدیریت درخواست‌های گرافیکی
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            مدیریت هوشمند پروژه‌های طراحی
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2} alignItems="center">
                        <NotificationBell />
                        <Divider orientation="vertical" flexItem />
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                                sx={{
                                    width: 36,
                                    height: 36,
                                    bgcolor: 'primary.main',
                                    fontSize: '0.875rem',
                                    fontWeight: 600
                                }}
                            >
                                {getUserInitials()}
                            </Avatar>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                                    {userDisplayName}
                                </Typography>
                                {user?.roles && user.roles.length > 0 && (
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                        {user.roles[0]}
                                    </Typography>
                                )}
                            </Box>
                        </Stack>
                    </Stack>
                </Toolbar>
            </AppBar>

            {/* Sidebar Drawer */}
            <Drawer
                variant="permanent"
                anchor="left"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        borderRight: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.default'
                    }
                }}
            >
                <Toolbar sx={{ py: 2, px: 2.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}
                        >
                            <BrushIcon />
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                Graphic System
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                نسخه 1.0.0
                            </Typography>
                        </Box>
                    </Stack>
                </Toolbar>

                <Divider />

                <Box sx={{ overflow: 'auto', flex: 1, py: 2 }}>
                    {/* Main Navigation */}
                    <List sx={{ px: 2 }}>
                        <ListItemButton
                            onClick={() => handleNavigate('/')}
                            selected={location.pathname === '/'}
                            sx={{
                                borderRadius: 2,
                                mb: 0.5,
                                '&.Mui-selected': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.18),
                                    }
                                },
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <DashboardIcon fontSize="small" color={location.pathname === '/' ? 'primary' : 'action'} />
                            </ListItemIcon>
                            <ListItemText
                                primary="داشبورد"
                                primaryTypographyProps={{
                                    fontSize: '0.875rem',
                                    fontWeight: location.pathname === '/' ? 600 : 500
                                }}
                            />
                        </ListItemButton>

                        <ListItemButton
                            onClick={() => handleNavigate('/requests/new')}
                            selected={location.pathname === '/requests/new'}
                            sx={{
                                borderRadius: 2,
                                mb: 0.5,
                                '&.Mui-selected': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.18),
                                    }
                                },
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <AddCircleOutlineIcon
                                    fontSize="small"
                                    color={location.pathname === '/requests/new' ? 'primary' : 'action'}
                                />
                            </ListItemIcon>
                            <ListItemText
                                primary="ثبت درخواست جدید"
                                primaryTypographyProps={{
                                    fontSize: '0.875rem',
                                    fontWeight: location.pathname === '/requests/new' ? 600 : 500
                                }}
                            />
                        </ListItemButton>
                    </List>

                    <Divider sx={{ my: 2, mx: 2 }} />

                    {/* Inbox Section */}
                    <List sx={{ px: 2 }}>
                        <ListItemButton
                            onClick={() => setOpenInbox(!openInbox)}
                            sx={{
                                borderRadius: 2,
                                mb: 0.5,
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <AllInboxIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                                primary="درخواست‌ها"
                                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }}
                            />
                            {openInbox ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                        </ListItemButton>

                        <Collapse in={openInbox} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding sx={{ mt: 0.5 }}>
                                {inboxItems.map((item) => {
                                    const params = new URLSearchParams();
                                    params.set('inboxType', item.inboxType);
                                    if (item.statuses.length > 0) {
                                        item.statuses.forEach(s => params.append('statuses', s.toString()));
                                    }
                                    const queryString = params.toString();
                                    const path = `/requests?${queryString}`;
                                    const count = item.countKey ? inboxCounts[item.countKey] : undefined;
                                    const showBadge = count !== undefined && count > 0;
                                    const isSelected = location.pathname === '/requests' && location.search === `?${queryString}`;

                                    const handleInboxClick = () => {
                                        // Don't mark as viewed automatically - let individual request clicks handle it
                                        handleNavigate(path);
                                    };

                                    return (
                                        <ListItemButton
                                            key={item.text}
                                            onClick={handleInboxClick}
                                            selected={isSelected}
                                            sx={{
                                                pr: 5,
                                                pl: 2,
                                                borderRadius: 2,
                                                mb: 0.5,
                                                '&.Mui-selected': {
                                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                    '&:hover': {
                                                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                                                    }
                                                },
                                                '&:hover': {
                                                    bgcolor: alpha(theme.palette.action.hover, 0.5),
                                                }
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                                            <ListItemText
                                                primary={item.text}
                                                primaryTypographyProps={{
                                                    fontSize: '0.813rem',
                                                    fontWeight: isSelected ? 600 : 500
                                                }}
                                            />
                                            {showBadge && (
                                                <Chip
                                                    label={count}
                                                    size="small"
                                                    color={item.color || 'primary'}
                                                    sx={{
                                                        height: 20,
                                                        minWidth: 20,
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        '& .MuiChip-label': { px: 0.75 }
                                                    }}
                                                />
                                            )}
                                        </ListItemButton>
                                    );
                                })}
                            </List>
                        </Collapse>
                    </List>

                    {/* Admin Menu */}
                    {user && user.roles?.includes('Admin') && (
                        <>
                            <Divider sx={{ my: 2, mx: 2 }} />
                            <List sx={{ px: 2 }}>
                                <ListItemButton
                                    onClick={() => setOpenAdminMenu(!openAdminMenu)}
                                    sx={{
                                        borderRadius: 2,
                                        mb: 0.5,
                                        '&:hover': {
                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 40 }}>
                                        <AdminPanelSettingsIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="پنل مدیریت"
                                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }}
                                    />
                                    {openAdminMenu ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                                </ListItemButton>

                                <Collapse in={openAdminMenu} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding sx={{ mt: 0.5 }}>
                                        {adminMenuItems.map((item) => {
                                            const isSelected = location.pathname === item.path;
                                            return (
                                                <ListItemButton
                                                    key={item.text}
                                                    onClick={() => handleNavigate(item.path)}
                                                    selected={isSelected}
                                                    sx={{
                                                        pr: 5,
                                                        pl: 2,
                                                        borderRadius: 2,
                                                        mb: 0.5,
                                                        '&.Mui-selected': {
                                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                            '&:hover': {
                                                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                                            }
                                                        },
                                                        '&:hover': {
                                                            bgcolor: alpha(theme.palette.action.hover, 0.5),
                                                        }
                                                    }}
                                                >
                                                    <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                                                    <ListItemText
                                                        primary={item.text}
                                                        primaryTypographyProps={{
                                                            fontSize: '0.813rem',
                                                            fontWeight: isSelected ? 600 : 500
                                                        }}
                                                    />
                                                </ListItemButton>
                                            );
                                        })}
                                    </List>
                                </Collapse>
                            </List>
                        </>
                    )}
                </Box>

                {/* Logout Button */}
                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <ListItemButton
                        onClick={handleLogout}
                        sx={{
                            borderRadius: 2,
                            color: 'error.main',
                            '&:hover': {
                                bgcolor: alpha(theme.palette.error.main, 0.08),
                            }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40 }}>
                            <LogoutIcon fontSize="small" color="error" />
                        </ListItemIcon>
                        <ListItemText
                            primary="خروج از سیستم"
                            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }}
                        />
                    </ListItemButton>
                </Box>
            </Drawer>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: 'background.default',
                    minHeight: '100vh',
                    pt: 10,
                    pb: 4,
                    px: 4
                }}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default MainLayout;