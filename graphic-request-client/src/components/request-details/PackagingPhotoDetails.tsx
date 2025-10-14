import { Paper, Typography, Grid } from '@mui/material';

const PackagingPhotoDetails = ({ details }: { details: any }) => (
    <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 3 }}>
        <Typography variant="h6" gutterBottom>جزئیات اختصاصی: عکس بسته‌بندی</Typography>
        <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>نام محصول:</strong> {details.productName}</Typography></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>برند:</strong> {details.brand}</Typography></Grid>
            <Grid size={{ xs: 12 }}><Typography><strong>توضیحات:</strong> {details.description}</Typography></Grid>
        </Grid>
    </Paper>
);

export default PackagingPhotoDetails;