import { useGetDashboardStatsQuery } from '../services/apiSlice';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';

const DashboardPage = () => {
    const { data, isLoading, isError } = useGetDashboardStatsQuery();

    if (isLoading) {
        return <CircularProgress />;
    }

    if (isError || !data) {
        return <Typography color="error">خطا در دریافت اطلاعات داشبورد</Typography>;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                داشبورد مدیریتی
            </Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">کل کاربران</Typography>
                        <Typography variant="h4">{data.totalUsers}</Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">کل درخواست‌ها</Typography>
                        <Typography variant="h4">{data.totalRequests}</Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">درخواست‌های در جریان</Typography>
                        <Typography variant="h4">{data.pendingRequests}</Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">درخواست‌های تأخیردار</Typography>
                        <Typography variant="h4" color="error">{data.overdueRequests}</Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardPage;