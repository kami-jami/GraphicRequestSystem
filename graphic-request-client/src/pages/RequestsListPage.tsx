import { useGetRequestsQuery, useMarkRequestAsViewedMutation } from '../services/apiSlice';
import {
    Box,
    Paper,
    Typography,
    TextField,
    InputAdornment,
    Chip,
    IconButton,
    Stack,
    Menu,
    MenuItem,
    Pagination,
    alpha,
    useTheme,
    Button,
    Badge,
    Tooltip,
    Avatar,
    Card,
    CardContent,
    Divider,
    Alert
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import moment from 'moment-jalaali';
import { useState, useEffect } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import BrushIcon from '@mui/icons-material/Brush';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import FlagIcon from '@mui/icons-material/Flag';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import SortIcon from '@mui/icons-material/Sort';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';

// Status configuration with colors and icons
const STATUS_CONFIG: Record<number, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error'; bgColor: string }> = {
    0: { label: 'در حال بررسی', color: 'info', bgColor: '#dbeafe' },
    1: { label: 'در حال بررسی', color: 'info', bgColor: '#dbeafe' },
    2: { label: 'برگشت شده', color: 'error', bgColor: '#fee2e2' },
    3: { label: 'در حال انجام', color: 'warning', bgColor: '#fef3c7' },
    4: { label: 'منتظر تایید', color: 'warning', bgColor: '#fce7f3' },
    5: { label: 'برگشت از تایید', color: 'error', bgColor: '#fee2e2' },
    6: { label: 'تکمیل شده', color: 'success', bgColor: '#dcfce7' },
};

const PRIORITY_CONFIG: Record<number, { label: string; color: string; icon: React.ReactNode }> = {
    0: { label: 'عادی', color: '#64748b', icon: <FlagIcon fontSize="small" /> },
    1: { label: 'فوری', color: '#ef4444', icon: <PriorityHighIcon fontSize="small" /> },
};

const getWorklistTitle = (statuses: string[]): string => {
    const statusStr = statuses.sort().join(',');
    const titles: Record<string, string> = {
        '0,1': 'در حال بررسی',
        '2': 'نیاز به اصلاح',
        '6': 'تکمیل شده',
        '1,5': 'نیاز به اقدام',
        '3': 'در حال انجام',
        '4': 'منتظر تایید',
        '3,5': 'درخواست‌های فعال',
    };
    return titles[statusStr] || 'همه درخواست‌ها';
};

// Map status combinations to inbox categories
const getInboxCategory = (statuses: number[]): string | undefined => {
    const statusStr = statuses.sort().join(',');
    const categoryMap: Record<string, string> = {
        '0,1': 'requester_underReview',
        '2': 'requester_needsRevision',
        '1,5': 'designer_pendingAction',
        '3': 'designer_inProgress',
        '4': 'designer_pendingApproval',
        '3,5': 'designer_inProgress',
    };
    return categoryMap[statusStr];
};

const RequestsListPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const [searchParams, setSearchParams] = useSearchParams();
    const [pageTitle, setPageTitle] = useState('همه درخواست‌ها');
    const [inboxType, setInboxType] = useState<'inbox' | 'outbox' | 'completed' | 'all'>('all');
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const [page, setPage] = useState(1);
    const itemsPerPage = viewMode === 'card' ? 12 : 20;

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<number[]>([]);
    const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
    const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
    const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date');

    useEffect(() => {
        const statusesFromUrl = searchParams.getAll('statuses');
        const searchTermFromUrl = searchParams.get('searchTerm') || '';
        const inboxTypeFromUrl = searchParams.get('inboxType') as 'inbox' | 'outbox' | 'completed' | 'all' || 'all';

        setStatusFilter(statusesFromUrl.map(s => Number(s)));
        setSearchTerm(searchTermFromUrl);
        setInboxType(inboxTypeFromUrl);

        // Set page title based on inbox type and statuses
        // Check for specific status combinations first
        if (statusesFromUrl.length === 1 && statusesFromUrl[0] === '2') {
            setPageTitle('✏️ نیاز به اصلاح');
        } else {
            const inboxTitles: Record<string, string> = {
                'inbox': '📥 صندوق ورودی',
                'outbox': '📤 ارسال شده',
                'completed': '✅ تکمیل شده',
                'all': 'همه درخواست‌ها'
            };
            setPageTitle(inboxTitles[inboxTypeFromUrl] || getWorklistTitle(statusesFromUrl));
        }
    }, [searchParams]);

    const [markRequestAsViewed] = useMarkRequestAsViewedMutation();

    // Handle request click - mark as viewed and navigate
    const handleRequestClick = async (requestId: number) => {
        // Mark request as viewed on backend
        try {
            await markRequestAsViewed(requestId).unwrap();
        } catch (error) {
            console.error('Failed to mark request as viewed:', error);
        }

        // Navigate to request details
        navigate(`/requests/${requestId}`);
    };

    const inboxCategory = getInboxCategory(statusFilter);

    const { data: requests, isLoading, refetch, isFetching } = useGetRequestsQuery({
        statuses: statusFilter,
        searchTerm: searchTerm,
        inboxCategory: inboxCategory,
    });

    const handleRefresh = async () => {
        await refetch();
    };

    const handleStatusFilterChange = (value: number[]) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('statuses');
        value.forEach(s => newParams.append('statuses', s.toString()));
        setSearchParams(newParams);
        setPage(1);
    };

    const toggleStatusFilter = (status: number) => {
        const newFilter = statusFilter.includes(status)
            ? statusFilter.filter(s => s !== status)
            : [...statusFilter, status];
        handleStatusFilterChange(newFilter);
    };

    // Sort and filter requests
    const sortedRequests = requests ? [...requests].sort((a, b) => {
        // Apply sorting based on user selection
        switch (sortBy) {
            case 'priority':
                return (b.priority || 0) - (a.priority || 0);
            case 'status':
                return (a.status || 0) - (b.status || 0);
            case 'date':
            default: {
                // Sort by last status change date (or submission date if no history)
                const aDate = a.lastStatusChangeDate || a.submissionDate || a.dueDate;
                const bDate = b.lastStatusChangeDate || b.submissionDate || b.dueDate;
                return new Date(bDate).getTime() - new Date(aDate).getTime();
            }
        }
    }) : [];

    const paginatedRequests = sortedRequests.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);

    const activeFiltersCount = statusFilter.length;

    // Calculate unread count
    const unreadCount = sortedRequests.filter(r => r.isUnread).length;

    return (
        <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
            <PageHeader
                title={pageTitle}
                subtitle={
                    unreadCount > 0
                        ? `${sortedRequests.length} درخواست (${unreadCount} خوانده نشده)`
                        : `${sortedRequests.length} درخواست یافت شد`
                }
                breadcrumbs={[
                    { label: 'خانه', path: '/' },
                    { label: 'درخواست‌ها' }
                ]}
                action={{
                    label: 'ثبت درخواست جدید',
                    icon: <AddCircleOutlineIcon />,
                    onClick: () => navigate('/requests/new')
                }}
            />

            {/* Info Alert for Email-like Experience */}
            {unreadCount > 0 && inboxType === 'inbox' && (
                <Alert
                    severity="info"
                    sx={{ mb: 3, borderRadius: 3 }}
                    icon={<FiberManualRecordIcon sx={{ color: 'info.main' }} />}
                >
                    <Typography variant="body2">
                        شما <strong>{unreadCount} درخواست خوانده نشده</strong> دارید.
                        درخواست‌های جدید با پس‌زمینه آبی و برچسب "جدید" مشخص شده‌اند.
                        با کلیک روی هر درخواست، به عنوان خوانده شده علامت‌گذاری می‌شود.
                    </Typography>
                </Alert>
            )}

            {/* Filters and Controls */}
            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    mb: 3,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    background: alpha(theme.palette.background.paper, 0.8),
                }}
            >
                <Stack spacing={2}>
                    {/* Search and View Controls */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                        <TextField
                            fullWidth
                            placeholder="جستجو بر اساس عنوان، شناسه، نوع درخواست یا نام درخواست‌دهنده..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'background.paper',
                                }
                            }}
                        />

                        <Stack direction="row" spacing={1}>
                            {/* Filter Button */}
                            <Tooltip title="فیلترها">
                                <Badge badgeContent={activeFiltersCount} color="primary">
                                    <Button
                                        variant={activeFiltersCount > 0 ? 'contained' : 'outlined'}
                                        startIcon={<FilterListIcon />}
                                        onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                                        sx={{ minWidth: 120 }}
                                    >
                                        فیلتر
                                    </Button>
                                </Badge>
                            </Tooltip>

                            {/* Sort Button */}
                            <Tooltip title="مرتب‌سازی">
                                <Button
                                    variant="outlined"
                                    startIcon={<SortIcon />}
                                    onClick={(e) => setSortAnchorEl(e.currentTarget)}
                                    sx={{ minWidth: 120 }}
                                >
                                    مرتب‌سازی
                                </Button>
                            </Tooltip>

                            {/* Refresh Button */}
                            <Tooltip title="بازخوانی لیست">
                                <IconButton
                                    color="primary"
                                    onClick={handleRefresh}
                                    disabled={isFetching}
                                    sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                        },
                                        '&.Mui-disabled': {
                                            borderColor: 'divider',
                                        }
                                    }}
                                >
                                    <RefreshIcon
                                        sx={{
                                            animation: isFetching ? 'spin 1s linear infinite' : 'none',
                                            '@keyframes spin': {
                                                '0%': { transform: 'rotate(0deg)' },
                                                '100%': { transform: 'rotate(360deg)' }
                                            }
                                        }}
                                    />
                                </IconButton>
                            </Tooltip>

                            {/* View Mode Toggle */}
                            <Stack direction="row" spacing={0.5} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 0.5 }}>
                                <IconButton
                                    size="small"
                                    onClick={() => setViewMode('card')}
                                    sx={{
                                        bgcolor: viewMode === 'card' ? 'primary.main' : 'transparent',
                                        color: viewMode === 'card' ? 'white' : 'action.active',
                                        '&:hover': {
                                            bgcolor: viewMode === 'card' ? 'primary.dark' : 'action.hover',
                                        }
                                    }}
                                >
                                    <ViewModuleIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={() => setViewMode('list')}
                                    sx={{
                                        bgcolor: viewMode === 'list' ? 'primary.main' : 'transparent',
                                        color: viewMode === 'list' ? 'white' : 'action.active',
                                        '&:hover': {
                                            bgcolor: viewMode === 'list' ? 'primary.dark' : 'action.hover',
                                        }
                                    }}
                                >
                                    <ViewListIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        </Stack>
                    </Stack>

                    {/* Active Filters Display */}
                    {activeFiltersCount > 0 && (
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Typography variant="caption" color="text.secondary">
                                    فیلترهای فعال:
                                </Typography>
                                {statusFilter.map(status => (
                                    <Chip
                                        key={status}
                                        label={STATUS_CONFIG[status]?.label || status}
                                        size="small"
                                        onDelete={() => toggleStatusFilter(status)}
                                        color={STATUS_CONFIG[status]?.color || 'default'}
                                    />
                                ))}
                                <Button
                                    size="small"
                                    onClick={() => handleStatusFilterChange([])}
                                    sx={{ minWidth: 'auto' }}
                                >
                                    پاک کردن همه
                                </Button>
                            </Stack>
                        </Box>
                    )}
                </Stack>
            </Paper>

            {/* Filter Menu */}
            <Menu
                anchorEl={filterAnchorEl}
                open={Boolean(filterAnchorEl)}
                onClose={() => setFilterAnchorEl(null)}
                PaperProps={{
                    sx: { minWidth: 250, borderRadius: 2, mt: 1 }
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        فیلتر بر اساس وضعیت
                    </Typography>
                    <Stack spacing={1} sx={{ mt: 1.5 }}>
                        {/* Under Review - combines statuses 0 and 1 */}
                        <MenuItem
                            onClick={() => {
                                const hasAny = statusFilter.includes(0) || statusFilter.includes(1);
                                if (hasAny) {
                                    // Remove both
                                    handleStatusFilterChange(statusFilter.filter(s => s !== 0 && s !== 1));
                                } else {
                                    // Add both
                                    handleStatusFilterChange([...statusFilter, 0, 1]);
                                }
                            }}
                            selected={statusFilter.includes(0) || statusFilter.includes(1)}
                            sx={{ borderRadius: 1 }}
                        >
                            <Chip
                                label="در حال بررسی"
                                size="small"
                                color="info"
                                sx={{ mr: 1 }}
                            />
                        </MenuItem>

                        {/* Other statuses */}
                        {Object.entries(STATUS_CONFIG)
                            .filter(([status]) => status !== '0' && status !== '1')
                            .map(([status, config]) => (
                                <MenuItem
                                    key={status}
                                    onClick={() => toggleStatusFilter(Number(status))}
                                    selected={statusFilter.includes(Number(status))}
                                    sx={{ borderRadius: 1 }}
                                >
                                    <Chip
                                        label={config.label}
                                        size="small"
                                        color={config.color}
                                        sx={{ mr: 1 }}
                                    />
                                </MenuItem>
                            ))}
                    </Stack>
                </Box>
            </Menu>

            {/* Sort Menu */}
            <Menu
                anchorEl={sortAnchorEl}
                open={Boolean(sortAnchorEl)}
                onClose={() => setSortAnchorEl(null)}
                PaperProps={{
                    sx: { minWidth: 200, borderRadius: 2, mt: 1 }
                }}
            >
                <MenuItem
                    selected={sortBy === 'date'}
                    onClick={() => { setSortBy('date'); setSortAnchorEl(null); }}
                >
                    جدیدترین
                </MenuItem>
                <MenuItem
                    selected={sortBy === 'priority'}
                    onClick={() => { setSortBy('priority'); setSortAnchorEl(null); }}
                >
                    اولویت
                </MenuItem>
                <MenuItem
                    selected={sortBy === 'status'}
                    onClick={() => { setSortBy('status'); setSortAnchorEl(null); }}
                >
                    وضعیت
                </MenuItem>
            </Menu>

            {/* Content */}
            {isLoading ? (
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{ p: 2 }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 2, borderBottom: i < 5 ? '1px solid' : 'none', borderColor: 'divider' }}>
                                <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'grey.200' }} />
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ width: '60%', height: 20, bgcolor: 'grey.200', borderRadius: 1, mb: 1 }} />
                                    <Box sx={{ width: '40%', height: 16, bgcolor: 'grey.100', borderRadius: 1 }} />
                                </Box>
                                <Box sx={{ width: 100, height: 24, bgcolor: 'grey.200', borderRadius: 2 }} />
                                <Box sx={{ width: 80, height: 24, bgcolor: 'grey.100', borderRadius: 2 }} />
                            </Box>
                        ))}
                    </Box>
                </Paper>
            ) : paginatedRequests.length === 0 ? (
                <EmptyState
                    title={
                        inboxType === 'inbox' ? '📥 صندوق ورودی خالی است' :
                            inboxType === 'outbox' ? '📤 هیچ درخواست ارسالی ندارید' :
                                inboxType === 'completed' ? '✅ هیچ درخواست تکمیل شده‌ای ندارید' :
                                    'درخواستی یافت نشد'
                    }
                    description={
                        inboxType === 'inbox' ? 'درخواست جدیدی برای شما ارسال نشده است' :
                            inboxType === 'outbox' ? 'درخواست جدیدی ثبت کنید تا در این بخش نمایش داده شود' :
                                inboxType === 'completed' ? 'هنوز هیچ درخواستی تکمیل نشده است' :
                                    'با تغییر فیلترها یا جستجوی مجدد، درخواست مورد نظر خود را پیدا کنید'
                    }
                    action={
                        inboxType === 'outbox' ? {
                            label: 'ثبت درخواست جدید',
                            onClick: () => navigate('/requests/new')
                        } : {
                            label: 'پاک کردن فیلترها',
                            onClick: () => {
                                handleStatusFilterChange([]);
                                setSearchTerm('');
                            }
                        }
                    }
                />
            ) : viewMode === 'card' ? (
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                    }}
                >
                    <Box sx={{ overflowX: 'auto' }}>
                        <Box sx={{ minWidth: 900 }}>
                            {/* Table Header */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '80px 1fr 200px 120px 150px 140px 100px',
                                    gap: 2,
                                    p: 2,
                                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                                    borderBottom: '2px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <Typography variant="caption" fontWeight={700} color="text.secondary">شناسه</Typography>
                                <Typography variant="caption" fontWeight={700} color="text.secondary">عنوان درخواست</Typography>
                                <Typography variant="caption" fontWeight={700} color="text.secondary">نوع درخواست</Typography>
                                <Typography variant="caption" fontWeight={700} color="text.secondary">وضعیت</Typography>
                                <Typography variant="caption" fontWeight={700} color="text.secondary">درخواست‌دهنده</Typography>
                                <Typography variant="caption" fontWeight={700} color="text.secondary">تاریخ تحویل</Typography>
                                <Typography variant="caption" fontWeight={700} color="text.secondary">اولویت</Typography>
                            </Box>

                            {/* Table Rows */}
                            {paginatedRequests.map((request, index) => (
                                <RequestTableRow
                                    key={request.id}
                                    request={request}
                                    isLast={index === paginatedRequests.length - 1}
                                    onClick={() => handleRequestClick(request.id)}
                                />
                            ))}
                        </Box>
                    </Box>
                </Paper>
            ) : (
                <Stack spacing={2}>
                    {paginatedRequests.map((request) => (
                        <RequestListItem
                            key={request.id}
                            request={request}
                            onClick={() => handleRequestClick(request.id)}
                        />
                    ))}
                </Stack>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_e, value) => setPage(value)}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )}
        </Box>
    );
};

