import { useState } from 'react';
import { AppBar, Box, CssBaseline, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Divider, Collapse } from '@mui/material';
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


const drawerWidth = 240;

const MainLayout = () => {
    const location = useLocation();
    const user = useSelector(selectCurrentUser);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [openWorklist, setOpenWorklist] = useState(true);
    const [openAdminMenu, setOpenAdminMenu] = useState(true);

    const userDisplayName = (user?.firstName || user?.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user?.username;


    const handleLogout = () => {
        dispatch(logOut());
        navigate('/login');
    };

    const handleNavigate = (path: string) => {
        navigate(path);
    };

    const worklistItems = [
        { text: 'درخواست‌های در حال انجام', statuses: [3, 5] },
        { text: 'درخواست‌های منتظر تایید', statuses: [4] },
        { text: 'درخواست‌های نیازمند اصلاح', statuses: [2] },
        { text: 'همه درخواست‌ها', statuses: [] },
    ];

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
                    <Typography>خوش آمدید، {userDisplayName}</Typography>
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
                                {worklistItems.map((item) => {
                                    const queryParams = new URLSearchParams(item.statuses.map(s => ['statuses', s.toString()])).toString();
                                    const path = `/requests?${queryParams}`;
                                    return (
                                        <ListItemButton
                                            key={item.text}
                                            sx={{ pr: 4 }}
                                            onClick={() => handleNavigate(path)}
                                            selected={location.pathname === '/requests' && location.search === `?${queryParams}`}
                                        >
                                            <ListItemText primary={item.text} />
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