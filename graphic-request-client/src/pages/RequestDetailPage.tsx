import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetRequestByIdQuery, useGetRequestCommentsQuery, useAddCommentMutation } from '../services/apiSlice';
import { Box, CircularProgress, Paper, Typography, Grid, TextField, Button } from '@mui/material';
import { mapStatusToPersian, mapPriorityToPersian } from '../utils/mappers';
import moment from 'moment-jalaali';

import RequestActions from './RequestActions';



const RequestDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const requestId = Number(id);

    // واکشی اطلاعات اصلی درخواست
    const { data: request, isLoading: isLoadingRequest } = useGetRequestByIdQuery(
        requestId,
        {
            skip: !requestId,
            refetchOnMountOrArgChange: true,
        });
    // واکشی کامنت‌های درخواست
    const { data: comments, isLoading: isLoadingComments } = useGetRequestCommentsQuery(
        requestId,
        {
            skip: !requestId,
            refetchOnMountOrArgChange: true,
            refetchOnFocus: true
        });
    // هوک برای افزودن کامنت
    const [addComment, { isLoading: isAddingComment }] = useAddCommentMutation();

    const [newComment, setNewComment] = useState('');

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            await addComment({ requestId, content: newComment }).unwrap();
            setNewComment(''); // پاک کردن فیلد کامنت پس از ارسال موفق
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    if (isLoadingRequest || isLoadingComments) return <CircularProgress />;
    if (!request) return <Typography color="error">خطا در دریافت جزئیات درخواست</Typography>;

    return (
        <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" gutterBottom>جزئیات درخواست: {request.title}</Typography>
                <Grid container spacing={2}>

                    <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>شناسه:</strong> {request.id}</Typography></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>وضعیت:</strong> {mapStatusToPersian(request.status)}</Typography></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>اولویت:</strong> {mapPriorityToPersian(request.priority)}</Typography></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>درخواست دهنده:</strong> {request.requesterName}</Typography></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>تاریخ ثبت:</strong> {moment(request.submissionDate).locale('fa').format('jYYYY/jMM/jDD')}</Typography></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>طراح:</strong> {request.designerName || '---'}</Typography></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>تایید کننده:</strong> {request.approverName || '---'}</Typography></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>تاریخ تحویل:</strong> {request.dueDate ? moment(request.dueDate).locale('fa').format('jYYYY/jMM/jDD') : '---'}</Typography></Grid>
                </Grid>
            </Paper>

            {/* بخش کامنت‌ها */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>گفتگوها</Typography>
                <Box sx={{ mb: 3 }}>
                    {comments && comments.length > 0 ? (
                        comments.map((comment: any) => (
                            <Paper key={comment.id} sx={{ p: 2, mb: 2, bgcolor: 'grey.100' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="subtitle2" component="strong">{comment.author}</Typography>
                                    <Typography variant="caption">{moment(comment.createdAt).locale('fa').fromNow()}</Typography>
                                </Box>
                                <Typography variant="body1">{comment.content}</Typography>
                            </Paper>
                        ))
                    ) : (
                        <Typography>هیچ گفتگویی برای این درخواست ثبت نشده است.</Typography>
                    )}
                </Box>

                {/* فرم ثبت کامنت جدید */}
                <Box component="div">
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="نظر خود را بنویسید..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        sx={{ mt: 1 }}
                        onClick={handleAddComment}
                        disabled={isAddingComment}
                    >
                        {isAddingComment ? <CircularProgress size={24} /> : 'ارسال نظر'}
                    </Button>
                </Box>
            </Paper>
            <RequestActions request={request} />
        </Box>

    );
};

export default RequestDetailPage;