// Request Table Row Component
const RequestTableRow = ({ request, isLast, onClick }: { request: any; isLast: boolean; onClick: () => void }) => {
    const theme = useTheme();
    const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG[0];
    const priorityConfig = PRIORITY_CONFIG[request.priority || 0];
    const isOverdue = request.dueDate && new Date(request.dueDate) < new Date() && request.status !== 6;
    const isUnread = request.isUnread || false;

    return (
        <Box
            onClick={onClick}
            sx={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 200px 120px 150px 140px 100px',
                gap: 2,
                p: 2,
                alignItems: 'center',
                cursor: 'pointer',
                borderBottom: isLast ? 'none' : '1px solid',
                borderColor: 'divider',
                bgcolor: isUnread ? alpha(theme.palette.info.main, 0.08) : 'transparent',
                borderRight: isUnread ? `3px solid ${theme.palette.info.main}` : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                    bgcolor: isUnread ? alpha(theme.palette.info.main, 0.12) : alpha(theme.palette.primary.main, 0.02),
                    '& .view-icon': {
                        opacity: 1,
                        transform: 'translateX(-4px)',
                    }
                }
            }}
        >
            {/* ID */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip
                    label={`#${request.id}`}
                    size="small"
                    sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                    }}
                />
                {isUnread && (
                    <Chip
                        label="جدید"
                        size="small"
                        sx={{
                            bgcolor: theme.palette.info.main,
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            height: 18,
                        }}
                    />
                )}
            </Box>

            {/* Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                <Typography
                    variant="body2"
                    fontWeight={isUnread ? 700 : 600}
                    sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: isUnread ? 'text.primary' : 'text.primary',
                    }}
                >
                    {request.title}
                </Typography>
                <VisibilityIcon
                    className="view-icon"
                    fontSize="small"
                    sx={{
                        opacity: 0,
                        transition: 'all 0.2s ease',
                        color: 'primary.main',
                        flexShrink: 0,
                    }}
                />
            </Box>

            {/* Request Type */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    minWidth: 0,
                }}
            >
                <BrushIcon sx={{ fontSize: 14, color: 'primary.main', flexShrink: 0 }} />
                <Typography variant="caption" color="primary.main" fontWeight={600} noWrap>
                    {request.requestTypeName || request.requestType?.name || request.requestType || 'نامشخص'}
                </Typography>
            </Box>

            {/* Status */}
            <Chip
                label={statusConfig.label}
                size="small"
                color={statusConfig.color}
                sx={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                }}
            />

            {/* Requester */}
            <Typography variant="caption" color="text.secondary" noWrap>
                {request.requesterName}
            </Typography>

            {/* Due Date */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarTodayIcon
                    fontSize="small"
                    sx={{
                        fontSize: 14,
                        color: isOverdue ? 'error.main' : 'text.secondary',
                    }}
                />
                <Typography
                    variant="caption"
                    color={isOverdue ? 'error.main' : 'text.secondary'}
                    fontWeight={isOverdue ? 600 : 400}
                    noWrap
                >
                    {request.dueDate ? moment(request.dueDate).locale('fa').format('jMM/jDD') : '---'}
                </Typography>
            </Box>

            {/* Priority */}
            <Chip
                label={priorityConfig.label}
                size="small"
                sx={{
                    bgcolor: alpha(priorityConfig.color, 0.1),
                    color: priorityConfig.color,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                }}
            />
        </Box>
    );
};

