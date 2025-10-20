import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    CircularProgress,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Chip,
    Backdrop,
    Paper,
    Stack,
    Divider,
    Alert,
    alpha,
    useTheme,
    LinearProgress
} from '@mui/material';
import { useGetRequestByIdQuery, useCreateRequestMutation, useUpdateRequestMutation, useGetAvailabilityQuery, useGetLookupItemsQuery, useGetPublicSettingsQuery } from '../services/apiSlice';
import { useNavigate, useParams } from 'react-router-dom';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import moment from 'moment-jalaali';
import type { Moment } from 'moment-jalaali';
import { useDispatch, useSelector } from 'react-redux';
import { showNotification } from '../services/notificationSlice';
import PageHeader from '../components/PageHeader';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { selectCurrentUserToken } from './auth/authSlice';

// Icons
import ClearIcon from '@mui/icons-material/Clear';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryIcon from '@mui/icons-material/Category';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BlockIcon from '@mui/icons-material/Block';

interface AttachmentFile {
    id?: number;
    originalFileName: string;
    file?: File;
}

interface LookupItem {
    id: number;
    value: string;
}

interface AvailabilityItem {
    date: string;
    isNormalSlotAvailable: boolean;
    isUrgentSlotAvailable: boolean;
    normalSlotsUsed: number;
    normalSlotsTotal: number;
    urgentSlotsUsed: number;
    urgentSlotsTotal: number;
    normalSlotsRemaining: number;
    urgentSlotsRemaining: number;
}

interface RequestDetails {
    productNameFA?: string;
    productNameEN?: string;
    brand?: string;
    labelTypeId?: number;
    technicalSpecs?: string;
    dimensions?: string;
    printQuantity?: number;
    measurementValue?: string;
    measurementUnitId?: number;
    productName?: string;
    topic?: string;
    description?: string;
    contentTypeId?: number;
    itemName?: string;
    quantity?: string;
    adTypeId?: number;
}

const RequestTypeValues = {
    Label: "طراحی لیبل",
    PackagingPhoto: "عکس بسته‌بندی محصولات",
    InstagramPost: "پست اینستاگرام",
    PromotionalVideo: "ویدئو تبلیغاتی",
    WebsiteContent: "محتوا برای سایت",
    FileEdit: "ویرایش فایل",
    PromotionalItem: "کالای تبلیغاتی",
    VisualAd: "تبلیغات بصری",
    EnvironmentalAd: "تبلیغات محیطی",
    Miscellaneous: "متفرقه"
};

// تابع برای یافتن ID نوع درخواست بر اساس نام
const findRequestTypeIdByName = (requestTypesLookup: LookupItem[] | undefined, requestTypeName: string): number | '' => {
    if (!requestTypesLookup || !requestTypeName) return '';
    const found = requestTypesLookup.find(item => item.value === requestTypeName);
    return found ? found.id : '';
};

