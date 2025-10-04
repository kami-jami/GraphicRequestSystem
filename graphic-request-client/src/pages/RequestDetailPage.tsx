import { useParams } from 'react-router-dom';
import { useGetRequestByIdQuery } from '../services/apiSlice';
import { Box, CircularProgress, Paper, Typography, Grid } from '@mui/material';
import { mapStatusToPersian, mapPriorityToPersian } from '../utils/mappers';
import moment from 'moment-jalaali';

const RequestDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const requestId = Number(id);

    const { data: request, isLoading, isError } = useGetRequestByIdQuery(requestId, {
        skip: !requestId, // اگر ID وجود نداشت، درخواست را ارسال نکن
    });

    if (isLoading) return <CircularProgress />;
    if (isError || !request) return <Typography color="error">خطا در دریافت جزئیات درخواست</Typography>;

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                جزئیات درخواست: {request.title}
            </Typography>
            <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}><Typography><strong>شناسه:</strong> {request.id}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography><strong>وضعیت:</strong> {mapStatusToPersian(request.status)}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography><strong>اولویت:</strong> {mapPriorityToPersian(request.priority)}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography><strong>درخواست دهنده:</strong> {request.requesterName}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography><strong>تاریخ ثبت:</strong> {moment(request.submissionDate).locale('fa').format('YYYY/MM/DD HH:mm')}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography><strong>تاریخ تحویل:</strong> {request.dueDate ? moment(request.dueDate).locale('fa').format('YYYY/MM/DD HH:mm') : '---'}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography><strong>طراح:</strong> {request.designerName || '---'}</Typography></Grid>
                <Grid size={{ xs: 6 }}><Typography><strong>تایید کننده:</strong> {request.approverName || '---'}</Typography></Grid>
            </Grid>

            {/* در گام‌های بعدی، بخش‌های جزئیات اختصاصی، کامنت‌ها و فایل‌ها اینجا اضافه می‌شوند */}
        </Paper>
    );
};

export default RequestDetailPage;