// Request Card Component (kept for reference, not used)
const RequestCard = ({ request, onClick }: { request: any; onClick: () => void }) => {
    const theme = useTheme();
    const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG[0];
    const priorityConfig = PRIORITY_CONFIG[request.priority || 0];

    const isOverdue = request.dueDate && new Date(request.dueDate) < new Date() && request.status !== 6;

    // Get the color for the status
    const getStatusColor = () => {
        const colorKey = statusConfig.color;
        if (colorKey === 'default') return theme.palette.grey[500];
        return theme.palette[colorKey]?.main || theme.palette.primary.main;
    };

    return (
        <Card
            onClick={onClick}
            sx={{
                cursor: 'pointer',
                height: '100%',
                transition: 'all 0.3s ease',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                    borderColor: 'primary.main',
                },
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(135deg, ${statusConfig.bgColor} 0%, ${getStatusColor()} 100%)`,
                    borderRadius: '12px 12px 0 0',
                }
            }}
        >
            <CardContent sx={{ p: 2.5, pt: 3 }}>
                <Stack spacing={2}>
                    {/* Header with ID and Status */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            #{request.id}
                        </Typography>
                        <Chip
                            label={statusConfig.label}
                            size="small"
                            color={statusConfig.color}
                            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                        />
                    </Stack>

                    {/* Title */}
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            fontSize: '1rem',
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            minHeight: '2.6em',
                        }}
                    >
                        {request.title}
                    </Typography>

                    {/* Request Type */}
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                            alignSelf: 'flex-start',
                        }}
                    >
                        <BrushIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                        <Typography variant="caption" fontWeight={600} color="primary.main">
                            {request.requestTypeName}
                        </Typography>
                    </Box>

                    <Divider />

                    {/* Meta Information */}
                    <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <PersonIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                            <Typography variant="caption" color="text.secondary">
                                {request.requesterName}
                            </Typography>
                        </Stack>

                        {request.designerName && (
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <BrushIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                                <Typography variant="caption" color="text.secondary">
                                    طراح: {request.designerName}
                                </Typography>
                            </Stack>
                        )}

                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                                <CalendarTodayIcon fontSize="small" sx={{ color: isOverdue ? 'error.main' : 'text.secondary', fontSize: 16 }} />
                                <Typography
                                    variant="caption"
                                    color={isOverdue ? 'error.main' : 'text.secondary'}
                                    fontWeight={isOverdue ? 600 : 400}
                                >
                                    {request.dueDate ? moment(request.dueDate).locale('fa').format('jYYYY/jMM/jDD') : 'بدون مهلت'}
                                </Typography>
                            </Stack>

                            {request.priority > 0 && (
                                <Chip
                                    label={priorityConfig.label}
                                    size="small"
                                    sx={{
                                        bgcolor: alpha(priorityConfig.color, 0.1),
                                        color: priorityConfig.color,
                                        fontWeight: 600,
                                        height: 20,
                                    }}
                                />
                            )}
                        </Stack>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

// Request List Item Component
const RequestListItem = ({ request, onClick }: { request: any; onClick: () => void }) => {
    const theme = useTheme();
    const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG[0];
    const priorityConfig = PRIORITY_CONFIG[request.priority || 0];
    const isOverdue = request.dueDate && new Date(request.dueDate) < new Date() && request.status !== 6;
    const isUnread = request.isUnread || false;

    return (
        <Paper
            onClick={onClick}
            sx={{
                p: 2.5,
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: '1px solid',
                borderColor: isUnread ? 'info.main' : 'divider',
                bgcolor: isUnread ? alpha(theme.palette.info.main, 0.05) : 'background.paper',
                borderRight: isUnread ? `4px solid ${theme.palette.info.main}` : 'none',
                '&:hover': {
                    borderColor: isUnread ? 'info.dark' : 'primary.main',
                    boxShadow: isUnread
                        ? `0 4px 12px ${alpha(theme.palette.info.main, 0.2)}`
                        : `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                    transform: 'translateX(-4px)',
                }
            }}
        >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
                {/* Avatar with ID */}
                <Avatar
                    sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        fontWeight: 700,
                        width: 48,
                        height: 48,
                    }}
                >
                    #{request.id}
                </Avatar>

                {/* Main Content */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography
                                variant="subtitle1"
                                fontWeight={isUnread ? 800 : 700}
                                sx={{
                                    flex: 1,
                                    minWidth: 200,
                                    color: isUnread ? 'text.primary' : 'text.primary',
                                }}
                            >
                                {request.title}
                            </Typography>
                            {isUnread && (
                                <Chip
                                    label="جدید"
                                    size="small"
                                    sx={{
                                        bgcolor: theme.palette.info.main,
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '0.7rem',
                                        height: 20,
                                    }}
                                />
                            )}
                            <Chip
                                label={statusConfig.label}
                                size="small"
                                color={statusConfig.color}
                                sx={{ fontWeight: 600 }}
                            />
                        </Stack>

                        <Stack direction="row" spacing={3} flexWrap="wrap">
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <BrushIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                                <Typography variant="caption" color="text.secondary">
                                    {request.requestTypeName || request.requestType?.name || request.requestType || 'نامشخص'}
                                </Typography>
                            </Stack>

                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <PersonIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
                                <Typography variant="caption" color="text.secondary">
                                    {request.requesterName}
                                </Typography>
                            </Stack>

                            {request.designerName && (
                                <Typography variant="caption" color="text.secondary">
                                    طراح: {request.designerName}
                                </Typography>
                            )}

                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <CalendarTodayIcon fontSize="small" sx={{ color: isOverdue ? 'error.main' : 'text.secondary', fontSize: 16 }} />
                                <Typography
                                    variant="caption"
                                    color={isOverdue ? 'error.main' : 'text.secondary'}
                                    fontWeight={isOverdue ? 600 : 400}
                                >
                                    {request.dueDate ? moment(request.dueDate).locale('fa').format('jYYYY/jMM/jDD') : 'بدون مهلت'}
                                </Typography>
                            </Stack>

                            {request.priority > 0 && (
                                <Chip
                                    label={priorityConfig.label}
                                    size="small"
                                    sx={{
                                        bgcolor: alpha(priorityConfig.color, 0.1),
                                        color: priorityConfig.color,
                                        fontWeight: 600,
                                        height: 20,
                                    }}
                                />
                            )}
                        </Stack>
                    </Stack>
                </Box>

                {/* Action */}
                <IconButton
                    size="small"
                    sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                            bgcolor: 'primary.main',
                            color: 'white',
                        }
                    }}
                >
                    <VisibilityIcon fontSize="small" />
                </IconButton>
            </Stack>
        </Paper>
    );
};

export default RequestsListPage;