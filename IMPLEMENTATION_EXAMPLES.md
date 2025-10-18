# 🔨 Implementation Examples - Remaining Pages

## Overview
This document provides ready-to-use code patterns for implementing the remaining pages in the Graphic Request System using the new design system.

---

## 📄 RequestsListPage Enhancement

### Modern Data Table with Filters

```tsx
import { useState } from 'react';
import {
    Box,
    Paper,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    IconButton,
    Chip,
    Stack,
    MenuItem,
    Select,
    FormControl,
    InputLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { TableSkeleton } from '../components/LoadingSkeletons';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// Status mapping
const getStatusChip = (status: number) => {
    const statusMap: Record<number, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
        0: { label: 'ثبت شده', color: 'default' },
        1: { label: 'تخصیص داده شده', color: 'info' },
        2: { label: 'برگشت شده', color: 'error' },
        3: { label: 'در حال انجام', color: 'warning' },
        4: { label: 'در انتظار تایید', color: 'warning' },
        5: { label: 'برگشت از تایید', color: 'error' },
        6: { label: 'تکمیل شده', color: 'success' },
    };
    
    const config = statusMap[status] || { label: 'نامشخص', color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" />;
};

const RequestsListPage = () => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    
    // Your data fetching logic here
    const { data, isLoading } = useGetRequestsQuery({ search, status: statusFilter });
    
    return (
        <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
            <PageHeader
                title="لیست درخواست‌ها"
                subtitle="مشاهده و مدیریت تمام درخواست‌های گرافیکی"
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
            
            {/* Filters */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                        fullWidth
                        placeholder="جستجو در درخواست‌ها..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                    
                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>وضعیت</InputLabel>
                        <Select
                            value={statusFilter}
                            label="وضعیت"
                            onChange={(e) => setStatusFilter(e.target.value)}
                            startAdornment={<FilterListIcon fontSize="small" sx={{ mr: 1, color: 'action.active' }} />}
                        >
                            <MenuItem value="all">همه</MenuItem>
                            <MenuItem value="0">ثبت شده</MenuItem>
                            <MenuItem value="3">در حال انجام</MenuItem>
                            <MenuItem value="4">در انتظار تایید</MenuItem>
                            <MenuItem value="6">تکمیل شده</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>
            
            {/* Table */}
            {isLoading ? (
                <TableSkeleton rows={rowsPerPage} />
            ) : data.length === 0 ? (
                <EmptyState
                    title="درخواستی یافت نشد"
                    description="با فیلترهای مختلف جستجو کنید یا درخواست جدید ثبت کنید"
                    action={{
                        label: 'ثبت درخواست جدید',
                        icon: <AddCircleOutlineIcon />,
                        onClick: () => navigate('/requests/new')
                    }}
                />
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>شماره</TableCell>
                                <TableCell>عنوان</TableCell>
                                <TableCell>نوع</TableCell>
                                <TableCell>درخواست‌کننده</TableCell>
                                <TableCell>تاریخ</TableCell>
                                <TableCell>وضعیت</TableCell>
                                <TableCell align="left">عملیات</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((request) => (
                                <TableRow key={request.id} hover>
                                    <TableCell>{request.id}</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>{request.title}</TableCell>
                                    <TableCell>{request.requestType}</TableCell>
                                    <TableCell>{request.requesterName}</TableCell>
                                    <TableCell>{new Date(request.submissionDate).toLocaleDateString('fa-IR')}</TableCell>
                                    <TableCell>{getStatusChip(request.status)}</TableCell>
                                    <TableCell align="left">
                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton size="small" onClick={() => navigate(`/requests/${request.id}`)}>
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="primary">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={data.length}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
                        labelRowsPerPage="تعداد در صفحه:"
                    />
                </TableContainer>
            )}
        </Box>
    );
};
```

---

## 📝 CreateRequestPage - Multi-Step Wizard