const CreateRequestPage = () => {
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const theme = useTheme();
    const requestDetailsRef = useRef<HTMLDivElement>(null);
    const token = useSelector(selectCurrentUserToken); // For SignalR connection

    const { data: existingRequestData, isLoading: isLoadingExisting, refetch } = useGetRequestByIdQuery(Number(id), {
        skip: !isEditMode
        // Removed refetchOnMountOrArgChange to prevent refetch after navigation on edit
    });
    const [createRequest, { isLoading: isCreating }] = useCreateRequestMutation();
    const [updateRequest, { isLoading: isUpdating }] = useUpdateRequestMutation();

    const [title, setTitle] = useState('');
    const [selectedRequestTypeId, setSelectedRequestTypeId] = useState<number | ''>('');
    const [priority, setPriority] = useState<number>(0);
    const [dueDate, setDueDate] = useState<Moment | null>(null);
    const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

    // State های اختصاصی برای همه انواع درخواست
    const [labelDetails, setLabelDetails] = useState({
        productNameFA: '',
        productNameEN: '',
        brand: '',
        labelTypeId: '',
        technicalSpecs: '',
        dimensions: '',
        printQuantity: '',
        measurementValue: '',
        measurementUnitId: ''
    });
    const [packagingPhotoDetails, setPackagingPhotoDetails] = useState({ productName: '', brand: '', description: '' });
    const [instagramPostDetails, setInstagramPostDetails] = useState({ topic: '', description: '' });
    const [promotionalVideoDetails, setPromotionalVideoDetails] = useState({ productName: '', brand: '', description: '' });
    const [websiteContentDetails, setWebsiteContentDetails] = useState({ contentTypeId: '', topic: '', description: '' });
    const [fileEditDetails, setFileEditDetails] = useState({ topic: '', description: '' });
    const [promotionalItemDetails, setPromotionalItemDetails] = useState({ itemName: '', quantity: '', description: '' });
    const [visualAdDetails, setVisualAdDetails] = useState({ adTypeId: '', brand: '', description: '' });
    const [environmentalAdDetails, setEnvironmentalAdDetails] = useState({ adTypeId: '', description: '', quantity: '' });
    const [miscellaneousDetails, setMiscellaneousDetails] = useState({ topic: '', description: '' });

    // State برای مدیریت وضعیت بارگذاری
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Fetch public settings to get Orderable Days Range (accessible to all users)
    const { data: publicSettings } = useGetPublicSettingsQuery();

    // Calculate date range based on system setting
    const orderableDaysRange = publicSettings?.find((s: any) => s.settingKey === 'OrderableDaysInFuture')?.settingValue || '30';
    const daysRange = parseInt(orderableDaysRange, 10);

    const startDate = moment().locale('en').format('YYYY-MM-DD');
    const endDate = moment().add(daysRange, 'days').locale('en').format('YYYY-MM-DD');
    const { data: availabilityData, isLoading: isLoadingAvailability } = useGetAvailabilityQuery({ startDate, endDate });

    const { data: requestTypesLookup, isLoading: isLoadingRequestTypes } = useGetLookupItemsQuery(1);
    const { data: labelTypes, isLoading: isLoadingLabelTypes } = useGetLookupItemsQuery(2);
    const { data: measurementUnits } = useGetLookupItemsQuery(3);
    const { data: visualAdTypes } = useGetLookupItemsQuery(4);
    const { data: environmentalAdTypes } = useGetLookupItemsQuery(5);
    const { data: websiteContentTypes } = useGetLookupItemsQuery(6);

    const isLoading = isLoadingRequestTypes || isLoadingLabelTypes || isLoadingAvailability || (isEditMode && isLoadingExisting);

    useEffect(() => {
        if (isEditMode && existingRequestData && requestTypesLookup && !isLoading && isInitialLoad) {
            console.log('Loading existing data for edit:', existingRequestData);
            console.log('Request types lookup:', requestTypesLookup);

            setTitle(existingRequestData.title || '');

            // پیدا کردن ID نوع درخواست بر اساس نام
            const requestTypeId = findRequestTypeIdByName(requestTypesLookup, existingRequestData.requestTypeName);
            console.log('Found request type ID:', requestTypeId, 'for name:', existingRequestData.requestTypeName);

            setSelectedRequestTypeId(requestTypeId);
            setPriority(existingRequestData.priority || 0);
            setDueDate(existingRequestData.dueDate ? moment(existingRequestData.dueDate) : null);
            setAttachments(existingRequestData.attachments || []);

            // اگر details null نیست، داده‌ها را بارگذاری کن
            if (existingRequestData.details) {
                console.log('Details data:', existingRequestData.details);

                switch (existingRequestData.requestTypeName) {
                    case RequestTypeValues.Label:
                        setLabelDetails({
                            productNameFA: existingRequestData.details.productNameFA || '',
                            productNameEN: existingRequestData.details.productNameEN || '',
                            brand: existingRequestData.details.brand || '',
                            labelTypeId: existingRequestData.details.labelTypeId?.toString() || '',
                            technicalSpecs: existingRequestData.details.technicalSpecs || '',
                            dimensions: existingRequestData.details.dimensions || '',
                            printQuantity: existingRequestData.details.printQuantity?.toString() || '',
                            measurementValue: existingRequestData.details.measurementValue || '',
                            measurementUnitId: existingRequestData.details.measurementUnitId?.toString() || ''
                        });
                        break;
                    case RequestTypeValues.PackagingPhoto:
                        setPackagingPhotoDetails({
                            productName: existingRequestData.details.productName || '',
                            brand: existingRequestData.details.brand || '',
                            description: existingRequestData.details.description || ''
                        });
                        break;
                    case RequestTypeValues.InstagramPost:
                        setInstagramPostDetails({
                            topic: existingRequestData.details.topic || '',
                            description: existingRequestData.details.description || ''
                        });
                        break;
                    case RequestTypeValues.PromotionalVideo:
                        setPromotionalVideoDetails({
                            productName: existingRequestData.details.productName || '',
                            brand: existingRequestData.details.brand || '',
                            description: existingRequestData.details.description || ''
                        });
                        break;
                    case RequestTypeValues.WebsiteContent:
                        setWebsiteContentDetails({
                            contentTypeId: existingRequestData.details.contentTypeId?.toString() || '',
                            topic: existingRequestData.details.topic || '',
                            description: existingRequestData.details.description || ''
                        });
                        break;
                    case RequestTypeValues.FileEdit:
                        setFileEditDetails({
                            topic: existingRequestData.details.topic || '',
                            description: existingRequestData.details.description || ''
                        });
                        break;
                    case RequestTypeValues.PromotionalItem:
                        setPromotionalItemDetails({
                            itemName: existingRequestData.details.itemName || '',
                            quantity: existingRequestData.details.quantity?.toString() || '',
                            description: existingRequestData.details.description || ''
                        });
                        break;
                    case RequestTypeValues.VisualAd:
                        setVisualAdDetails({
                            adTypeId: existingRequestData.details.adTypeId?.toString() || '',
                            brand: existingRequestData.details.brand || '',
                            description: existingRequestData.details.description || ''
                        });
                        break;
                    case RequestTypeValues.EnvironmentalAd:
                        setEnvironmentalAdDetails({
                            adTypeId: existingRequestData.details.adTypeId?.toString() || '',
                            description: existingRequestData.details.description || '',
                            quantity: existingRequestData.details.quantity?.toString() || ''
                        });
                        break;
                    case RequestTypeValues.Miscellaneous:
                        setMiscellaneousDetails({
                            topic: existingRequestData.details.topic || '',
                            description: existingRequestData.details.description || ''
                        });
                        break;
                    default:
                        console.warn('Unknown request type:', existingRequestData.requestTypeName);
                }
            } else {
                console.log('No details found in existing data');
            }

            setIsInitialLoad(false);
        }
    }, [isEditMode, existingRequestData, requestTypesLookup, isLoading, isInitialLoad]);

    // Scroll to request details when request type is selected
    useEffect(() => {
        if (selectedRequestTypeId && requestDetailsRef.current && !isEditMode) {
            setTimeout(() => {
                requestDetailsRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 300);
        }
    }, [selectedRequestTypeId, isEditMode]);

    // Real-time capacity updates via SignalR
    useEffect(() => {
        if (!token) return;

        const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

        const connection = new HubConnectionBuilder()
            .withUrl(`${baseUrl}/hubs/notifications`, {
                accessTokenFactory: () => token || '',
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        // Listen for capacity updates
        connection.on('CapacityUpdated', (data: { date: string; timestamp: string }) => {
            console.log('Capacity updated for date:', data.date);

            // Show notification about capacity update
            // The availability data will be refetched automatically on next date picker interaction
            dispatch(showNotification({
                message: 'ظرفیت تاریخ‌ها به‌روزرسانی شد',
                severity: 'info'
            }));

            // Note: We don't reload the page to avoid interrupting user's work
            // RTK Query cache will be automatically invalidated by the backend's InboxUpdate signal
        });

        connection
            .start()
            .then(() => console.log('SignalR Connected for capacity updates'))
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    console.error('SignalR Connection Error: ', err);
                }
            });

        return () => {
            connection.stop();
        };
    }, [token, dispatch]); // Run when token or dispatch changes

    const getAvailabilityForDay = (day: Moment): AvailabilityItem | null => {
        if (!availabilityData) return null;
        return availabilityData.find((d: AvailabilityItem) => moment(d.date).isSame(day, 'day')) || null;
    };

    const shouldDisableDate = (day: Moment) => {
        if (!availabilityData) return false;
        const dayAvailability = getAvailabilityForDay(day);
        if (!dayAvailability) return false;
        if (priority === 0 && !dayAvailability.isNormalSlotAvailable) return true;
        if (priority === 1 && !dayAvailability.isUrgentSlotAvailable) return true;
        return false;
    };

    const getAvailabilityStatus = (day: Moment | null): 'available' | 'limited' | 'full' | 'none' => {
        if (!day || !availabilityData) return 'none';
        const availability = getAvailabilityForDay(day);
        if (!availability) return 'none';

        const slotsRemaining = priority === 0 ? availability.normalSlotsRemaining : availability.urgentSlotsRemaining;
        const slotsTotal = priority === 0 ? availability.normalSlotsTotal : availability.urgentSlotsTotal;

        if (slotsRemaining === 0) return 'full';
        if (slotsRemaining <= slotsTotal * 0.3) return 'limited';
        return 'available';
    };

    const getAvailabilityColor = (status: 'available' | 'limited' | 'full' | 'none') => {
        switch (status) {
            case 'available': return theme.palette.success.main;
            case 'limited': return theme.palette.warning.main;
            case 'full': return theme.palette.error.main;
            default: return theme.palette.text.disabled;
        }
    };

    const getAvailabilityIcon = (status: 'available' | 'limited' | 'full' | 'none') => {
        switch (status) {
            case 'available': return <CheckCircleIcon fontSize="small" />;
            case 'limited': return <WarningAmberIcon fontSize="small" />;
            case 'full': return <BlockIcon fontSize="small" />;
            default: return null;
        }
    };

    const getSelectedRequestType = () => {
        return requestTypesLookup?.find((item: LookupItem) => item.id === selectedRequestTypeId)?.value;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                originalFileName: file.name,
                file: file
            }));
            setAttachments(prev => [...prev, ...newFiles]);
        }
    };

    const handleRemoveAttachment = (fileNameToRemove: string) => {
        setAttachments(prev => prev.filter(att => att.originalFileName !== fileNameToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // اعتبارسنجی اولیه
        if (!title.trim()) {
            dispatch(showNotification({ message: 'عنوان درخواست الزامی است', severity: 'error' }));
            return;
        }

        if (!selectedRequestTypeId) {
            dispatch(showNotification({ message: 'نوع درخواست الزامی است', severity: 'error' }));
            return;
        }

        const formData = new FormData();

        // داده‌های اصلی
        formData.append('title', title.trim());
        formData.append('requestTypeId', selectedRequestTypeId.toString());
        formData.append('priority', priority.toString());

        if (dueDate) {
            formData.append('dueDate', dueDate.toISOString());
        }

        // اضافه کردن id برای حالت ویرایش
        if (isEditMode) {
            formData.append('id', id!);
        }

        const requestType = getSelectedRequestType();
        console.log('Submitting request type:', requestType);

        // داده‌های اختصاصی بر اساس نوع درخواست - استفاده از ساختار درست
        switch (requestType) {
            case RequestTypeValues.Label:
                for (const [key, value] of Object.entries(labelDetails)) {
                    if (value !== null && value !== undefined && value !== '') {
                        formData.append(`labelDetails.${key}`, String(value));
                    }
                }
                break;
            case RequestTypeValues.PackagingPhoto:
                for (const [key, value] of Object.entries(packagingPhotoDetails)) {
                    if (value !== null && value !== undefined && value !== '') {
                        formData.append(`packagingPhotoDetails.${key}`, String(value));
                    }
                }
                break;
            case RequestTypeValues.InstagramPost:
                for (const [key, value] of Object.entries(instagramPostDetails)) {
                    if (value !== null && value !== undefined && value !== '') {
                        formData.append(`instagramPostDetails.${key}`, String(value));
                    }
                }
                break;
            case RequestTypeValues.PromotionalVideo:
                for (const [key, value] of Object.entries(promotionalVideoDetails)) {
                    if (value !== null && value !== undefined && value !== '') {
                        formData.append(`promotionalVideoDetails.${key}`, String(value));
                    }
                }
                break;
            case RequestTypeValues.WebsiteContent:
                for (const [key, value] of Object.entries(websiteContentDetails)) {
                    if (value !== null && value !== undefined && value !== '') {
                        formData.append(`websiteContentDetails.${key}`, String(value));
                    }
                }
                break;
            case RequestTypeValues.FileEdit:
                for (const [key, value] of Object.entries(fileEditDetails)) {
                    if (value !== null && value !== undefined && value !== '') {
                        formData.append(`fileEditDetails.${key}`, String(value));
                    }
                }
                break;
            case RequestTypeValues.PromotionalItem:
                for (const [key, value] of Object.entries(promotionalItemDetails)) {
                    if (value !== null && value !== undefined && value !== '') {
                        formData.append(`promotionalItemDetails.${key}`, String(value));
                    }
                }
                break;
            case RequestTypeValues.VisualAd:
                for (const [key, value] of Object.entries(visualAdDetails)) {
                    if (value !== null && value !== undefined && value !== '') {
                        formData.append(`visualAdDetails.${key}`, String(value));
                    }
                }
                break;
            case RequestTypeValues.EnvironmentalAd:
                for (const [key, value] of Object.entries(environmentalAdDetails)) {
                    if (value !== null && value !== undefined && value !== '') {
                        formData.append(`environmentalAdDetails.${key}`, String(value));
                    }
                }
                break;
            case RequestTypeValues.Miscellaneous:
                for (const [key, value] of Object.entries(miscellaneousDetails)) {
                    if (value !== null && value !== undefined && value !== '') {
                        formData.append(`miscellaneousDetails.${key}`, String(value));
                    }
                }
                break;
        }

        // مدیریت فایل‌های پیوست
        const existingAttachmentIds = attachments
            .filter(att => att.id)
            .map(att => att.id!);

        const newFiles = attachments
            .filter(att => att.file)
            .map(att => att.file!);

        for (const id of existingAttachmentIds) {
            formData.append('ExistingAttachmentIds', id.toString());
        }

        for (const file of newFiles) {
            formData.append('files', file);
        }

        // لاگ داده‌های ارسالی برای دیباگ
        console.log('FormData contents:');
        for (const [key, value] of formData.entries()) {
            console.log(key, value);
        }

        try {
            if (isEditMode) {
                const result = await updateRequest({
                    requestId: Number(id),
                    data: formData
                }).unwrap();

                console.log('Update result:', result);

                dispatch(showNotification({
                    message: 'درخواست با موفقیت ویرایش شد!',
                    severity: 'success'
                }));

                // نویگیت مستقیم
                navigate(`/requests/${id}`);

            } else {
                await createRequest(formData).unwrap();
                dispatch(showNotification({
                    message: 'درخواست با موفقیت ثبت شد!',
                    severity: 'success'
                }));
                navigate('/requests');
            }
        } catch (err: any) {
            console.error('Error submitting form:', err);

            // Better error message handling
            let errorMessage = 'بروز خطا در ثبت درخواست';

            if (err.status === 'FETCH_ERROR') {
                errorMessage = 'خطا در ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.';
            } else if (err.status === 401) {
                errorMessage = 'دسترسی غیرمجاز. لطفاً دوباره وارد شوید.';
            } else if (err.status === 403) {
                errorMessage = 'شما اجازه انجام این عملیات را ندارید.';
            } else if (err.status === 404) {
                errorMessage = 'درخواست مورد نظر یافت نشد.';
            } else if (err.status >= 500) {
                errorMessage = 'خطای سرور. لطفاً با پشتیبانی تماس بگیرید.';
            } else if (err.data?.message) {
                errorMessage = err.data.message;
            } else if (err.data?.title) {
                errorMessage = err.data.title;
            }

            dispatch(showNotification({
                message: errorMessage,
                severity: 'error'
            }));
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
                <Stack spacing={2} alignItems="center">
                    <CircularProgress size={60} thickness={4} />
                    <Typography variant="h6" color="text.secondary">
                        در حال بارگذاری...
                    </Typography>
                </Stack>
            </Box>
        );
    }

    const selectedRequestTypeName = getSelectedRequestType();

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            {/* Backdrop for submission */}
            <Backdrop
                sx={{
                    color: '#fff',
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    backdropFilter: 'blur(4px)',
                    background: alpha(theme.palette.primary.main, 0.1)
                }}
                open={isCreating || isUpdating}
            >
                <Paper
                    elevation={24}
                    sx={{
                        p: 4,
                        borderRadius: 3,
                        textAlign: 'center',
                        minWidth: 300
                    }}
                >
                    <CircularProgress size={60} thickness={4} sx={{ mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        {isEditMode ? 'در حال ذخیره تغییرات...' : 'در حال ثبت درخواست...'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        لطفاً منتظر بمانید
                    </Typography>
                </Paper>
            </Backdrop>

            {/* Page Header */}
            <PageHeader
                title={isEditMode ? `ویرایش درخواست #${id}` : 'ثبت درخواست جدید'}
                subtitle={isEditMode ? 'ویرایش اطلاعات درخواست' : 'لطفاً اطلاعات درخواست خود را با دقت وارد کنید'}
                breadcrumbs={[
                    { label: 'خانه', path: '/' },
                    { label: 'درخواست‌ها', path: '/requests' },
                    { label: isEditMode ? 'ویرایش' : 'ثبت جدید' }
                ]}
                action={{
                    label: 'بازگشت',
                    icon: <ArrowBackIcon />,
                    onClick: () => navigate(-1)
                }}
            />

            <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                    {/* Section 1: Basic Information */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            background: alpha(theme.palette.background.paper, 0.8)
                        }}
                    >
                        <Stack spacing={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <InfoOutlinedIcon sx={{ color: 'white' }} />
                                </Box>
                                <Box>
                                    <Typography variant="h6" fontWeight={700}>
                                        اطلاعات پایه درخواست
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        عنوان و نوع درخواست را مشخص کنید
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider />

                            <TextField
                                fullWidth
                                required
                                label="عنوان درخواست"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                error={!title.trim()}
                                helperText={!title.trim() ? 'عنوان درخواست الزامی است' : 'یک عنوان واضح و توصیفی انتخاب کنید'}
                                placeholder="مثال: طراحی لیبل محصول جدید"
                                InputProps={{
                                    startAdornment: (
                                        <DescriptionIcon sx={{ color: 'action.active', mr: 1 }} />
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                    }
                                }}
                            />

                            <FormControl fullWidth required>
                                <InputLabel>نوع درخواست</InputLabel>
                                <Select
                                    value={selectedRequestTypeId || ''}
                                    label="نوع درخواست"
                                    onChange={(e) => setSelectedRequestTypeId(e.target.value as number)}
                                    error={!selectedRequestTypeId}
                                    startAdornment={
                                        <CategoryIcon sx={{ color: 'action.active', mr: 1, ml: 1 }} />
                                    }
                                    sx={{
                                        borderRadius: 2,
                                    }}
                                >
                                    {requestTypesLookup?.map((item: LookupItem) => (
                                        <MenuItem key={item.id} value={item.id}>
                                            {item.value}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {isEditMode && !selectedRequestTypeId && (
                                    <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                                        نوع درخواست در حال بارگذاری...
                                    </Typography>
                                )}
                            </FormControl>
                        </Stack>
                    </Paper>

                    {/* Section 2: Priority & Deadline */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            borderRadius: 3,
                            border: '1px solid',
                            borderColor: 'divider',
                            background: alpha(theme.palette.background.paper, 0.8)
                        }}
                    >
                        <Stack spacing={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 2,
                                        background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <PriorityHighIcon sx={{ color: 'white' }} />
                                </Box>
                                <Box>
                                    <Typography variant="h6" fontWeight={700}>
                                        اولویت و زمان‌بندی
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        میزان فوریت و تاریخ تحویل را تعیین کنید
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider />

                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                                <Box sx={{ flex: 1 }}>
                                    <FormControl fullWidth required>
                                        <InputLabel>اولویت درخواست</InputLabel>
                                        <Select
                                            value={priority}
                                            label="اولویت درخواست"
                                            onChange={(e) => {
                                                setPriority(e.target.value as number);
                                                // Reset date when priority changes to re-evaluate availability
                                                if (dueDate && shouldDisableDate(dueDate)) {
                                                    setDueDate(null);
                                                }
                                            }}
                                            sx={{ borderRadius: 2 }}
                                        >
                                            <MenuItem value={0}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box
                                                        sx={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '50%',
                                                            bgcolor: '#64748b'
                                                        }}
                                                    />
                                                    <Typography>عادی</Typography>
                                                </Stack>
                                            </MenuItem>
                                            <MenuItem value={1}>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box
                                                        sx={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '50%',
                                                            bgcolor: '#ef4444'
                                                        }}
                                                    />
                                                    <Typography>فوری</Typography>
                                                </Stack>
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>

                                <Box sx={{ flex: 1 }}>
                                    <Stack spacing={1}>
                                        <DateTimePicker
                                            label="تاریخ تحویل (اختیاری)"
                                            value={dueDate}
                                            onChange={(newValue) => setDueDate(newValue)}
                                            minDate={moment().startOf('day')}
                                            maxDate={moment().add(daysRange, 'days')}
                                            shouldDisableDate={shouldDisableDate}
                                            ampm={false}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    InputProps: {
                                                        startAdornment: (
                                                            <EventAvailableIcon sx={{ color: 'action.active', mr: 1 }} />
                                                        ),
                                                    },
                                                    sx: {
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2,
                                                        }
                                                    }
                                                }
                                            }}
                                        />

                                        {/* Smart availability indicator */}
                                        {dueDate && (() => {
                                            const availability = getAvailabilityForDay(dueDate);
                                            const status = getAvailabilityStatus(dueDate);

                                            if (!availability) return null;

                                            const slotsRemaining = priority === 0 ? availability.normalSlotsRemaining : availability.urgentSlotsRemaining;
                                            const slotsTotal = priority === 0 ? availability.normalSlotsTotal : availability.urgentSlotsTotal;
                                            const percentage = (slotsRemaining / slotsTotal) * 100;

                                            return (
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        border: '1px solid',
                                                        borderColor: alpha(getAvailabilityColor(status), 0.3),
                                                        background: alpha(getAvailabilityColor(status), 0.05)
                                                    }}
                                                >
                                                    <Stack spacing={1}>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Box sx={{ color: getAvailabilityColor(status) }}>
                                                                {getAvailabilityIcon(status)}
                                                            </Box>
                                                            <Typography variant="caption" fontWeight={600} color={getAvailabilityColor(status)}>
                                                                {status === 'available' && 'ظرفیت کافی'}
                                                                {status === 'limited' && 'ظرفیت محدود'}
                                                                {status === 'full' && 'ظرفیت تکمیل'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                                                                {slotsRemaining} از {slotsTotal} ظرفیت باقی‌مانده
                                                            </Typography>
                                                        </Stack>

                                                        <LinearProgress
                                                            variant="determinate"
                                                            value={percentage}
                                                            sx={{
                                                                height: 6,
                                                                borderRadius: 3,
                                                                backgroundColor: alpha(getAvailabilityColor(status), 0.1),
                                                                '& .MuiLinearProgress-bar': {
                                                                    backgroundColor: getAvailabilityColor(status),
                                                                    borderRadius: 3
                                                                }
                                                            }}
                                                        />
                                                    </Stack>
                                                </Paper>
                                            );
                                        })()}
                                    </Stack>
                                </Box>
                            </Stack>

                            {/* Availability legend */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    background: alpha(theme.palette.info.main, 0.02)
                                }}
                            >
                                <Typography variant="caption" fontWeight={600} color="text.secondary" gutterBottom display="block">
                                    راهنمای انتخاب تاریخ:
                                </Typography>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <CheckCircleIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />
                                        <Typography variant="caption" color="text.secondary">
                                            ظرفیت کافی
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <WarningAmberIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                                        <Typography variant="caption" color="text.secondary">
                                            ظرفیت محدود (کمتر از 30%)
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={0.5} alignItems="center">
                                        <BlockIcon sx={{ fontSize: 16, color: theme.palette.error.main }} />
                                        <Typography variant="caption" color="text.secondary">
                                            ظرفیت تکمیل (غیرقابل انتخاب)
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Paper>

                            {priority === 1 && (
                                <Alert
                                    severity="warning"
                                    icon={<PriorityHighIcon />}
                                    sx={{ borderRadius: 2 }}
                                >
                                    درخواست با اولویت فوری در اسرع وقت بررسی خواهد شد
                                </Alert>
                            )}
                        </Stack>
                    </Paper>

                    {/* اطلاع‌رسانی برای تکمیل جزئیات درخواست */}
                    {selectedRequestTypeId && (
                        <Alert
                            severity="info"
                            icon={<KeyboardArrowDownIcon />}
                            sx={{
                                borderRadius: 3,
                                border: '2px solid',
                                borderColor: alpha(theme.palette.info.main, 0.3),
                                background: alpha(theme.palette.info.main, 0.05),
                                '& .MuiAlert-icon': {
                                    animation: 'bounce 2s infinite'
                                },
                                '@keyframes bounce': {
                                    '0%, 100%': { transform: 'translateY(0)' },
                                    '50%': { transform: 'translateY(5px)' }
                                }
                            }}
                        >
                            <Typography variant="body1" fontWeight={600} gutterBottom>
                                لطفاً جزئیات درخواست را تکمیل کنید
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                برای نوع درخواست "{getSelectedRequestType()}"، فیلدهای اطلاعاتی اضافی در پایین نمایش داده شده است. لطفاً تمامی فیلدهای الزامی را تکمیل کنید.
                            </Typography>
                        </Alert>
                    )}

                    {/* نمایش جزئیات بر اساس نوع درخواست - همه انواع درخواست */}

                    {/* طراحی لیبل */}
                    {selectedRequestTypeName === RequestTypeValues.Label && (
                        <Box ref={requestDetailsRef} sx={{ border: '1px dashed grey', p: 3, my: 2, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>جزئیات طراحی لیبل</Typography>
                            <TextField
                                required
                                fullWidth
                                label="نام فارسی محصول"
                                value={labelDetails.productNameFA}
                                onChange={(e) => setLabelDetails({ ...labelDetails, productNameFA: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                label="نام انگلیسی محصول"
                                value={labelDetails.productNameEN}
                                onChange={(e) => setLabelDetails({ ...labelDetails, productNameEN: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                label="برند"
                                value={labelDetails.brand}
                                onChange={(e) => setLabelDetails({ ...labelDetails, brand: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <FormControl fullWidth required sx={{ mb: 2 }}>
                                <InputLabel>نوع لیبل</InputLabel>
                                <Select
                                    value={labelDetails.labelTypeId || ''}
                                    label="نوع لیبل"
                                    onChange={(e) => setLabelDetails({ ...labelDetails, labelTypeId: e.target.value as string })}
                                >
                                    {labelTypes?.map((item: LookupItem) => (
                                        <MenuItem key={item.id} value={item.id}>
                                            {item.value}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                required
                                fullWidth
                                label="مشخصات فنی"
                                multiline
                                rows={3}
                                value={labelDetails.technicalSpecs}
                                onChange={(e) => setLabelDetails({ ...labelDetails, technicalSpecs: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="ابعاد لیبل (اختیاری)"
                                value={labelDetails.dimensions}
                                onChange={(e) => setLabelDetails({ ...labelDetails, dimensions: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                label="تعداد چاپ (اختیاری)"
                                type="number"
                                value={labelDetails.printQuantity}
                                onChange={(e) => setLabelDetails({ ...labelDetails, printQuantity: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                label="مقدار"
                                value={labelDetails.measurementValue}
                                onChange={(e) => setLabelDetails({ ...labelDetails, measurementValue: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <FormControl fullWidth required sx={{ mb: 2 }}>
                                <InputLabel>واحد اندازه‌گیری</InputLabel>
                                <Select
                                    value={labelDetails.measurementUnitId || ''}
                                    label="واحد اندازه‌گیری"
                                    onChange={(e) => setLabelDetails({ ...labelDetails, measurementUnitId: e.target.value as string })}
                                >
                                    {measurementUnits?.map((item: LookupItem) => (
                                        <MenuItem key={item.id} value={item.id}>
                                            {item.value}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* عکس بسته‌بندی محصولات */}
                    {selectedRequestTypeName === RequestTypeValues.PackagingPhoto && (
                        <Box sx={{ border: '1px dashed grey', p: 3, my: 2, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>جزئیات عکس بسته‌بندی</Typography>
                            <TextField
                                required
                                fullWidth
                                label="نام محصول"
                                value={packagingPhotoDetails.productName}
                                onChange={(e) => setPackagingPhotoDetails({ ...packagingPhotoDetails, productName: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                label="برند"
                                value={packagingPhotoDetails.brand}
                                onChange={(e) => setPackagingPhotoDetails({ ...packagingPhotoDetails, brand: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                label="توضیحات"
                                multiline
                                rows={4}
                                value={packagingPhotoDetails.description}
                                onChange={(e) => setPackagingPhotoDetails({ ...packagingPhotoDetails, description: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                        </Box>
                    )}

                    {/* پست اینستاگرام */}
                    {selectedRequestTypeName === RequestTypeValues.InstagramPost && (
                        <Box sx={{ border: '1px dashed grey', p: 3, my: 2, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>جزئیات پست اینستاگرام</Typography>
                            <TextField
                                required
                                fullWidth
                                label="موضوع"
                                value={instagramPostDetails.topic}
                                onChange={(e) => setInstagramPostDetails({ ...instagramPostDetails, topic: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                label="توضیحات"
                                multiline
                                rows={4}
                                value={instagramPostDetails.description}
                                onChange={(e) => setInstagramPostDetails({ ...instagramPostDetails, description: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                        </Box>
                    )}

                    {/* ویدئو تبلیغاتی */}
                    {selectedRequestTypeName === RequestTypeValues.PromotionalVideo && (
                        <Box sx={{ border: '1px dashed grey', p: 3, my: 2, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>جزئیات ویدئو تبلیغاتی</Typography>
                            <TextField
                                required
                                fullWidth
                                label="نام محصول"
                                value={promotionalVideoDetails.productName}
                                onChange={(e) => setPromotionalVideoDetails({ ...promotionalVideoDetails, productName: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                label="برند"
                                value={promotionalVideoDetails.brand}
                                onChange={(e) => setPromotionalVideoDetails({ ...promotionalVideoDetails, brand: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                label="توضیحات"
                                multiline
                                rows={4}
                                value={promotionalVideoDetails.description}
                                onChange={(e) => setPromotionalVideoDetails({ ...promotionalVideoDetails, description: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                        </Box>
                    )}

                    {/* محتوا برای سایت */}
                    {selectedRequestTypeName === RequestTypeValues.WebsiteContent && (
                        <Box sx={{ border: '1px dashed grey', p: 3, my: 2, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>جزئیات محتوا برای سایت</Typography>
                            <FormControl fullWidth required sx={{ mb: 2 }}>
                                <InputLabel>نوع محتوا</InputLabel>
                                <Select
                                    value={websiteContentDetails.contentTypeId || ''}
                                    label="نوع محتوا"
                                    onChange={(e) => setWebsiteContentDetails({ ...websiteContentDetails, contentTypeId: e.target.value as string })}
                                >
                                    {websiteContentTypes?.map((item: LookupItem) => (
                                        <MenuItem key={item.id} value={item.id}>
                                            {item.value}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                required
                                fullWidth
                                label="موضوع"
                                value={websiteContentDetails.topic}
                                onChange={(e) => setWebsiteContentDetails({ ...websiteContentDetails, topic: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                label="توضیحات"
                                multiline
                                rows={4}
                                value={websiteContentDetails.description}
                                onChange={(e) => setWebsiteContentDetails({ ...websiteContentDetails, description: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                        </Box>
                    )}

                    {/* ویرایش فایل */}
                    {selectedRequestTypeName === RequestTypeValues.FileEdit && (
                        <Box sx={{ border: '1px dashed grey', p: 3, my: 2, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>جزئیات ویرایش فایل</Typography>
                            <TextField
                                required
                                fullWidth
                                label="موضوع"
                                value={fileEditDetails.topic}
                                onChange={(e) => setFileEditDetails({ ...fileEditDetails, topic: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                label="توضیحات"
                                multiline
                                rows={4}
                                value={fileEditDetails.description}
                                onChange={(e) => setFileEditDetails({ ...fileEditDetails, description: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                        </Box>
                    )}

                    {/* کالای تبلیغاتی */}
                    {selectedRequestTypeName === RequestTypeValues.PromotionalItem && (
                        <Box sx={{ border: '1px dashed grey', p: 3, my: 2, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>جزئیات کالای تبلیغاتی</Typography>
                            <TextField
                                required
                                fullWidth
                                label="نام کالا"
                                value={promotionalItemDetails.itemName}
                                onChange={(e) => setPromotionalItemDetails({ ...promotionalItemDetails, itemName: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                label="تعداد"
                                type="number"
                                value={promotionalItemDetails.quantity}
                                onChange={(e) => setPromotionalItemDetails({ ...promotionalItemDetails, quantity: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                label="توضیحات"
                                multiline
                                rows={4}
                                value={promotionalItemDetails.description}
                                onChange={(e) => setPromotionalItemDetails({ ...promotionalItemDetails, description: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                        </Box>
                    )}

                    {/* تبلیغات بصری */}
                    {selectedRequestTypeName === RequestTypeValues.VisualAd && (
                        <Box sx={{ border: '1px dashed grey', p: 3, my: 2, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>جزئیات تبلیغات بصری</Typography>
                            <FormControl fullWidth required sx={{ mb: 2 }}>
                                <InputLabel>نوع طراحی</InputLabel>
                                <Select
                                    value={visualAdDetails.adTypeId || ''}
                                    label="نوع طراحی"
                                    onChange={(e) => setVisualAdDetails({ ...visualAdDetails, adTypeId: e.target.value as string })}
                                >
                                    {visualAdTypes?.map((item: LookupItem) => (
                                        <MenuItem key={item.id} value={item.id}>
                                            {item.value}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                required
                                fullWidth
                                label="برند"
                                value={visualAdDetails.brand}
                                onChange={(e) => setVisualAdDetails({ ...visualAdDetails, brand: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                label="توضیحات"
                                multiline
                                rows={4}
                                value={visualAdDetails.description}
                                onChange={(e) => setVisualAdDetails({ ...visualAdDetails, description: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                        </Box>
                    )}

                    {/* تبلیغات محیطی */}
                    {selectedRequestTypeName === RequestTypeValues.EnvironmentalAd && (
                        <Box sx={{ border: '1px dashed grey', p: 3, my: 2, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>جزئیات تبلیغات محیطی</Typography>
                            <FormControl fullWidth required sx={{ mb: 2 }}>
                                <InputLabel>نوع تبلیغ</InputLabel>
                                <Select
                                    value={environmentalAdDetails.adTypeId || ''}
                                    label="نوع تبلیغ"
                                    onChange={(e) => setEnvironmentalAdDetails({ ...environmentalAdDetails, adTypeId: e.target.value as string })}
                                >
                                    {environmentalAdTypes?.map((item: LookupItem) => (
                                        <MenuItem key={item.id} value={item.id}>
                                            {item.value}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                fullWidth
                                label="تعداد (اختیاری)"
                                type="number"
                                value={environmentalAdDetails.quantity}
                                onChange={(e) => setEnvironmentalAdDetails({ ...environmentalAdDetails, quantity: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                label="توضیحات"
                                multiline
                                rows={4}
                                value={environmentalAdDetails.description}
                                onChange={(e) => setEnvironmentalAdDetails({ ...environmentalAdDetails, description: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                        </Box>
                    )}

                    {/* متفرقه */}
                    {selectedRequestTypeName === RequestTypeValues.Miscellaneous && (
                        <Box sx={{ border: '1px dashed grey', p: 3, my: 2, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>جزئیات درخواست متفرقه</Typography>
                            <TextField
                                required
                                fullWidth
                                label="موضوع"
                                value={miscellaneousDetails.topic}
                                onChange={(e) => setMiscellaneousDetails({ ...miscellaneousDetails, topic: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                required
                                fullWidth
                                label="توضیحات"
                                multiline
                                rows={4}
                                value={miscellaneousDetails.description}
                                onChange={(e) => setMiscellaneousDetails({ ...miscellaneousDetails, description: e.target.value })}
                                sx={{ mb: 2 }}
                            />
                        </Box>
                    )}

                    {/* بخش مدیریت فایل‌های پیوست */}
                    <Box sx={{ my: 3 }}>
                        <Button
                            variant="outlined"
                            component="label"
                            sx={{ mb: 2 }}
                            fullWidth
                        >
                            افزودن فایل پیوست (اختیاری)
                            <input
                                type="file"
                                hidden
                                multiple
                                onChange={handleFileChange}
                            />
                        </Button>

                        {attachments.length > 0 && (
                            <Box sx={{ p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    فایل‌های پیوست شده:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {attachments.map((att, index) => (
                                        <Chip
                                            key={index}
                                            label={att.originalFileName}
                                            onDelete={() => handleRemoveAttachment(att.originalFileName)}
                                            deleteIcon={<ClearIcon />}
                                            variant="outlined"
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {/* دکمه ثبت */}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, py: 1.5 }}
                        disabled={isCreating || isUpdating || !selectedRequestTypeId}
                        size="large"
                    >
                        {isCreating || isUpdating ? (
                            <CircularProgress size={24} />
                        ) : (
                            isEditMode ? 'ذخیره تغییرات' : 'ثبت درخواست'
                        )}
                    </Button>
                </Stack>
            </form>
        </Box>
    );
};

export default CreateRequestPage;