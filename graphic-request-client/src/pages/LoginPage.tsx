import { Box, Button, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../services/apiSlice';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const [login, { isLoading }] = useLoginMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({ username, password }).unwrap();
            navigate('/'); // در صورت موفقیت، به داشبورد برو
        } catch (err) {
            console.error('Failed to login: ', err);
            // می‌توانید یک پیام خطا به کاربر نمایش دهید
        }
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
            }}
        >
            <Typography component="h1" variant="h5">
                ورود به سامانه
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="نام کاربری"
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="رمز عبور"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={isLoading}
                >
                    {isLoading ? 'در حال ورود...' : 'ورود'}
                </Button>
            </Box>
        </Box>
    );
};

export default LoginPage;