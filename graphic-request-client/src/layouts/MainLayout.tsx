import { AppBar, Box, CssBaseline, Drawer, List, ListItem, ListItemButton, ListItemText, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../pages/auth/authSlice';

const drawerWidth = 240;

const MainLayout = () => {
    const user = useSelector(selectCurrentUser);
    const navigate = useNavigate();

    const menuItems = [
        { text: 'داشبورد', path: '/' },
        { text: 'ثبت درخواست', path: '/requests/new' },
        { text: 'لیست درخواست‌ها', path: '/requests' },
    ];

    // آیتم منوی ادمین را به صورت شرطی اضافه کن
    if (user && user.roles?.includes('Admin')) {
        menuItems.push({ text: 'مدیریت کاربران', path: '/admin/users' });
        menuItems.push({ text: 'مدیریت لیست‌ها', path: '/admin/lookups' });
        menuItems.push({ text: 'تنظیمات سیستم', path: '/admin/settings' });
        menuItems.push({ text: 'گزارش‌گیری', path: '/admin/reports' });
    }



    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />

            {/* هدر برنامه */}
            <AppBar
                position="fixed"
                // نکته کلیدی: AppBar از سمت راست به اندازه عرض منو فاصله می‌گیرد
                sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
            >
                <Toolbar>
                    <Typography variant="h6" noWrap>
                        سامانه مدیریت درخواست‌ها
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* منوی کناری */}
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}
                variant="permanent"
                anchor="left" // این اطمینان می‌دهد که منو همیشه در سمت راست است
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton onClick={() => navigate(item.path)} sx={{ textAlign: 'left' }}>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>

            {/* محتوای اصلی صفحه */}
            <Box
                component="main"
                sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
            >
                <Toolbar /> {/* این یک فاصله برای قرار گرفتن محتوا زیر هدر است */}
                <Outlet />
            </Box>
        </Box>

    );
};

export default MainLayout;