import { useParams, useLocation } from 'react-router-dom';
import { useGetRequestByIdQuery, useGetRequestCommentsQuery, useAddCommentMutation } from '../services/apiSlice';
import { Box, CircularProgress, Paper, Typography, Grid, TextField, Button, Alert, AlertTitle } from '@mui/material';
import { mapStatusToPersian, mapPriorityToPersian } from '../utils/mappers';
import moment from 'moment-jalaali';
import { useState, useEffect } from 'react';
import RequestActions from './RequestActions';
import AttachmentList from '../components/request-details/AttachmentList';
import LabelDetails from '../components/request-details/LabelDetails';
import PackagingPhotoDetails from '../components/request-details/PackagingPhotoDetails';
import InstagramPostDetails from '../components/request-details/InstagramPostDetails';
import PromotionalVideoDetails from '../components/request-details/PromotionalVideoDetails';
import WebsiteContentDetails from '../components/request-details/WebsiteContentDetails';
import FileEditDetails from '../components/request-details/FileEditDetails';
import PromotionalItemDetails from '../components/request-details/PromotionalItemDetails';
import VisualAdDetails from '../components/request-details/VisualAdDetails';
import EnvironmentalAdDetails from '../components/request-details/EnvironmentalAdDetails';
import MiscellaneousDetails from '../components/request-details/MiscellaneousDetails';
import RequestTimeline from '../components/request-details/RequestTimeline';
import { selectCurrentUser } from './auth/authSlice';
import { useSelector } from 'react-redux';

const RequestDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const requestId = Number(id);
    const user = useSelector(selectCurrentUser);

    const { data: request, isLoading: isLoadingRequest, isError, refetch } = useGetRequestByIdQuery(requestId, {
        skip: !requestId,
        refetchOnMountOrArgChange: true,
    });

    const [newComment, setNewComment] = useState('');
    const { data: comments, isLoading: isLoadingComments, refetch: refetchComments } = useGetRequestCommentsQuery(requestId, { skip: !requestId, refetchOnMountOrArgChange: true, refetchOnFocus: true });
    const [addComment, { isLoading: isAddingComment }] = useAddCommentMutation();

    // Listen for refresh signal from notification click
    useEffect(() => {
        if (location.state && (location.state as any).refresh) {
            refetch();
            refetchComments();
        }
    }, [location.state, refetch, refetchComments]);

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            await addComment({ requestId, content: newComment }).unwrap();
            setNewComment('');
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    if (isLoadingRequest) {
        return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 4 }} />;
    }
    if (isError || !request) {
        return <Typography color="error" sx={{ textAlign: 'center', mt: 4 }}>خطا در دریافت جزئیات درخواست</Typography>;
    }

    const isApproverView = request.status === 4 && user?.id === request.approverId;

    const lastSubmissionForApproval = request.histories
        ?.filter((h: any) => h.newStatus === 4)
        .sort((a: any, b: any) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime())[0];

    const renderRequestDetails = () => {
        if (!request.details) return null;
        switch (request.requestTypeName) {
            case "طراحی لیبل": return <LabelDetails details={request.details} />;
            case "عکس بسته‌بندی محصولات": return <PackagingPhotoDetails details={request.details} />;
            case "پست اینستاگرام": return <InstagramPostDetails details={request.details} />;
            case "ویدئو تبلیغاتی": return <PromotionalVideoDetails details={request.details} />;
            case "محتوا برای سایت": return <WebsiteContentDetails details={request.details} />;
            case "ویرایش فایل": return <FileEditDetails details={request.details} />;
            case "کالای تبلیغاتی": return <PromotionalItemDetails details={request.details} />;
            case "تبلیغات بصری": return <VisualAdDetails details={request.details} />;
            case "تبلیغات محیطی": return <EnvironmentalAdDetails details={request.details} />;
            case "متفرقه": return <MiscellaneousDetails details={request.details} />;
            default: return null;
        }
    };

    const renderReturnAlert = () => {
        if (request.status !== 2 && request.status !== 5) return null;
        const lastComment = request.histories?.[0]?.comment;
        if (!lastComment) return null;
        return (
            <Alert severity="warning" sx={{ mb: 3 }}>
                <AlertTitle>این درخواست برای اصلاح بازگردانده شده است</AlertTitle>
                <strong>دلیل:</strong> {lastComment}
            </Alert>
        );
    };

    return (
        <Box>
            {isApproverView && (
                <Paper sx={{ p: 3, mb: 3, border: '2px solid', borderColor: 'primary.main', bgcolor: '#e3f2fd' }}>
                    <Typography variant="h5" gutterBottom color="primary.dark">برای تایید شما ارسال شده:</Typography>

                    {lastSubmissionForApproval?.comment && (
                        <Typography variant="body1" sx={{ mt: 2, mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                            <strong>یادداشت طراح:</strong> {lastSubmissionForApproval.comment}
                        </Typography>
                    )}

                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>فایل‌های نهایی:</Typography>
                    <AttachmentList attachments={lastSubmissionForApproval?.attachments || []} />
                </Paper>
            )}

            {renderReturnAlert()}

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" gutterBottom>جزئیات درخواست: {request.title}</Typography>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>شناسه:</strong> {request.id}</Typography></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>وضعیت:</strong> {mapStatusToPersian(request.status)}</Typography></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>اولویت:</strong> {mapPriorityToPersian(request.priority)}</Typography></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>درخواست دهنده:</strong> {request.requesterName}</Typography></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>تاریخ ثبت:</strong> {moment(request.submissionDate).locale('fa').format('jYYYY/jMM/jDD HH:mm')}</Typography></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>تاریخ تحویل:</strong> {request.dueDate ? moment(request.dueDate).locale('fa').format('jYYYY/jMM/jDD HH:mm') : '---'}</Typography></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>طراح:</strong> {request.designerName || '---'}</Typography></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>تایید کننده:</strong> {request.approverName || '---'}</Typography></Grid>
                </Grid>
            </Paper>

            {renderRequestDetails()}

            {/* --- این بخش‌ها حالا شرطی شده‌اند --- */}
            {!isApproverView && (
                <>
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h5" gutterBottom>تمام فایل‌های پیوست</Typography>
                        <AttachmentList attachments={request.attachments} />
                    </Box>

                    <RequestTimeline histories={request.histories} />

                    <Paper sx={{ p: 3, mt: 3 }}>
                        <Typography variant="h5" gutterBottom>گفتگوها</Typography>
                        {isLoadingComments ? <CircularProgress /> : (
                            <Box sx={{ mb: 3 }}>
                                {comments && comments.length > 0 ? (
                                    comments.map((comment: any) => (
                                        <Paper key={comment.id} sx={{ p: 2, mb: 2, bgcolor: 'grey.100' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography variant="subtitle2" component="strong">{comment.authorName}</Typography>
                                                <Typography variant="caption">{moment.utc(comment.createdAt).local().locale('fa').fromNow()}</Typography>
                                            </Box>
                                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{comment.content}</Typography>
                                        </Paper>
                                    ))
                                ) : (
                                    <Typography>هیچ گفتگویی برای این درخواست ثبت نشده است.</Typography>
                                )}
                            </Box>
                        )}
                        {request.status !== 6 && (
                            <Box component="div" sx={{ mt: 3 }}>
                                <TextField fullWidth multiline rows={3} label="نظر خود را بنویسید..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                                <Button variant="contained" sx={{ mt: 1 }} onClick={handleAddComment} disabled={isAddingComment}>
                                    {isAddingComment ? <CircularProgress size={24} /> : 'ارسال نظر'}
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </>
            )}

            <RequestActions request={request} />
        </Box>
    );
};

export default RequestDetailPage;