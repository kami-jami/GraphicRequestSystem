import { Paper, Typography, Grid, CircularProgress } from '@mui/material';
import { useGetLookupItemsQuery } from '../../services/apiSlice';

const LabelDetails = ({ details }: { details: any }) => {
    // واکشی لیست انواع لیبل (Lookup ID 2)
    const { data: labelTypes, isLoading: isLoadingLabelTypes } = useGetLookupItemsQuery(2);
    // واکشی لیست واحدهای اندازه‌گیری (Lookup ID 3)
    const { data: measurementUnits, isLoading: isLoadingUnits } = useGetLookupItemsQuery(3);

    // تابع کمکی برای پیدا کردن نام بر اساس شناسه
    const findValueById = (items: any[] | undefined, id: number) => {
        if (!items) return `ID ${id}`;
        const item = items.find((i) => i.id === id);
        return item ? item.value : `ID ${id}`;
    };

    if (isLoadingLabelTypes || isLoadingUnits) {
        return <CircularProgress />;
    }

    return (
        <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 3 }}>
            <Typography variant="h6" gutterBottom>جزئیات اختصاصی: طراحی لیبل</Typography>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>نام فارسی:</strong> {details.productNameFA}</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>نام انگلیسی:</strong> {details.productNameEN}</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>برند:</strong> {details.brand}</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography><strong>نوع لیبل:</strong> {findValueById(labelTypes, details.labelTypeId)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>مقدار:</strong> {details.measurementValue}</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography><strong>واحد اندازه‌گیری:</strong> {findValueById(measurementUnits, details.measurementUnitId)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>ابعاد:</strong> {details.dimensions || '---'}</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>تعداد چاپ:</strong> {details.printQuantity || '---'}</Typography></Grid>
                <Grid size={{ xs: 12 }}>
                    <Typography><strong>مشخصات فنی:</strong> {details.technicalSpecs}</Typography>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default LabelDetails;