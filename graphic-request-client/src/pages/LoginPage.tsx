import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Container,
    InputAdornment,
    IconButton,
    Alert,
    Stack,
    useTheme,
    alpha,
    CircularProgress
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../services/apiSlice';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import BrushIcon from '@mui/icons-material/Brush';
import LoginIcon from '@mui/icons-material/Login';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const theme = useTheme();

    const [login, { isLoading }] = useLoginMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('لطفاً نام کاربری و رمز عبور را وارد کنید');
            return;
        }

        try {
            await login({ username, password }).unwrap();
            navigate('/');
        } catch (err) {
            console.error('Failed to login: ', err);
            setError('نام کاربری یا رمز عبور اشتباه است');
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-50%',
                    right: '-20%',
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: '-50%',
                    left: '-20%',
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                }
            }}
        >
            <Container maxWidth="sm">
                <Paper
                    elevation={24}
                    sx={{
                        p: { xs: 3, sm: 5 },
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(10px)',
                        position: 'relative',
                        zIndex: 1,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    }}
                >
                    {/* Logo and Title */}
                    <Stack spacing={3} alignItems="center" mb={4}>
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: 3,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                boxShadow: '0 10px 25px rgba(102, 126, 234, 0.4)',
                            }}
                        >
                            <BrushIcon sx={{ fontSize: 40 }} />
                        </Box>
                        <Box textAlign="center">
                            <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
                                سامانه مدیریت گرافیک
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                به سامانه مدیریت درخواست‌های گرافیکی خوش آمدید
                            </Typography>
                        </Box>
                    </Stack>

                    {/* Error Alert */}
                    {error && (
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {/* Login Form */}
                    <Box component="form" onSubmit={handleSubmit}>
                        <Stack spacing={3}>
                            <TextField
                                required
                                fullWidth
                                label="نام کاربری"
                                autoFocus
                                autoComplete="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isLoading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <PersonIcon color="action" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                    },
                                }}
                            />

                            <TextField
                                required
                                fullWidth
                                label="رمز عبور"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                disabled={isLoading}
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                                    },
                                }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={isLoading}
                                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                                sx={{
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
                                    '&:hover': {
                                        boxShadow: '0 15px 30px rgba(102, 126, 234, 0.4)',
                                    },
                                }}
                            >
                                {isLoading ? 'در حال ورود...' : 'ورود به سیستم'}
                            </Button>
                        </Stack>
                    </Box>

                    {/* Footer */}
                    <Box mt={4} textAlign="center">
                        <Typography variant="caption" color="text.secondary">
                            نسخه 1.0.0 | توسعه یافته با ❤️
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default LoginPage;