import { useParams, useLocation } from 'react-router-dom';
import { useGetRequestByIdQuery, useGetRequestCommentsQuery, useAddCommentMutation } from '../services/apiSlice';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Alert,
    AlertTitle,
    Chip,
    Stack,
    Card,
    CardContent,
    Avatar,
    Stepper,
    Step,
    StepLabel,
    Tab,
    Tabs,
    alpha,
    useTheme,
    Badge
} from '@mui/material';
import Grid from '@mui/material/Grid';
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
import PageHeader from '../components/PageHeader';
import { DetailSkeleton, CardSkeleton } from '../components/LoadingSkeletons';

// Icons
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TimelineIcon from '@mui/icons-material/Timeline';
import CommentIcon from '@mui/icons-material/Comment';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import BrushIcon from '@mui/icons-material/Brush';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import SendIcon from '@mui/icons-material/Send';
import FlagIcon from '@mui/icons-material/Flag';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Status configuration
const STATUS_CONFIG: Record<number, {
    label: string;
    color: 'default' | 'info' | 'warning' | 'success' | 'error';
    icon: React.ReactNode;
    description: string;
}> = {
    0: { label: 'ثبت شده', color: 'default', icon: <InfoOutlinedIcon />, description: 'درخواست ثبت و در انتظار بررسی است' },
    1: { label: 'تخصیص داده شده', color: 'info', icon: <PersonIcon />, description: 'به طراح تخصیص داده شده است' },
    2: { label: 'برگشت شده', color: 'error', icon: <WarningIcon />, description: 'نیاز به اصلاح دارد' },
    3: { label: 'در حال انجام', color: 'warning', icon: <BrushIcon />, description: 'در حال طراحی است' },
    4: { label: 'منتظر تایید', color: 'warning', icon: <TimelineIcon />, description: 'در انتظار تایید مدیر' },
    5: { label: 'برگشت از تایید', color: 'error', icon: <WarningIcon />, description: 'نیاز به طراحی مجدد' },
    6: { label: 'تکمیل شده', color: 'success', icon: <CheckCircleIcon />, description: 'تایید و تکمیل شده است' },
};

const PRIORITY_CONFIG: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
    0: { label: 'عادی', color: '#64748b', icon: <FlagIcon /> },
    1: { label: 'متوسط', color: '#f59e0b', icon: <FlagIcon /> },
    2: { label: 'فوری', color: '#ef4444', icon: <PriorityHighIcon /> },
};

// Workflow steps
const WORKFLOW_STEPS = [
    { label: 'ثبت', statuses: [0] },
    { label: 'تخصیص', statuses: [1] },
    { label: 'طراحی', statuses: [2, 3, 5] },
    { label: 'تایید', statuses: [4] },
    { label: 'تکمیل', statuses: [6] },
];

const RequestDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const theme = useTheme();
    const requestId = Number(id);
    const user = useSelector(selectCurrentUser);
    const [activeTab, setActiveTab] = useState(0);

    const { data: request, isLoading: isLoadingRequest, isError, refetch } = useGetRequestByIdQuery(requestId, {
        skip: !requestId,
        refetchOnMountOrArgChange: true,
    });

    const [newComment, setNewComment] = useState('');
    const { data: comments, isLoading: isLoadingComments, refetch: refetchComments } = useGetRequestCommentsQuery(requestId, {
        skip: !requestId,
        refetchOnMountOrArgChange: true,
        refetchOnFocus: true
    });
    const [addComment, { isLoading: isAddingComment }] = useAddCommentMutation();

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
        return (
            <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
                <DetailSkeleton />
            </Box>
        );
    }

    if (isError || !request) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error" variant="h6">خطا در دریافت جزئیات درخواست</Typography>
            </Box>
        );
    }

    const isApproverView = request.status === 4 && user?.id === request.approverId;
    const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG[0];
    const priorityConfig = PRIORITY_CONFIG[request.priority || 0];
    const isOverdue = request.dueDate && new Date(request.dueDate) < new Date() && request.status !== 6;

    // Check if user has any available actions
    const hasActions = user && (
        // Designer can start design (status 1)
        (request.status === 1 && user.id === request.designerId) ||
        // Designer can send for approval or complete (status 3 or 5)
        ((request.status === 3 || request.status === 5) && user.id === request.designerId) ||
        // Approver can approve/reject (status 4)
        (request.status === 4 && user.id === request.approverId) ||
        // Requester can edit/resubmit (status 2)
        (request.status === 2 && user.id === request.requesterId)
    );

    // Get the color for the status
    const getStatusColor = (type: 'main' | 'light' = 'main') => {
        const colorKey = statusConfig.color;
        if (colorKey === 'default') {
            return type === 'main' ? theme.palette.grey[500] : theme.palette.grey[300];
        }
        const paletteColor = theme.palette[colorKey];
        return type === 'main' ? paletteColor.main : paletteColor.light;
    };

    const lastSubmissionForApproval = request.histories
        ?.filter((h: any) => h.newStatus === 4)
        .sort((a: any, b: any) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime())[0];

    // Calculate workflow progress
    const getActiveStep = () => {
        for (let i = WORKFLOW_STEPS.length - 1; i >= 0; i--) {
            if (WORKFLOW_STEPS[i].statuses.includes(request.status)) {
                return i;
            }
        }
        return 0;
    };

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
            <Alert
                severity="warning"
                icon={<WarningIcon />}
                sx={{
                    mb: 3,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'warning.main',
                    '& .MuiAlert-message': { width: '100%' }
                }}
            >
                <AlertTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    این درخواست برای اصلاح بازگردانده شده است
                </AlertTitle>
                <Paper sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.warning.main, 0.05), border: '1px dashed', borderColor: 'warning.main' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>دلیل:</strong>
                    </Typography>
                    <Typography variant="body1">{lastComment}</Typography>
                </Paper>
            </Alert>
        );
    };

    return (
        <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
            <PageHeader
                title={request.title}
                subtitle={`درخواست شماره ${request.id}`}
                breadcrumbs={[
                    { label: 'خانه', path: '/' },
                    { label: 'درخواست‌ها', path: '/requests' },
                    { label: `#${request.id}` }
                ]}
                action={{
                    label: 'بازگشت',
                    icon: <ArrowBackIcon />,
                    onClick: () => window.history.back()
                }}
            />

            {/* Approver View Banner */}
            {isApproverView && (
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 3,
                        border: '2px solid',
                        borderColor: 'primary.main',
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`,
                    }}
                >
                    <Stack spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                                <CheckCircleIcon fontSize="large" />
                            </Avatar>
                            <Box>
                                <Typography variant="h5" fontWeight={700} color="primary.dark">
                                    برای تایید شما ارسال شده
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    لطفاً فایل‌های نهایی را بررسی و تصمیم خود را اعلام کنید
                                </Typography>
                            </Box>
                        </Stack>

                        {lastSubmissionForApproval?.comment && (
                            <Paper sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    یادداشت طراح:
                                </Typography>
                                <Typography variant="body1">{lastSubmissionForApproval.comment}</Typography>
                            </Paper>
                        )}

                        <Box>
                            <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AttachFileIcon fontSize="small" />
                                فایل‌های نهایی:
                            </Typography>
                            <AttachmentList attachments={lastSubmissionForApproval?.attachments || []} />
                        </Box>

                        {/* Actions for Approver */}
                        <Box sx={{ pt: 2 }}>
                            <RequestActions request={request} />
                        </Box>
                    </Stack>
                </Paper>
            )}

            {/* Return Alert */}
            {renderReturnAlert()}

            {/* Status and Progress */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 3,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    background: alpha(theme.palette.background.paper, 0.8),
                }}
            >
                <Grid container spacing={3}>
                    {/* Status Card */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card
                            elevation={0}
                            sx={{
                                height: '100%',
                                border: '2px solid',
                                borderColor: `${statusConfig.color}.main`,
                                background: `linear-gradient(135deg, ${alpha(getStatusColor('main'), 0.05)} 0%, ${alpha(getStatusColor('light'), 0.1)} 100%)`,
                            }}
                        >
                            <CardContent>
                                <Stack spacing={1.5} alignItems="center" textAlign="center">
                                    <Avatar
                                        sx={{
                                            bgcolor: `${statusConfig.color}.main`,
                                            width: 56,
                                            height: 56,
                                        }}
                                    >
                                        {statusConfig.icon}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            وضعیت فعلی
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700}>
                                            {statusConfig.label}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {statusConfig.description}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Priority Card */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card elevation={0} sx={{ height: '100%', border: '1px solid', borderColor: 'divider' }}>
                            <CardContent>
                                <Stack spacing={1.5} alignItems="center" textAlign="center">
                                    <Avatar
                                        sx={{
                                            bgcolor: alpha(priorityConfig.color, 0.1),
                                            color: priorityConfig.color,
                                            width: 56,
                                            height: 56,
                                        }}
                                    >
                                        {priorityConfig.icon}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            اولویت
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700} sx={{ color: priorityConfig.color }}>
                                            {priorityConfig.label}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Due Date Card */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card
                            elevation={0}
                            sx={{
                                height: '100%',
                                border: isOverdue ? '2px solid' : '1px solid',
                                borderColor: isOverdue ? 'error.main' : 'divider',
                                background: isOverdue ? alpha(theme.palette.error.main, 0.05) : 'transparent',
                            }}
                        >
                            <CardContent>
                                <Stack spacing={1.5} alignItems="center" textAlign="center">
                                    <Avatar
                                        sx={{
                                            bgcolor: isOverdue ? 'error.main' : alpha(theme.palette.info.main, 0.1),
                                            color: isOverdue ? 'white' : 'info.main',
                                            width: 56,
                                            height: 56,
                                        }}
                                    >
                                        <CalendarTodayIcon />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            تاریخ تحویل
                                        </Typography>
                                        <Typography variant="h6" fontWeight={700} color={isOverdue ? 'error.main' : 'text.primary'}>
                                            {request.dueDate ? moment(request.dueDate).locale('fa').format('jYYYY/jMM/jDD') : 'بدون مهلت'}
                                        </Typography>
                                        {isOverdue && (
                                            <Chip label="تأخیر دارد" size="small" color="error" sx={{ mt: 0.5, fontWeight: 600 }} />
                                        )}
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Workflow Progress */}
                <Box sx={{ mt: 4 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                        پیشرفت کار:
                    </Typography>
                    <Stepper activeStep={getActiveStep()} alternativeLabel>
                        {WORKFLOW_STEPS.map((step, index) => (
                            <Step key={step.label} completed={index < getActiveStep()}>
                                <StepLabel>{step.label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Box>
            </Paper>

            {/* Tabs */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden',
                }}
            >
                <Tabs
                    value={activeTab}
                    onChange={(_e, value) => setActiveTab(value)}
                    variant="fullWidth"
                    sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                    }}
                >
                    {isApproverView ? (
                        <Tab
                            icon={<InfoOutlinedIcon />}
                            iconPosition="start"
                            label="اطلاعات"
                        />
                    ) : (
                        [
                            <Tab
                                key="overview"
                                icon={<InfoOutlinedIcon />}
                                iconPosition="start"
                                label="اطلاعات"
                            />,
                            <Tab
                                key="attachments"
                                icon={
                                    <Badge badgeContent={request.attachments?.length || 0} color="primary">
                                        <AttachFileIcon />
                                    </Badge>
                                }
                                iconPosition="start"
                                label="پیوست‌ها"
                            />,
                            <Tab
                                key="timeline"
                                icon={<TimelineIcon />}
                                iconPosition="start"
                                label="تاریخچه"
                            />,
                            <Tab
                                key="comments"
                                icon={
                                    <Badge badgeContent={comments?.length || 0} color="primary">
                                        <CommentIcon />
                                    </Badge>
                                }
                                iconPosition="start"
                                label="گفتگوها"
                            />
                        ]
                    )}
                </Tabs>

                <Box sx={{ p: 3 }}>
                    {/* Tab 0: Overview - Always visible */}
                    {activeTab === 0 && (
                        <Stack spacing={3}>
                            {/* Basic Info */}
                            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                                        اطلاعات پایه
                                    </Typography>
                                    <Grid container spacing={3}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" color="text.secondary">نوع درخواست</Typography>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <BrushIcon fontSize="small" color="primary" />
                                                    <Typography variant="body1" fontWeight={600}>{request.requestTypeName}</Typography>
                                                </Stack>
                                            </Stack>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" color="text.secondary">درخواست‌دهنده</Typography>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <PersonIcon fontSize="small" color="action" />
                                                    <Typography variant="body1" fontWeight={600}>{request.requesterName}</Typography>
                                                </Stack>
                                            </Stack>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" color="text.secondary">طراح</Typography>
                                                <Typography variant="body1" fontWeight={600}>{request.designerName || '---'}</Typography>
                                            </Stack>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" color="text.secondary">تایید‌کننده</Typography>
                                                <Typography variant="body1" fontWeight={600}>{request.approverName || '---'}</Typography>
                                            </Stack>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" color="text.secondary">تاریخ ثبت</Typography>
                                                <Typography variant="body1" fontWeight={600}>
                                                    {moment(request.submissionDate).locale('fa').format('jYYYY/jMM/jDD - HH:mm')}
                                                </Typography>
                                            </Stack>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Stack spacing={0.5}>
                                                <Typography variant="caption" color="text.secondary">تاریخ تحویل</Typography>
                                                <Typography variant="body1" fontWeight={600}>
                                                    {request.dueDate ? moment(request.dueDate).locale('fa').format('jYYYY/jMM/jDD - HH:mm') : 'بدون مهلت'}
                                                </Typography>
                                            </Stack>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            {/* Request Details */}
                            {renderRequestDetails()}
                        </Stack>
                    )}

                    {/* Tabs for non-approver view only */}
                    {!isApproverView && (
                        <>
                            {/* Tab 1: Attachments */}
                            {activeTab === 1 && (
                                <Box>
                                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ mb: 2 }}>
                                        فایل‌های پیوست شده
                                    </Typography>
                                    <AttachmentList attachments={request.attachments} />
                                </Box>
                            )}

                            {/* Tab 2: Timeline */}
                            {activeTab === 2 && (
                                <RequestTimeline histories={request.histories} />
                            )}

                            {/* Tab 3: Comments */}
                            {activeTab === 3 && (
                                <Stack spacing={3}>
                                    <Typography variant="h6" fontWeight={700}>
                                        گفتگوها
                                    </Typography>

                                    {isLoadingComments ? (
                                        <CardSkeleton />
                                    ) : comments && comments.length > 0 ? (
                                        <Stack spacing={2}>
                                            {comments.map((comment: { id: number; authorName?: string; author?: string; createdAt: string; content: string }) => {
                                                const authorName = comment.authorName || comment.author || 'کاربر';
                                                return (
                                                    <Paper
                                                        key={comment.id}
                                                        elevation={0}
                                                        sx={{
                                                            p: 2.5,
                                                            borderRadius: 3,
                                                            border: '1px solid',
                                                            borderColor: 'divider',
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': {
                                                                borderColor: 'primary.main',
                                                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                                                            }
                                                        }}
                                                    >
                                                        <Stack direction="row" spacing={2}>
                                                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                                {authorName.charAt(0).toUpperCase()}
                                                            </Avatar>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                                                    <Typography variant="subtitle2" fontWeight={700}>
                                                                        {authorName}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        {moment.utc(comment.createdAt).local().locale('fa').fromNow()}
                                                                    </Typography>
                                                                </Stack>
                                                                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                                                                    {comment.content}
                                                                </Typography>
                                                            </Box>
                                                        </Stack>
                                                    </Paper>
                                                );
                                            })}
                                        </Stack>
                                    ) : (
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 4,
                                                textAlign: 'center',
                                                border: '1px dashed',
                                                borderColor: 'divider',
                                                borderRadius: 3,
                                            }}
                                        >
                                            <CommentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                            <Typography color="text.secondary">هنوز گفتگویی ثبت نشده است</Typography>
                                        </Paper>
                                    )}

                                    {request.status !== 6 && (
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 3,
                                                borderRadius: 3,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                bgcolor: alpha(theme.palette.primary.main, 0.02),
                                            }}
                                        >
                                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                                افزودن نظر جدید
                                            </Typography>
                                            <Stack spacing={2}>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={4}
                                                    placeholder="نظر خود را بنویسید..."
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            bgcolor: 'background.paper',
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    variant="contained"
                                                    endIcon={<SendIcon />}
                                                    onClick={handleAddComment}
                                                    disabled={isAddingComment || !newComment.trim()}
                                                    sx={{ alignSelf: 'flex-start' }}
                                                >
                                                    {isAddingComment ? 'در حال ارسال...' : 'ارسال نظر'}
                                                </Button>
                                            </Stack>
                                        </Paper>
                                    )}
                                </Stack>
                            )}
                        </>
                    )}
                </Box>
            </Paper>

            {/* Actions - Sticky Bottom for Non-Approver */}
            {!isApproverView && hasActions && (
                <Paper
                    elevation={3}
                    sx={{
                        position: 'sticky',
                        bottom: 16,
                        mt: 3,
                        p: 2,
                        borderRadius: 3,
                        border: '2px solid',
                        borderColor: 'primary.main',
                        bgcolor: 'background.paper',
                        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                >
                    <RequestActions request={request} />
                </Paper>
            )}
        </Box>
    );
};

export default RequestDetailPage;