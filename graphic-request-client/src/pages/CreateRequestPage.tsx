import { useState } from 'react';
import { Box, Button, TextField, Typography, CircularProgress, MenuItem, Select, FormControl, InputLabel, Backdrop } from '@mui/material';
import { useGetLookupItemsQuery, useCreateRequestMutation, useGetAvailabilityQuery } from '../services/apiSlice';
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
    const [promotionalVideoDetails, setPromotionalVideoDetails] = useState({ productName: '', brand: '', description: '' });
    const [websiteContentDetails, setWebsiteContentDetails] = useState({ contentTypeId: '', topic: '', description: '' });
    const [fileEditDetails, setFileEditDetails] = useState({ topic: '', description: '' });
    const [promotionalItemDetails, setPromotionalItemDetails] = useState({ itemName: '', quantity: '', description: '' });
    const [visualAdDetails, setVisualAdDetails] = useState({ adTypeId: '', brand: '', description: '' });
    const [environmentalAdDetails, setEnvironmentalAdDetails] = useState({ adTypeId: '', description: '', quantity: '' });
    const [miscellaneousDetails, setMiscellaneousDetails] = useState({ topic: '', description: '' });
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



    const getSelectedRequestType = () => {
        return requestTypesLookup?.find(item => item.id === selectedRequestTypeId)?.value;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (dueDate && shouldDisableDate(dueDate)) {
            alert('تاریخ انتخابی در دسترس نیست. لطفا تاریخ دیگری انتخاب کنید.');
            dispatch(showNotification({ message: 'تاریخ انتخابی در دسترس نیست. لطفا تاریخ دیگری انتخاب کنید.', severity: 'error' }));
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
                Object.entries(labelDetails).forEach(([key, value]) => formData.append(`labelDetails.${key}`, value));
                break;
            case RequestTypeValues.PackagingPhoto:
                Object.entries(packagingPhotoDetails).forEach(([key, value]) => formData.append(`packagingPhotoDetails.${key}`, value));
                break;
            case RequestTypeValues.InstagramPost:
                Object.entries(instagramPostDetails).forEach(([key, value]) => formData.append(`instagramPostDetails.${key}`, value));
                break;
            case RequestTypeValues.PromotionalVideo:
                Object.entries(promotionalVideoDetails).forEach(([key, value]) => formData.append(`promotionalVideoDetails.${key}`, value));
                break;
            case RequestTypeValues.WebsiteContent:
                Object.entries(websiteContentDetails).forEach(([key, value]) => formData.append(`websiteContentDetails.${key}`, value));
                break;
            case RequestTypeValues.FileEdit:
                Object.entries(fileEditDetails).forEach(([key, value]) => formData.append(`fileEditDetails.${key}`, value));
                break;
            case RequestTypeValues.PromotionalItem:
                Object.entries(promotionalItemDetails).forEach(([key, value]) => formData.append(`promotionalItemDetails.${key}`, value));
                break;
            case RequestTypeValues.VisualAd:
                Object.entries(visualAdDetails).forEach(([key, value]) => formData.append(`visualAdDetails.${key}`, value));
                break;
            case RequestTypeValues.EnvironmentalAd:
                Object.entries(environmentalAdDetails).forEach(([key, value]) => formData.append(`environmentalAdDetails.${key}`, value));
                break;
            case RequestTypeValues.Miscellaneous:
                Object.entries(miscellaneousDetails).forEach(([key, value]) => formData.append(`miscellaneousDetails.${key}`, value));
                break;
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
        dispatch(showNotification({ message: 'خطا در واکشی اطلاعات دسترسی. لطفاً صفحه را رفرش کنید.', severity: 'error' }));
        return <Typography color="error">خطا در بارگذاری صفحه. لطفاً صفحه را رفرش کنید.</Typography>;
    }

    if (isLoadingRequestTypesLookup || isLoadingLabelTypes || isLoadingMeasurementUnits ||
        isLoadingPriorityLookup || isLoadingVisualAdTypes || isLoadingEnvironmentalAdTypes ||
        isLoadingWebsiteContentTypes || isLoadingAvailability) {
        return <CircularProgress />;
    }

    const selectedRequestTypeName = getSelectedRequestType();

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={isCreatingRequest} // وضعیت باز بودن آن به isCreatingRequest متصل است
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress color="inherit" />
                    <Typography sx={{ mt: 2 }}>
                        در حال آپلود فایل‌ها و ثبت درخواست...
                    </Typography>
                </Box>
            </Backdrop>
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

            {selectedRequestTypeName === RequestTypeValues.PromotionalVideo && (
                <Box sx={{ border: '1px dashed grey', p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>جزئیات ویدئو تبلیغاتی</Typography>
                    <TextField required fullWidth label="نام محصول" value={promotionalVideoDetails.productName} onChange={(e) => setPromotionalVideoDetails({ ...promotionalVideoDetails, productName: e.target.value })} sx={{ mb: 1 }} />
                    <TextField required fullWidth label="برند" value={promotionalVideoDetails.brand} onChange={(e) => setPromotionalVideoDetails({ ...promotionalVideoDetails, brand: e.target.value })} sx={{ mb: 1 }} />
                    <TextField required fullWidth label="توضیحات" multiline rows={3} value={promotionalVideoDetails.description} onChange={(e) => setPromotionalVideoDetails({ ...promotionalVideoDetails, description: e.target.value })} sx={{ mb: 1 }} />
                </Box>
            )}

            {selectedRequestTypeName === RequestTypeValues.WebsiteContent && (
                <Box sx={{ border: '1px dashed grey', p: 2, mb: 2 }}>
                    <Typography variant="h6" gutterBottom>جزئیات محتوا برای سایت</Typography>
                    <FormControl fullWidth required sx={{ mb: 1 }}>
                        <InputLabel>نوع محتوا</InputLabel>
                        <Select value={websiteContentDetails.contentTypeId} label="نوع محتوا" onChange={(e) => setWebsiteContentDetails({ ...websiteContentDetails, contentTypeId: e.target.value as string })}>
                            {websiteContentTypes?.map((item: any) => (<MenuItem key={item.id} value={item.id}>{item.value}</MenuItem>))}
                        </Select>
                    </FormControl>
                    <TextField required fullWidth label="موضوع" value={websiteContentDetails.topic} onChange={(e) => setWebsiteContentDetails({ ...websiteContentDetails, topic: e.target.value })} sx={{ mb: 1 }} />
                    <TextField required fullWidth label="توضیحات" multiline rows={3} value={websiteContentDetails.description} onChange={(e) => setWebsiteContentDetails({ ...websiteContentDetails, description: e.target.value })} sx={{ mb: 1 }} />
                </Box>
            )}

            {selectedRequestTypeName === RequestTypeValues.FileEdit && (
                <Box sx={{ border: '1px dashed grey', p: 2, my: 2 }}>
                    <Typography variant="h6" gutterBottom>جزئیات ویرایش فایل</Typography>
                    <TextField required fullWidth label="موضوع" value={fileEditDetails.topic} onChange={(e) => setFileEditDetails({ ...fileEditDetails, topic: e.target.value })} sx={{ mb: 1 }} />
                    <TextField required fullWidth label="توضیحات" multiline rows={3} value={fileEditDetails.description} onChange={(e) => setFileEditDetails({ ...fileEditDetails, description: e.target.value })} sx={{ mb: 1 }} />
                </Box>
            )}

            {/* --- بلوک JSX برای کالای تبلیغاتی --- */}
            {selectedRequestTypeName === RequestTypeValues.PromotionalItem && (
                <Box sx={{ border: '1px dashed grey', p: 2, my: 2 }}>
                    <Typography variant="h6" gutterBottom>جزئیات کالای تبلیغاتی</Typography>
                    <TextField required fullWidth label="نام کالا" value={promotionalItemDetails.itemName} onChange={(e) => setPromotionalItemDetails({ ...promotionalItemDetails, itemName: e.target.value })} sx={{ mb: 1 }} />
                    <TextField required fullWidth label="تعداد" type="number" value={promotionalItemDetails.quantity} onChange={(e) => setPromotionalItemDetails({ ...promotionalItemDetails, quantity: e.target.value })} sx={{ mb: 1 }} />
                    <TextField required fullWidth label="توضیحات" multiline rows={3} value={promotionalItemDetails.description} onChange={(e) => setPromotionalItemDetails({ ...promotionalItemDetails, description: e.target.value })} sx={{ mb: 1 }} />
                </Box>
            )}

            {/* --- بلوک JSX برای تبلیغات بصری --- */}
            {selectedRequestTypeName === RequestTypeValues.VisualAd && (
                <Box sx={{ border: '1px dashed grey', p: 2, my: 2 }}>
                    <Typography variant="h6" gutterBottom>جزئیات تبلیغات بصری</Typography>
                    <FormControl fullWidth required sx={{ mb: 1 }}>
                        <InputLabel>نوع طراحی</InputLabel>
                        <Select value={visualAdDetails.adTypeId} label="نوع طراحی" onChange={(e) => setVisualAdDetails({ ...visualAdDetails, adTypeId: e.target.value as string })}>
                            {visualAdTypes?.map((item: any) => (<MenuItem key={item.id} value={item.id}>{item.value}</MenuItem>))}
                        </Select>
                    </FormControl>
                    <TextField required fullWidth label="برند" value={visualAdDetails.brand} onChange={(e) => setVisualAdDetails({ ...visualAdDetails, brand: e.target.value })} sx={{ mb: 1 }} />
                    <TextField required fullWidth label="توضیحات" multiline rows={3} value={visualAdDetails.description} onChange={(e) => setVisualAdDetails({ ...visualAdDetails, description: e.target.value })} sx={{ mb: 1 }} />
                </Box>
            )}

            {/* --- بلوک JSX برای تبلیغات محیطی --- */}
            {selectedRequestTypeName === RequestTypeValues.EnvironmentalAd && (
                <Box sx={{ border: '1px dashed grey', p: 2, my: 2 }}>
                    <Typography variant="h6" gutterBottom>جزئیات تبلیغات محیطی</Typography>
                    <FormControl fullWidth required sx={{ mb: 1 }}>
                        <InputLabel>نوع تبلیغ</InputLabel>
                        <Select value={environmentalAdDetails.adTypeId} label="نوع تبلیغ" onChange={(e) => setEnvironmentalAdDetails({ ...environmentalAdDetails, adTypeId: e.target.value as string })}>
                            {environmentalAdTypes?.map((item: any) => (<MenuItem key={item.id} value={item.id}>{item.value}</MenuItem>))}
                        </Select>
                    </FormControl>
                    <TextField fullWidth label="تعداد (اختیاری)" type="number" value={environmentalAdDetails.quantity} onChange={(e) => setEnvironmentalAdDetails({ ...environmentalAdDetails, quantity: e.target.value })} sx={{ mb: 1 }} />
                    <TextField required fullWidth label="توضیحات" multiline rows={3} value={environmentalAdDetails.description} onChange={(e) => setEnvironmentalAdDetails({ ...environmentalAdDetails, description: e.target.value })} sx={{ mb: 1 }} />
                </Box>
            )}

            {/* --- بلوک JSX برای متفرقه --- */}
            {selectedRequestTypeName === RequestTypeValues.Miscellaneous && (
                <Box sx={{ border: '1px dashed grey', p: 2, my: 2 }}>
                    <Typography variant="h6" gutterBottom>جزئیات درخواست متفرقه</Typography>
                    <TextField required fullWidth label="موضوع" value={miscellaneousDetails.topic} onChange={(e) => setMiscellaneousDetails({ ...miscellaneousDetails, topic: e.target.value })} sx={{ mb: 1 }} />
                    <TextField required fullWidth label="توضیحات" multiline rows={3} value={miscellaneousDetails.description} onChange={(e) => setMiscellaneousDetails({ ...miscellaneousDetails, description: e.target.value })} sx={{ mb: 1 }} />
                </Box>
            )}


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