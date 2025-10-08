import { Paper, Typography, Grid } from '@mui/material';

const PromotionalItemDetails = ({ details }: { details: any }) => (
    <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 3 }}>
        <Typography variant="h6" gutterBottom>جزئیات اختصاصی: کالای تبلیغاتی</Typography>
        <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>نام کالا:</strong> {details.itemName}</Typography></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>تعداد:</strong> {details.quantity}</Typography></Grid>
            <Grid size={{ xs: 12 }}><Typography><strong>توضیحات:</strong> {details.description}</Typography></Grid>
        </Grid>
    </Paper>
);

export default PromotionalItemDetails;