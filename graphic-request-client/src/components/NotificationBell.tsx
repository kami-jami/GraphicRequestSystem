import { useState, MouseEvent } from 'react';
import {
    IconButton,
    Badge,
    Menu,
    MenuItem,
    Typography,
    Box,
    Divider,
    Button,
    ListItemText,
    Chip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectSignalRNotifications, selectSignalRUnreadCount } from '../services/signalRNotificationSlice';
import { useMarkAsReadMutation, useMarkAllAsReadMutation } from '../services/apiSlice';

const NotificationBell = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const notifications = useSelector(selectSignalRNotifications);
    const unreadCount = useSelector(selectSignalRUnreadCount);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [markAsRead] = useMarkAsReadMutation();
    const [markAllAsRead] = useMarkAllAsReadMutation();

    const handleClick = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (notificationId: number, requestId: number, isRead: boolean) => {
        if (!isRead) {
            await markAsRead(notificationId);
        }
        handleClose();

        const targetPath = `/requests/${requestId}`;

        // If already on the target page, force reload by navigating away and back
        if (location.pathname === targetPath) {
            navigate('/');
            setTimeout(() => {
                navigate(targetPath);
            }, 0);
        } else {
            navigate(targetPath);
        }
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const formatDate = (dateString: string) => {
        // Parse the UTC date string correctly
        const date = new Date(dateString);
        const now = new Date();

        // Calculate difference in milliseconds
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'همین الان';
        if (minutes < 60) return `${minutes} دقیقه پیش`;
        if (hours < 24) return `${hours} ساعت پیش`;
        if (days < 7) return `${days} روز پیش`;
        return date.toLocaleDateString('fa-IR');
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'Assignment':
                return 'primary';
            case 'PendingApproval':
                return 'warning';
            case 'Completed':
            case 'Approved':
                return 'success';
            case 'ReturnForCorrection':
            case 'Redesign':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <>
            <IconButton
                color="inherit"
                onClick={handleClick}
                sx={{ ml: 2 }}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    sx: {
                        width: 400,
                        maxHeight: 500,
                    },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">اعلان‌ها</Typography>
                    {unreadCount > 0 && (
                        <Button size="small" onClick={handleMarkAllAsRead}>
                            علامت‌گذاری همه به عنوان خوانده شده
                        </Button>
                    )}
                </Box>
                <Divider />

                {notifications.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            اعلانی وجود ندارد
                        </Typography>
                    </Box>
                ) : (
                    notifications.slice(0, 10).map((notification) => (
                        <MenuItem
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification.id, notification.requestId, notification.isRead)}
                            sx={{
                                backgroundColor: notification.isRead ? 'inherit' : 'action.hover',
                                '&:hover': {
                                    backgroundColor: 'action.selected',
                                },
                                whiteSpace: 'normal',
                                py: 2,
                            }}
                        >
                            <Box sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                    <ListItemText
                                        primary={notification.message}
                                        secondary={formatDate(notification.createdAt)}
                                        primaryTypographyProps={{
                                            fontWeight: notification.isRead ? 'normal' : 'bold',
                                            fontSize: '0.9rem',
                                        }}
                                        secondaryTypographyProps={{
                                            fontSize: '0.75rem',
                                        }}
                                    />
                                    <Chip
                                        label={notification.type}
                                        size="small"
                                        color={getNotificationColor(notification.type) as any}
                                        sx={{ ml: 1, flexShrink: 0 }}
                                    />
                                </Box>
                            </Box>
                        </MenuItem>
                    ))
                )}
            </Menu>
        </>
    );
};

export default NotificationBell;
