import { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, CircularProgress, MenuItem, Select, FormControl, InputLabel, Chip, Backdrop } from '@mui/material';
import { useGetRequestByIdQuery, useCreateRequestMutation, useUpdateRequestMutation, useGetAvailabilityQuery, useGetLookupItemsQuery } from '../services/apiSlice';
import { useNavigate, useParams } from 'react-router-dom';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import moment from 'moment-jalaali';
import type { Moment } from 'moment-jalaali';
import { useDispatch } from 'react-redux';
import { showNotification } from '../services/notificationSlice';
import ClearIcon from '@mui/icons-material/Clear';

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

    const { data: existingRequestData, isLoading: isLoadingExisting, refetch } = useGetRequestByIdQuery(Number(id), {
        skip: !isEditMode,
        refetchOnMountOrArgChange: true
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
    const [packagingPhotoDetails, setPackagingPhotoDetails] = useState({ productName: '', brand: '' });
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

    const startDate = moment().locale('en').format('YYYY-MM-DD');
    const endDate = moment().add(30, 'days').locale('en').format('YYYY-MM-DD');
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
                            brand: existingRequestData.details.brand || ''
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

    const shouldDisableDate = (day: Moment) => {
        if (!availabilityData) return false;
        const dayAvailability = availabilityData.find((d: AvailabilityItem) => moment(d.date).isSame(day, 'day'));
        if (!dayAvailability) return false;
        if (priority === 0 && !dayAvailability.isNormalSlotAvailable) return true;
        if (priority === 1 && !dayAvailability.isUrgentSlotAvailable) return true;
        return false;
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
            const errorMessage = err.data?.message || err.data?.title || 'بروز خطا در ثبت درخواست';
            dispatch(showNotification({
                message: errorMessage,
                severity: 'error'
            }));
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>در حال بارگذاری...</Typography>
            </Box>
        );
    }

    const selectedRequestTypeName = getSelectedRequestType();

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={isCreating || isUpdating}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress color="inherit" />
                    <Typography sx={{ mt: 2 }}>
                        {isEditMode ? 'در حال ذخیره تغییرات...' : 'در حال ثبت درخواست...'}
                    </Typography>
                </Box>
            </Backdrop>

            <Typography variant="h4" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
                {isEditMode ? `ویرایش درخواست #${id}` : 'ثبت درخواست جدید'}
            </Typography>

            {/* فیلدهای اصلی */}
            <TextField
                fullWidth
                required
                margin="normal"
                label="عنوان کلی درخواست"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={!title.trim()}
                helperText={!title.trim() ? 'عنوان درخواست الزامی است' : ''}
            />

            <FormControl fullWidth required margin="normal">
                <InputLabel>نوع درخواست</InputLabel>
                <Select
                    value={selectedRequestTypeId || ''}
                    label="نوع درخواست"
                    onChange={(e) => setSelectedRequestTypeId(e.target.value as number)}
                    error={!selectedRequestTypeId}
                >
                    {requestTypesLookup?.map((item: LookupItem) => (
                        <MenuItem key={item.id} value={item.id}>
                            {item.value}
                        </MenuItem>
                    ))}
                </Select>
                {isEditMode && !selectedRequestTypeId && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                        نوع درخواست در حال بارگذاری...
                    </Typography>
                )}
            </FormControl>

            <FormControl fullWidth required margin="normal">
                <InputLabel>اولویت</InputLabel>
                <Select
                    value={priority}
                    label="اولویت"
                    onChange={(e) => setPriority(e.target.value as number)}
                >
                    <MenuItem value={0}>عادی</MenuItem>
                    <MenuItem value={1}>فوری</MenuItem>
                </Select>
            </FormControl>

            <DateTimePicker
                label="تاریخ تحویل (اختیاری)"
                value={dueDate}
                onChange={(newValue) => setDueDate(newValue)}
                minDate={moment().startOf('day')}
                sx={{ width: '100%', mt: 2, mb: 1 }}
                shouldDisableDate={shouldDisableDate}
                ampm={false}
                slotProps={{
                    textField: {
                        fullWidth: true,
                    }
                }}
            />

            {/* نمایش جزئیات بر اساس نوع درخواست - همه انواع درخواست */}

            {/* طراحی لیبل */}
            {selectedRequestTypeName === RequestTypeValues.Label && (
                <Box sx={{ border: '1px dashed grey', p: 3, my: 2, borderRadius: 2 }}>
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
        </Box>
    );
};

export default CreateRequestPage;