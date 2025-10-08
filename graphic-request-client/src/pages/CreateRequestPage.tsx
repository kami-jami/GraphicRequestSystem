import { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, CircularProgress, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useGetLookupItemsQuery, useGetLookupListsQuery, useCreateRequestMutation, useGetAvailabilityQuery } from '../services/apiSlice';
import { useNavigate } from 'react-router-dom';

import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import moment from 'moment-jalaali';
import type { Moment } from 'moment-jalaali';

import { useDispatch } from 'react-redux';
import { showNotification } from '../services/notificationSlice';

// یک آبجکت برای نگهداری مقادیر ثابت RequestTypeValues (برای جلوگیری از Magic Strings)
// بهتر است این را به یک فایل جداگانه در utils یا hooks منتقل کنیم در آینده
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

const CreateRequestPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [createRequest, { isLoading: isCreatingRequest }] = useCreateRequestMutation();

    const [title, setTitle] = useState('');
    const [selectedRequestTypeId, setSelectedRequestTypeId] = useState<number | ''>('');
    const [priority, setPriority] = useState<number>(0); // 0: Normal, 1: Urgent
    // const [dueDate, setDueDate] = useState<string>('');
    const [dueDate, setDueDate] = useState<moment.Moment | null>(null);
    const [requesterComment, setRequesterComment] = useState('');
    const [files, setFiles] = useState<FileList | null>(null);

    // State برای جزئیات اختصاصی لیبل
    const [labelDetails, setLabelDetails] = useState({
        productNameFA: '', productNameEN: '', brand: '', labelTypeId: '',
        technicalSpecs: '', dimensions: '', printQuantity: '',
        measurementValue: '', measurementUnitId: ''
    });

    // State برای جزئیات عکس بسته‌بندی
    const [packagingPhotoDetails, setPackagingPhotoDetails] = useState({
        productName: '', brand: ''
    });

    // ... اضافه کردن state برای سایر انواع درخواست‌ها (مثلا InstagramPostDetails, PromotionalVideoDetails و...)
    const [instagramPostDetails, setInstagramPostDetails] = useState({
        topic: '', description: ''
    });
    // ... سایر state ها

    // const startDate = moment().toISOString();
    // const endDate = moment().add(30, 'days').toISOString();
    // const startDate = moment().format('YYYY-MM-DD');
    // const endDate = moment().add(30, 'days').format('YYYY-MM-DD');
    const startDate = moment().startOf('day').toDate();
    const endDate = moment().add(30, 'days').endOf('day').toDate();

    const { data: availabilityData, isLoading: isLoadingAvailability, error: availabilityError } =
        useGetAvailabilityQuery({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });

    // const { data: availabilityData, isLoading: isLoadingAvailability } = useGetAvailabilityQuery({ startDate, endDate });

    const shouldDisableDate = (date: Moment) => {
        if (!availabilityData || !Array.isArray(availabilityData)) return false;

        const dateString = date.toDate().toISOString().split('T')[0]; // YYYY-MM-DD
        const dayAvailability = availabilityData.find((d: any) => {
            const apiDate = new Date(d.date).toISOString().split('T')[0];
            return apiDate === dateString;
        });

        if (!dayAvailability) return false;

        if (priority === 0 && !dayAvailability.isNormalSlotAvailable) {
            return true;
        }
        if (priority === 1 && !dayAvailability.isUrgentSlotAvailable) {
            return true;
        }

        return false;
    };

    // واکشی لیست انواع درخواست (Lookup ID 1)
    const { data: requestTypesLookup, isLoading: isLoadingRequestTypesLookup } = useGetLookupItemsQuery(1);
    // واکشی لیست اولویت‌ها (Lookup ID ?) - نیاز به اضافه کردن Priority Lookup
    const { data: priorityLookupItems, isLoading: isLoadingPriorityLookup } = useGetLookupItemsQuery(0); // TODO: Replace 0 with actual Priority Lookup ID

    // واکشی لیست نوع لیبل (Lookup ID 2)
    const { data: labelTypes, isLoading: isLoadingLabelTypes } = useGetLookupItemsQuery(2);
    // واکشی لیست واحد اندازه‌گیری (Lookup ID 3)
    const { data: measurementUnits, isLoading: isLoadingMeasurementUnits } = useGetLookupItemsQuery(3);
    // واکشی لیست انواع تبلیغات بصری (Lookup ID 4)
    const { data: visualAdTypes, isLoading: isLoadingVisualAdTypes } = useGetLookupItemsQuery(4);
    // واکشی لیست انواع تبلیغات محیطی (Lookup ID 5)
    const { data: environmentalAdTypes, isLoading: isLoadingEnvironmentalAdTypes } = useGetLookupItemsQuery(5);
    // واکشی لیست انواع محتوای سایت (Lookup ID 6)
    const { data: websiteContentTypes, isLoading: isLoadingWebsiteContentTypes } = useGetLookupItemsQuery(6);

    const getSelectedRequestType = () => {
        return requestTypesLookup?.find(item => item.id === selectedRequestTypeId)?.value;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (dueDate && shouldDisableDate(dueDate)) {
            alert('تاریخ انتخابی در دسترس نیست. لطفا تاریخ دیگری انتخاب کنید.');
            return;
        }

        const formData = new FormData();

        formData.append('title', title);
        if (selectedRequestTypeId) formData.append('requestTypeId', selectedRequestTypeId.toString());
        formData.append('priority', priority.toString());
        // if (dueDate) formData.append('dueDate', dueDate); // dueDate می‌تواند اختیاری باشد
        if (dueDate) {
            const gregorianDate = dueDate.toDate().toISOString();
            formData.append('dueDate', gregorianDate);
        }
        if (requesterComment) formData.append('requesterComment', requesterComment);

        const requestType = getSelectedRequestType();

        // اضافه کردن جزئیات اختصاصی بر اساس نوع درخواست
        switch (requestType) {
            case RequestTypeValues.Label:
                formData.append('labelDetails.productNameFA', labelDetails.productNameFA);
                formData.append('labelDetails.productNameEN', labelDetails.productNameEN);
                formData.append('labelDetails.brand', labelDetails.brand);
                formData.append('labelDetails.labelTypeId', labelDetails.labelTypeId);
                formData.append('labelDetails.technicalSpecs', labelDetails.technicalSpecs);
                if (labelDetails.dimensions) formData.append('labelDetails.dimensions', labelDetails.dimensions);
                if (labelDetails.printQuantity) formData.append('labelDetails.printQuantity', labelDetails.printQuantity.toString());
                formData.append('labelDetails.measurementValue', labelDetails.measurementValue);
                formData.append('labelDetails.measurementUnitId', labelDetails.measurementUnitId);
                break;
            case RequestTypeValues.PackagingPhoto:
                formData.append('packagingPhotoDetails.productName', packagingPhotoDetails.productName);
                formData.append('packagingPhotoDetails.brand', packagingPhotoDetails.brand);
                break;
            case RequestTypeValues.InstagramPost:
                formData.append('instagramPostDetails.topic', instagramPostDetails.topic);
                formData.append('instagramPostDetails.description', instagramPostDetails.description);
                break;
            // ... اضافه کردن سایر انواع درخواست
            default:
                break;
        }

        // اضافه کردن فایل‌ها
        if (files) {
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
        }

        try {
            await createRequest(formData).unwrap();
            dispatch(showNotification({ message: 'درخواست با موفقیت ثبت شد!', severity: 'success' }));
            navigate('/requests');
        } catch (err: any) {
            console.error('Failed to create request: ', err);
            const errorMessage = err.data?.message || 'خطا در ثبت درخواست. لطفاً دوباره تلاش کنید.';
            dispatch(showNotification({ message: errorMessage, severity: 'error' }));
        }
    };

    if (availabilityError) {
        console.error('Availability API error:', availabilityError);
    }

    if (isLoadingRequestTypesLookup || isLoadingLabelTypes || isLoadingMeasurementUnits ||
        isLoadingPriorityLookup || isLoadingVisualAdTypes || isLoadingEnvironmentalAdTypes ||
        isLoadingWebsiteContentTypes || isLoadingAvailability) {
        return <CircularProgress />;
    }

    const selectedRequestTypeName = getSelectedRequestType();

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
                ثبت درخواست جدید
            </Typography>

            <TextField
                margin="normal"
                required
                fullWidth
                label="عنوان کلی درخواست"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 2 }}
            />

            <FormControl fullWidth required sx={{ mb: 2 }}>
                <InputLabel>نوع درخواست</InputLabel>
                <Select
                    value={selectedRequestTypeId}
                    label="نوع درخواست"
                    onChange={(e) => setSelectedRequestTypeId(e.target.value as number)}
                >
                    {requestTypesLookup?.map((item: any) => (
                        <MenuItem key={item.id} value={item.id}>{item.value}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl fullWidth required sx={{ mb: 2 }}>
                <InputLabel>اولویت</InputLabel>
                <Select
                    value={priority}
                    label="اولویت"
                    onChange={(e) => setPriority(e.target.value as number)}
                >
                    <MenuItem value={0}>عادی</MenuItem>
                    <MenuItem value={1}>فوری</MenuItem>
                    {/* TODO: از priorityLookupItems استفاده کنید */}
                </Select>
            </FormControl>

            {/* <TextField
                margin="normal"
                fullWidth
                label="تاریخ تحویل (اختیاری)"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                InputLabelProps={{
                    shrink: true,
                }}
                sx={{ mb: 2 }}
            /> */}

            <DateTimePicker
                label="تاریخ تحویل (اختیاری)"
                value={dueDate}
                onChange={(newValue) => setDueDate(newValue)}
                shouldDisableDate={shouldDisableDate}
                format="jYYYY/jMM/jDD - HH:mm"
                ampm={false}
                enableAccessibleFieldDOMStructure={false}
                minDate={moment().startOf('day')}
                slots={{
                    textField: (params) => (
                        <TextField
                            {...params}
                            sx={{ mb: 2 }}
                            helperText={dueDate && shouldDisableDate(dueDate) ? "این تاریخ در دسترس نیست" : ""}
                            error={dueDate && shouldDisableDate(dueDate)}
                        />
                    )
                }}
            />

            <TextField
                margin="normal"
                fullWidth
                label="توضیحات درخواست‌دهنده (اختیاری)"
                multiline
                rows={4}
                value={requesterComment}
                onChange={(e) => setRequesterComment(e.target.value)}
                sx={{ mb: 2 }}
            />

            {/* نمایش فیلدهای اختصاصی بر اساس نوع درخواست */}
            {selectedRequestTypeName === RequestTypeValues.Label && (
                <Box sx={{ border: '1px dashed grey', p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>جزئیات لیبل</Typography>
                    <TextField required fullWidth label="نام فارسی محصول" value={labelDetails.productNameFA} onChange={(e) => setLabelDetails({ ...labelDetails, productNameFA: e.target.value })} sx={{ mb: 1 }} />
                    <TextField required fullWidth label="نام انگلیسی محصول" value={labelDetails.productNameEN} onChange={(e) => setLabelDetails({ ...labelDetails, productNameEN: e.target.value })} sx={{ mb: 1 }} />
                    <TextField required fullWidth label="برند" value={labelDetails.brand} onChange={(e) => setLabelDetails({ ...labelDetails, brand: e.target.value })} sx={{ mb: 1 }} />
                    <FormControl fullWidth required sx={{ mb: 1 }}>
                        <InputLabel>نوع لیبل</InputLabel>
                        <Select value={labelDetails.labelTypeId} label="نوع لیبل" onChange={(e) => setLabelDetails({ ...labelDetails, labelTypeId: e.target.value as string })} >
                            {labelTypes?.map((item: any) => (<MenuItem key={item.id} value={item.id}>{item.value}</MenuItem>))}
                        </Select>
                    </FormControl>
                    <TextField required fullWidth label="مشخصات فنی" multiline rows={2} value={labelDetails.technicalSpecs} onChange={(e) => setLabelDetails({ ...labelDetails, technicalSpecs: e.target.value })} sx={{ mb: 1 }} />
                    <TextField fullWidth label="ابعاد لیبل (اختیاری)" value={labelDetails.dimensions} onChange={(e) => setLabelDetails({ ...labelDetails, dimensions: e.target.value })} sx={{ mb: 1 }} />
                    <TextField fullWidth label="تعداد چاپ (اختیاری)" type="number" value={labelDetails.printQuantity} onChange={(e) => setLabelDetails({ ...labelDetails, printQuantity: e.target.value as any })} sx={{ mb: 1 }} />
                    <TextField required fullWidth label="مقدار" value={labelDetails.measurementValue} onChange={(e) => setLabelDetails({ ...labelDetails, measurementValue: e.target.value })} sx={{ mb: 1 }} />
                    <FormControl fullWidth required sx={{ mb: 1 }}>
                        <InputLabel>واحد اندازه‌گیری</InputLabel>
                        <Select value={labelDetails.measurementUnitId} label="واحد اندازه‌گیری" onChange={(e) => setLabelDetails({ ...labelDetails, measurementUnitId: e.target.value as string })} >
                            {measurementUnits?.map((item: any) => (<MenuItem key={item.id} value={item.id}>{item.value}</MenuItem>))}
                        </Select>
                    </FormControl>
                </Box>
            )}

            {/* نمایش فیلدهای اختصاصی برای عکس بسته‌بندی */}
            {selectedRequestTypeName === RequestTypeValues.PackagingPhoto && (
                <Box sx={{ border: '1px dashed grey', p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>جزئیات عکس بسته‌بندی محصولات</Typography>
                    <TextField required fullWidth label="نام محصول" value={packagingPhotoDetails.productName} onChange={(e) => setPackagingPhotoDetails({ ...packagingPhotoDetails, productName: e.target.value })} sx={{ mb: 1 }} />
                    <TextField required fullWidth label="برند محصول" value={packagingPhotoDetails.brand} onChange={(e) => setPackagingPhotoDetails({ ...packagingPhotoDetails, brand: e.target.value })} sx={{ mb: 1 }} />
                </Box>
            )}

            {/* نمایش فیلدهای اختصاصی برای پست اینستاگرام */}
            {selectedRequestTypeName === RequestTypeValues.InstagramPost && (
                <Box sx={{ border: '1px dashed grey', p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>جزئیات پست اینستاگرام</Typography>
                    <TextField required fullWidth label="موضوع تبلیغ" value={instagramPostDetails.topic} onChange={(e) => setInstagramPostDetails({ ...instagramPostDetails, topic: e.target.value })} sx={{ mb: 1 }} />
                    <TextField required fullWidth label="توضیحات" multiline rows={3} value={instagramPostDetails.description} onChange={(e) => setInstagramPostDetails({ ...instagramPostDetails, description: e.target.value })} sx={{ mb: 1 }} />
                </Box>
            )}
            {/* ... اضافه کردن بلوک‌های مشابه برای سایر انواع درخواست‌ها ... */}


            <Button
                variant="contained"
                component="label"
                sx={{ mt: 2, mb: 2 }}
                fullWidth
            >
                پیوست فایل (اختیاری)
                <input type="file" hidden multiple onChange={(e) => setFiles(e.target.files)} />
            </Button>
            {files && files.length > 0 && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">فایل‌های انتخاب شده:</Typography>
                    <ul>
                        {[...files].map((file, index) => (
                            <li key={index}>{file.name}</li>
                        ))}
                    </ul>
                </Box>
            )}

            <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={isCreatingRequest}
            >
                {isCreatingRequest ? 'در حال ثبت...' : 'ثبت درخواست'}
            </Button>
        </Box>
    );
};

export default CreateRequestPage;