```tsx
import { useState } from 'react';
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Paper,
    Typography,
    Stack,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel
} from '@mui/material';
import PageHeader from '../components/PageHeader';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';

const steps = ['نوع درخواست', 'اطلاعات پایه', 'جزئیات', 'بارگذاری فایل', 'بررسی نهایی'];

const CreateRequestPage = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        requestType: '',
        title: '',
        description: '',
        // ... other fields
    });
    
    const handleNext = () => {
        if (activeStep === steps.length - 1) {
            // Submit form
            handleSubmit();
        } else {
            setActiveStep((prev) => prev + 1);
        }
    };
    
    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };
    
    const renderStepContent = (step: number) => {
        switch (step) {
            case 0:
                return <RequestTypeSelection />;
            case 1:
                return <BasicInformation />;
            case 2:
                return <DetailedInformation />;
            case 3:
                return <FileUpload />;
            case 4:
                return <ReviewAndSubmit />;
            default:
                return null;
        }
    };
    
    return (
        <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
            <PageHeader
                title="ثبت درخواست جدید"
                subtitle="فرایند ثبت درخواست گرافیکی را مرحله به مرحله تکمیل کنید"
                breadcrumbs={[
                    { label: 'خانه', path: '/' },
                    { label: 'درخواست‌ها', path: '/requests' },
                    { label: 'جدید' }
                ]}
            />
            
            {/* Stepper */}
            <Paper sx={{ p: 4, mb: 3, borderRadius: 3 }}>
                <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Paper>
            
            {/* Step Content */}
            <Paper sx={{ p: 4, mb: 3, borderRadius: 3, minHeight: 400 }}>
                {renderStepContent(activeStep)}
            </Paper>
            
            {/* Navigation Buttons */}
            <Stack direction="row" justifyContent="space-between">
                <Button
                    onClick={handleBack}
                    disabled={activeStep === 0}
                    startIcon={<ArrowForwardIcon />}
                    variant="outlined"
                >
                    مرحله قبل
                </Button>
                
                <Button
                    onClick={handleNext}
                    endIcon={activeStep === steps.length - 1 ? <SendIcon /> : <ArrowBackIcon />}
                    variant="contained"
                >
                    {activeStep === steps.length - 1 ? 'ثبت درخواست' : 'مرحله بعد'}
                </Button>
            </Stack>
        </Box>
    );
};

// Step 1: Request Type Selection
const RequestTypeSelection = () => (
    <Box>
        <Typography variant="h6" gutterBottom fontWeight={600}>
            نوع درخواست را انتخاب کنید
        </Typography>
        <Grid container spacing={2} sx={{ mt: 2 }}>
            {requestTypes.map((type) => (
                <Grid key={type.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper
                        sx={{
                            p: 3,
                            textAlign: 'center',
                            cursor: 'pointer',
                            border: '2px solid',
                            borderColor: 'divider',
                            transition: 'all 0.2s',
                            '&:hover': {
                                borderColor: 'primary.main',
                                transform: 'translateY(-4px)',
                                boxShadow: 4,
                            }
                        }}
                    >
                        {type.icon}
                        <Typography variant="subtitle1" fontWeight={600} mt={2}>
                            {type.name}
                        </Typography>
                    </Paper>
                </Grid>
            ))}
        </Grid>
    </Box>
);

// Step 4: File Upload
const FileUpload = () => (
    <Box>
        <Typography variant="h6" gutterBottom fontWeight={600}>
            بارگذاری فایل‌های مرجع
        </Typography>
        <Paper
            sx={{
                mt: 3,
                p: 6,
                textAlign: 'center',
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 3,
                backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
                }
            }}
        >
            <CloudUploadIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
                فایل‌ها را اینجا بکشید یا کلیک کنید
            </Typography>
            <Typography variant="body2" color="text.secondary">
                فرمت‌های مجاز: PNG, JPG, PDF, AI, PSD
            </Typography>
        </Paper>
    </Box>
);
```

---

## 📊 Admin UserManagementPage

