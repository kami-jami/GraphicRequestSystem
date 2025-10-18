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
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BrushIcon from '@mui/icons-material/Brush';
import InboxIcon from '@mui/icons-material/Inbox';
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

    // Role-based inbox items with modern icons
    const getInboxItems = (): InboxItem[] => {
        const userRoles = user?.roles || [];

        if (userRoles.includes('Requester')) {
            return [
                {
                    text: 'در حال بررسی',
                    icon: <HourglassEmptyIcon fontSize="small" />,
                    statuses: [0, 1],
                    countKey: 'requester_underReview',
                    color: 'info',
                    description: 'درخواست‌های ثبت شده در انتظار شروع طراحی'
                },
                {
                    text: 'نیاز به اصلاح',
                    icon: <EditNoteIcon fontSize="small" />,
                    statuses: [2],
                    countKey: 'requester_needsRevision',
                    color: 'error',
                    description: 'درخواست‌های برگشتی که نیاز به ویرایش دارند'
                },
                {
                    text: 'تکمیل شده',
                    icon: <CheckCircleIcon fontSize="small" />,
                    statuses: [6],
                    countKey: 'requester_completed',
                    color: 'success',
                    description: 'درخواست‌های نهایی شده و تحویل گرفته شده'
                },
                {
                    text: 'همه درخواست‌های من',
                    icon: <AssignmentIcon fontSize="small" />,
                    statuses: []
                },
            ];
        }

        if (userRoles.includes('Designer')) {
            return [
                {
                    text: 'نیاز به اقدام',
                    icon: <NotificationsActiveIcon fontSize="small" />,
                    statuses: [1, 5],
                    countKey: 'designer_pendingAction',
                    color: 'error',
                    description: 'درخواست‌های جدید و برگشتی از تاییدکننده'
                },
                {
                    text: 'در حال انجام',
                    icon: <PlayCircleOutlineIcon fontSize="small" />,
                    statuses: [3],
                    countKey: 'designer_inProgress',
                    color: 'info',
                    description: 'پروژه‌های در دست طراحی'
                },
                {
                    text: 'منتظر تایید',
                    icon: <AccessTimeIcon fontSize="small" />,
                    statuses: [4],
                    countKey: 'designer_pendingApproval',
                    color: 'warning',
                    description: 'طراحی کامل شده، منتظر تایید نهایی'
                },
                {
                    text: 'تکمیل شده',
                    icon: <CheckCircleIcon fontSize="small" />,
                    statuses: [6],
                    countKey: 'designer_completed',
                    color: 'success',
                    description: 'پروژه‌های تحویل داده شده'
                },
                {
                    text: 'همه کارهای من',
                    icon: <BrushIcon fontSize="small" />,
                    statuses: []
                },
            ];
        }

        if (userRoles.includes('Approver')) {
            return [
                {
                    text: 'منتظر تایید',
                    icon: <AccessTimeIcon fontSize="small" />,
                    statuses: [4],
                    countKey: 'approver_pendingApproval',
                    color: 'warning',
                    description: 'درخواست‌های آماده برای تصمیم‌گیری'
                },
                {
                    text: 'تکمیل شده',
                    icon: <CheckCircleIcon fontSize="small" />,
                    statuses: [6],
                    countKey: 'approver_completed',
                    color: 'success',
                    description: 'درخواست‌های تایید و نهایی شده'
                },
                {
                    text: 'سابقه تایید‌های من',
                    icon: <AssignmentIcon fontSize="small" />,
                    statuses: []
                },
            ];
        }

        // Default (Admin or others)
        return [
            {
                text: 'درخواست‌های فعال',
                icon: <PlayCircleOutlineIcon fontSize="small" />,
                statuses: [3, 5],
                color: 'info'
            },
            {
                text: 'منتظر تایید',
                icon: <AccessTimeIcon fontSize="small" />,
                statuses: [4],
                color: 'warning'
            },
            {
                text: 'نیازمند اصلاح',
                icon: <EditNoteIcon fontSize="small" />,
                statuses: [2],
                color: 'error'
            },
            {
                text: 'همه درخواست‌ها',
                icon: <AssignmentIcon fontSize="small" />,
                statuses: []
            },
        ];
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
                                <InboxIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                                primary="صندوق ورودی"
                                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }}
                            />
                            {openInbox ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                        </ListItemButton>

                        <Collapse in={openInbox} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding sx={{ mt: 0.5 }}>
                                {inboxItems.map((item) => {
                                    const queryParams = new URLSearchParams(
                                        item.statuses.map((s) => ['statuses', s.toString()])
                                    ).toString();
                                    const path = `/requests?${queryParams}`;
                                    const count = item.countKey ? inboxCounts[item.countKey] : undefined;
                                    const showBadge = count !== undefined && count > 0;
                                    const isSelected = location.pathname === '/requests' && location.search === `?${queryParams}`;

                                    const handleInboxClick = async () => {
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