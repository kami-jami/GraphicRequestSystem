import { useGetDashboardStatsQuery, useGetInboxCountsQuery, useMarkInboxAsViewedMutation } from '../services/apiSlice';
import { Box, CircularProgress, Paper, Typography, Card, CardContent, LinearProgress, Chip, Alert, Button, Divider, Tabs, Tab } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import EditNoteIcon from '@mui/icons-material/EditNote';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SpeedIcon from '@mui/icons-material/Speed';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import BrushIcon from '@mui/icons-material/Brush';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from './auth/authSlice';

// Quick Action Card Component
interface QuickActionCardProps {
    title: string;
    count: number;
    icon: React.ReactNode;
    gradient: string;
    onClick: () => void;
    description?: string;
    inboxKey?: string;
    refetchInboxCounts?: () => void;
}

const QuickActionCard = ({ title, count, icon, gradient, onClick, description, inboxKey, refetchInboxCounts }: QuickActionCardProps) => {
    const [markInboxAsViewed] = useMarkInboxAsViewedMutation();

    const handleClick = async () => {
        // Mark inbox as viewed before navigating
        if (inboxKey) {
            try {
                await markInboxAsViewed(inboxKey).unwrap();
                // Refetch inbox counts to update badges
                if (refetchInboxCounts) {
                    refetchInboxCounts();
                }
            } catch (error) {
                console.error('Failed to mark inbox as viewed:', error);
            }
        }
        onClick();
    };

    return (
        <Card
            onClick={handleClick}
            sx={{
                cursor: 'pointer',
                height: '100%',
                transition: 'all 0.3s ease',
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative',
                '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '5px',
                    background: gradient
                }
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{
                        background: gradient,
                        borderRadius: '12px',
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        {icon}
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                        <Chip
                            label={count}
                            sx={{
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                background: gradient,
                                color: 'white',
                                minWidth: '50px',
                                height: '36px'
                            }}
                        />
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                            جدید
                        </Typography>
                    </Box>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {title}
                </Typography>
                {description && (
                    <Typography variant="body2" color="text.secondary">
                        {description}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

// Stat Summary Card Component
interface StatSummaryCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
}

const StatSummaryCard = ({ title, value, icon, color, subtitle }: StatSummaryCardProps) => {
    return (
        <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2.5,
            borderRadius: 2,
            backgroundColor: `${color}15`,
            border: `1px solid ${color}30`
        }}>
            <Box sx={{
                backgroundColor: color,
                borderRadius: '12px',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
            }}>
                {icon}
            </Box>
            <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>
                    {value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="caption" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

// Requester Dashboard
const RequesterDashboard = ({ data, inboxCounts, navigate, refetchInboxCounts }: { data: any, inboxCounts: any, navigate: any, refetchInboxCounts: () => void }) => {
    const underReview = inboxCounts.requester_underReview || 0;
    const needsRevision = inboxCounts.requester_needsRevision || 0;
    const completed = inboxCounts.requester_completed || 0;

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    خوش آمدید! 🎨
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    پنل درخواست‌کننده - مدیریت درخواست‌های گرافیکی
                </Typography>
            </Box>

            <Paper
                sx={{
                    p: 3,
                    mb: 4,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <Grid container spacing={3} alignItems="center">
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                            آیا درخواست جدیدی دارید؟
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            درخواست طراحی گرافیکی خود را ثبت کنید و پیگیری کامل داشته باشید
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'right' }}>
                        <Button
                            variant="contained"
                            size="large"
                            startIcon={<AddCircleOutlineIcon />}
                            onClick={() => navigate('/requests/new')}
                            sx={{
                                backgroundColor: 'white',
                                color: '#667eea',
                                fontWeight: 'bold',
                                px: 4,
                                py: 1.5,
                                '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.9)'
                                }
                            }}
                        >
                            ثبت درخواست جدید
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                وضعیت درخواست‌های من
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <QuickActionCard
                        title="در حال بررسی"
                        count={underReview}
                        icon={<HourglassEmptyIcon sx={{ fontSize: 32 }} />}
                        gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                        onClick={() => navigate('/requests?' + new URLSearchParams([0, 1].map(s => ['statuses', s.toString()])).toString())}
                        description="درخواست‌های ثبت شده در انتظار شروع طراحی"
                        inboxKey="requester_underReview"
                        refetchInboxCounts={refetchInboxCounts}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <QuickActionCard
                        title="نیاز به اصلاح"
                        count={needsRevision}
                        icon={<EditNoteIcon sx={{ fontSize: 32 }} />}
                        gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
                        onClick={() => navigate('/requests?' + new URLSearchParams(['2'].map(s => ['statuses', s])).toString())}
                        description="درخواست‌های برگشتی که نیاز به ویرایش دارند"
                        inboxKey="requester_needsRevision"
                        refetchInboxCounts={refetchInboxCounts}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <QuickActionCard
                        title="تکمیل شده"
                        count={completed}
                        icon={<TaskAltIcon sx={{ fontSize: 32 }} />}
                        gradient="linear-gradient(135deg, #30cfd0 0%, #330867 100%)"
                        onClick={() => navigate('/requests?' + new URLSearchParams(['6'].map(s => ['statuses', s])).toString())}
                        description="درخواست‌های نهایی شده و تحویل گرفته شده"
                        inboxKey="requester_completed"
                        refetchInboxCounts={refetchInboxCounts}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                            خلاصه آمار
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <StatSummaryCard
                                title="کل درخواست‌های من"
                                value={data.totalRequests}
                                icon={<AssignmentIcon />}
                                color="#6366f1"
                            />
                            <StatSummaryCard
                                title="درخواست‌های فعال"
                                value={data.pendingRequests}
                                icon={<PendingActionsIcon />}
                                color="#3b82f6"
                                subtitle="در حال پردازش"
                            />
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                            نکات مهم
                        </Typography>
                        <Alert severity="success" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                                ✓ همه درخواست‌ها در زمان مقرر هستند
                            </Typography>
                        </Alert>

                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                نرخ تکمیل کلی
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={data.totalRequests > 0 ? (completed / data.totalRequests * 100) : 0}
                                    sx={{
                                        flex: 1,
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: '#e5e7eb',
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: '#10b981',
                                            borderRadius: 5
                                        }
                                    }}
                                />
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#10b981' }}>
                                    {data.totalRequests > 0 ? Math.round((completed / data.totalRequests * 100)) : 0}%
                                </Typography>
                            </Box>
                        </Box>

                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="caption">
                                💡 نشان روی کارت‌ها تعداد درخواست‌های جدید و بدون بازدید را نشان می‌دهد
                            </Typography>
                        </Alert>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

// Designer Dashboard
const DesignerDashboard = ({ data, inboxCounts, navigate, refetchInboxCounts }: { data: any, inboxCounts: any, navigate: any, refetchInboxCounts: () => void }) => {
    const pendingAction = inboxCounts.designer_pendingAction || 0;
    const inProgress = inboxCounts.designer_inProgress || 0;
    const pendingApproval = inboxCounts.designer_pendingApproval || 0;
    const completed = inboxCounts.designer_completed || 0;

    const activeWorkload = pendingAction + inProgress;

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    خوش آمدید! 🎨
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    پنل طراح - مدیریت پروژه‌های طراحی
                </Typography>
            </Box>

            <Paper sx={{ p: 3, mb: 4, borderRadius: 3, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <SpeedIcon sx={{ fontSize: 40 }} />
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                    بار کاری فعلی شما
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                    پروژه‌هایی که نیاز به توجه شما دارند
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: 2,
                            p: 2,
                            textAlign: 'center'
                        }}>
                            <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
                                {activeWorkload}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                پروژه فعال
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                اولویت‌های کاری
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <QuickActionCard
                        title="نیاز به اقدام"
                        count={pendingAction}
                        icon={<NotificationsActiveIcon sx={{ fontSize: 32 }} />}
                        gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
                        onClick={() => navigate('/requests?' + new URLSearchParams([1, 5].map(s => ['statuses', s.toString()])).toString())}
                        description="درخواست‌های جدید و برگشتی"
                        inboxKey="designer_pendingAction"
                        refetchInboxCounts={refetchInboxCounts}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <QuickActionCard
                        title="در حال انجام"
                        count={inProgress}
                        icon={<PlayCircleIcon sx={{ fontSize: 32 }} />}
                        gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                        onClick={() => navigate('/requests?' + new URLSearchParams(['3'].map(s => ['statuses', s])).toString())}
                        description="پروژه‌های در دست طراحی"
                        inboxKey="designer_inProgress"
                        refetchInboxCounts={refetchInboxCounts}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <QuickActionCard
                        title="منتظر تایید"
                        count={pendingApproval}
                        icon={<AccessTimeIcon sx={{ fontSize: 32 }} />}
                        gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                        onClick={() => navigate('/requests?' + new URLSearchParams(['4'].map(s => ['statuses', s])).toString())}
                        description="آماده برای بررسی"
                        inboxKey="designer_pendingApproval"
                        refetchInboxCounts={refetchInboxCounts}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <QuickActionCard
                        title="تکمیل شده"
                        count={completed}
                        icon={<TaskAltIcon sx={{ fontSize: 32 }} />}
                        gradient="linear-gradient(135deg, #30cfd0 0%, #330867 100%)"
                        onClick={() => navigate('/requests?' + new URLSearchParams(['6'].map(s => ['statuses', s])).toString())}
                        description="پروژه‌های تحویل داده شده"
                        inboxKey="designer_completed"
                        refetchInboxCounts={refetchInboxCounts}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            <AssessmentIcon color="primary" />
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                عملکرد و پیشرفت
                            </Typography>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    پیشرفت کلی پروژه‌ها
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {data.totalRequests > 0 ? Math.round((completed / data.totalRequests * 100)) : 0}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={data.totalRequests > 0 ? (completed / data.totalRequests * 100) : 0}
                                sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: '#e5e7eb',
                                    '& .MuiLinearProgress-bar': {
                                        background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                                        borderRadius: 5
                                    }
                                }}
                            />
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Grid container spacing={2}>
                            <Grid size={6}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f3f4f6', borderRadius: 2 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#3b82f6' }}>
                                        {data.totalRequests}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        کل پروژه‌ها
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid size={6}>
                                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f3f4f6', borderRadius: 2 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#10b981' }}>
                                        {completed}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        تکمیل شده
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                            یادآوری‌ها
                        </Typography>

                        {pendingAction > 0 && (
                            <Alert severity="error" icon={<NotificationsActiveIcon />} sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {pendingAction} پروژه منتظر شروع
                                </Typography>
                                <Typography variant="caption">
                                    لطفاً در اسرع وقت اقدام کنید
                                </Typography>
                            </Alert>
                        )}

                        {data.overdueRequests > 0 ? (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    {data.overdueRequests} پروژه تأخیردار
                                </Typography>
                                <Typography variant="caption">
                                    از مهلت زمانی عقب افتاده‌اند
                                </Typography>
                            </Alert>
                        ) : (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    ✓ همه پروژه‌ها در زمان‌بندی مقرر
                                </Typography>
                            </Alert>
                        )}

                        {pendingApproval > 0 && (
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2">
                                    {pendingApproval} پروژه منتظر تایید نهایی
                                </Typography>
                            </Alert>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

// Approver Dashboard
const ApproverDashboard = ({ data, inboxCounts, navigate, refetchInboxCounts }: { data: any, inboxCounts: any, navigate: any, refetchInboxCounts: () => void }) => {
    const pendingApproval = inboxCounts.approver_pendingApproval || 0;
    const completed = inboxCounts.approver_completed || 0;

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    خوش آمدید! 👔
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    پنل تأییدکننده - بررسی و تایید نهایی پروژه‌ها
                </Typography>
            </Box>

            {pendingApproval > 0 && (
                <Alert
                    severity="warning"
                    icon={<AccessTimeIcon />}
                    sx={{
                        mb: 4,
                        borderRadius: 3,
                        py: 2,
                        '& .MuiAlert-message': { width: '100%' }
                    }}
                >
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{ xs: 12, md: 8 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                {pendingApproval} درخواست منتظر تایید شما
                            </Typography>
                            <Typography variant="body2">
                                پروژه‌های طراحی شده نیاز به بررسی و تایید نهایی دارند
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'right' }}>
                            <Button
                                variant="contained"
                                color="warning"
                                size="large"
                                endIcon={<ArrowBackIcon />}
                                onClick={() => navigate('/requests?' + new URLSearchParams(['4'].map(s => ['statuses', s])).toString())}
                                sx={{ fontWeight: 'bold' }}
                            >
                                مشاهده درخواست‌ها
                            </Button>
                        </Grid>
                    </Grid>
                </Alert>
            )}

            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                وضعیت درخواست‌ها
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <QuickActionCard
                        title="منتظر تایید"
                        count={pendingApproval}
                        icon={<AccessTimeIcon sx={{ fontSize: 40 }} />}
                        gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                        onClick={() => navigate('/requests?' + new URLSearchParams(['4'].map(s => ['statuses', s])).toString())}
                        description="درخواست‌هایی که نیاز به بررسی و تصمیم‌گیری دارند"
                        inboxKey="approver_pendingApproval"
                        refetchInboxCounts={refetchInboxCounts}
                    />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <QuickActionCard
                        title="تایید شده"
                        count={completed}
                        icon={<TaskAltIcon sx={{ fontSize: 40 }} />}
                        gradient="linear-gradient(135deg, #30cfd0 0%, #330867 100%)"
                        onClick={() => navigate('/requests?' + new URLSearchParams(['6'].map(s => ['statuses', s])).toString())}
                        description="درخواست‌های تایید و نهایی شده"
                        inboxKey="approver_completed"
                        refetchInboxCounts={refetchInboxCounts}
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%', textAlign: 'center' }}>
                        <Box sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            color: 'white'
                        }}>
                            <AssignmentIcon sx={{ fontSize: 40 }} />
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {data.totalRequests}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            کل درخواست‌های من
                        </Typography>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%', textAlign: 'center' }}>
                        <Box sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            color: 'white'
                        }}>
                            <PendingActionsIcon sx={{ fontSize: 40 }} />
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {pendingApproval}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            در انتظار تایید
                        </Typography>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 3, borderRadius: 3, height: '100%', textAlign: 'center' }}>
                        <Box sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            color: 'white'
                        }}>
                            <CheckCircleIcon sx={{ fontSize: 40 }} />
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {completed}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            تایید شده
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Paper sx={{ p: 3, mt: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                    نرخ تایید و عملکرد
                </Typography>
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            درصد تکمیل
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#10b981' }}>
                            {data.totalRequests > 0 ? Math.round((completed / data.totalRequests * 100)) : 0}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={data.totalRequests > 0 ? (completed / data.totalRequests * 100) : 0}
                        sx={{
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: '#e5e7eb',
                            '& .MuiLinearProgress-bar': {
                                background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                                borderRadius: 6
                            }
                        }}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

// Main Dashboard Component
const DashboardPage = () => {
    const { data, isLoading, isError } = useGetDashboardStatsQuery();
    const { data: inboxCounts = {}, refetch: refetchInboxCounts } = useGetInboxCountsQuery();
    const user = useSelector(selectCurrentUser);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress size={60} />
            </Box>
        );
    }

    if (isError || !data) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                <Typography variant="h5" color="error">خطا در دریافت اطلاعات داشبورد</Typography>
            </Box>
        );
    }

    const userRoles = user?.roles || [];

    // Build list of available dashboards based on user roles
    const availableDashboards = [];
    if (userRoles.includes('Requester')) {
        availableDashboards.push({
            role: 'Requester',
            label: 'درخواست‌کننده',
            icon: <PersonIcon />,
            component: <RequesterDashboard data={data} inboxCounts={inboxCounts} navigate={navigate} refetchInboxCounts={refetchInboxCounts} />
        });
    }
    if (userRoles.includes('Designer')) {
        availableDashboards.push({
            role: 'Designer',
            label: 'طراح',
            icon: <BrushIcon />,
            component: <DesignerDashboard data={data} inboxCounts={inboxCounts} navigate={navigate} refetchInboxCounts={refetchInboxCounts} />
        });
    }
    if (userRoles.includes('Approver')) {
        availableDashboards.push({
            role: 'Approver',
            label: 'تأییدکننده',
            icon: <VerifiedUserIcon />,
            component: <ApproverDashboard data={data} inboxCounts={inboxCounts} navigate={navigate} refetchInboxCounts={refetchInboxCounts} />
        });
    }

    // If no dashboards available
    if (availableDashboards.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h5" color="text.secondary">
                    داشبورد در دسترس نیست
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    نقش کاربری شما تعیین نشده است
                </Typography>
            </Box>
        );
    }

    // If only one dashboard, show it directly without tabs
    if (availableDashboards.length === 1) {
        return availableDashboards[0].component;
    }

    // Multiple dashboards - show tabs
    return (
        <Box>
            {/* Role Selector Tabs */}
            <Paper sx={{ mb: 3, borderRadius: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    variant="fullWidth"
                    sx={{
                        '& .MuiTab-root': {
                            minHeight: '64px',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        },
                        '& .Mui-selected': {
                            color: 'primary.main'
                        }
                    }}
                >
                    {availableDashboards.map((dashboard) => (
                        <Tab
                            key={dashboard.role}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {dashboard.icon}
                                    <span>{dashboard.label}</span>
                                </Box>
                            }
                        />
                    ))}
                </Tabs>
            </Paper>

            {/* Active Dashboard Content */}
            <Box>
                {availableDashboards[activeTab]?.component}
            </Box>
        </Box>
    );
};

export default DashboardPage;