```tsx
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { TableSkeleton } from '../components/LoadingSkeletons';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import Grid from '@mui/material/Grid';

const UserManagementPage = () => {
    const { data, isLoading } = useGetUsersQuery();
    const [openAddModal, setOpenAddModal] = useState(false);
    
    return (
        <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
            <PageHeader
                title="مدیریت کاربران"
                subtitle="مشاهده، ویرایش و مدیریت کاربران سیستم"
                breadcrumbs={[
                    { label: 'خانه', path: '/' },
                    { label: 'پنل مدیریت', path: '/admin' },
                    { label: 'کاربران' }
                ]}
                action={{
                    label: 'افزودن کاربر',
                    icon: <PersonAddIcon />,
                    onClick: () => setOpenAddModal(true)
                }}
            />
            
            {/* Statistics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        title="کل کاربران"
                        value={data?.totalUsers || 0}
                        icon={<PeopleIcon sx={{ fontSize: 32 }} />}
                        color="#667eea"
                        variant="gradient"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        title="کاربران فعال"
                        value={data?.activeUsers || 0}
                        icon={<VerifiedUserIcon sx={{ fontSize: 32 }} />}
                        color="#10b981"
                        trend={{ value: 5, direction: 'up' }}
                    />
                </Grid>
                {/* More stats... */}
            </Grid>
            
            {/* Users Table */}
            {isLoading ? (
                <TableSkeleton rows={10} />
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>نام کاربری</TableCell>
                                <TableCell>نام و نام خانوادگی</TableCell>
                                <TableCell>ایمیل</TableCell>
                                <TableCell>نقش‌ها</TableCell>
                                <TableCell>وضعیت</TableCell>
                                <TableCell align="left">عملیات</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data?.users.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                {user.firstName?.[0]}
                                            </Avatar>
                                            <Typography fontWeight={600}>
                                                {user.username}
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                    <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Stack direction="row" spacing={0.5}>
                                            {user.roles.map((role) => (
                                                <Chip
                                                    key={role}
                                                    label={role}
                                                    size="small"
                                                    color="primary"
                                                />
                                            ))}
                                        </Stack>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.isActive ? 'فعال' : 'غیرفعال'}
                                            color={user.isActive ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="left">
                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton size="small" color="primary">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};
```

---

## 🎨 Enhanced Modal Component

```tsx
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Box,
    Divider,
    Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface EnhancedModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    actions?: {
        cancel?: {
            label: string;
            onClick: () => void;
        };
        submit: {
            label: string;
            onClick: () => void;
            loading?: boolean;
            color?: 'primary' | 'error' | 'success';
        };
    };
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const EnhancedModal = ({
    open,
    onClose,
    title,
    icon,
    children,
    actions,
    maxWidth = 'sm'
}: EnhancedModalProps) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                }
            }}
        >
            {/* Title with Icon */}
            <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={2}>
                    {icon && (
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white'
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                    <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                        {title}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Stack>
            </DialogTitle>
            
            <Divider />
            
            {/* Content */}
            <DialogContent sx={{ py: 3 }}>
                {children}
            </DialogContent>
            
            {/* Actions */}
            {actions && (
                <>
                    <Divider />
                    <DialogActions sx={{ p: 2 }}>
                        {actions.cancel && (
                            <Button
                                onClick={actions.cancel.onClick}
                                variant="outlined"
                            >
                                {actions.cancel.label}
                            </Button>
                        )}
                        <Button
                            onClick={actions.submit.onClick}
                            variant="contained"
                            color={actions.submit.color || 'primary'}
                            disabled={actions.submit.loading}
                        >
                            {actions.submit.loading ? 'در حال پردازش...' : actions.submit.label}
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
};

// Usage:
<EnhancedModal
    open={open}
    onClose={handleClose}
    title="افزودن کاربر جدید"
    icon={<PersonAddIcon />}
    actions={{
        cancel: {
            label: 'انصراف',
            onClick: handleClose
        },
        submit: {
            label: 'ذخیره',
            onClick: handleSubmit,
            loading: isSubmitting
        }
    }}
>
    <Stack spacing={3}>
        <TextField fullWidth label="نام کاربری" />
        <TextField fullWidth label="نام" />
        <TextField fullWidth label="نام خانوادگی" />
        {/* More fields... */}
    </Stack>
</EnhancedModal>
```

---

## 📈 Charts Integration (Optional)

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PerformanceChart = ({ data }) => (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
            عملکرد ماهانه
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#10b981" name="تکمیل شده" />
                <Bar dataKey="pending" fill="#f59e0b" name="در حال انجام" />
            </BarChart>
        </ResponsiveContainer>
    </Paper>
);
```

---

## ✅ Final Checklist

### Before Implementation
- [ ] Review DESIGN_SYSTEM_GUIDE.md
- [ ] Import necessary components
- [ ] Set up data fetching hooks
- [ ] Plan responsive breakpoints

### During Implementation
- [ ] Use PageHeader for consistent headers
- [ ] Add loading states (skeletons)
- [ ] Add empty states
- [ ] Use theme colors and spacing
- [ ] Test responsive layout
- [ ] Add error handling

### After Implementation
- [ ] Test all interactions
- [ ] Verify accessibility (keyboard nav, ARIA)
- [ ] Check console for warnings
- [ ] Test on mobile devices
- [ ] Verify RTL layout
- [ ] Performance check

---

**Ready to implement!** Use these patterns as templates for the remaining pages. All components are ready and the design system is fully established.
