import { Paper, Typography, Grid } from '@mui/material';
import { useGetLookupItemsQuery } from '../../services/apiSlice';

const VisualAdDetails = ({ details }: { details: any }) => {
    const { data: adTypes } = useGetLookupItemsQuery(4); // ID 4 for VisualAdTypes
    const adTypeName = adTypes?.find(item => item.id === details.adTypeId)?.value || `ID ${details.adTypeId}`;

    return (
        <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 3 }}>
            <Typography variant="h6" gutterBottom>جزئیات اختصاصی: تبلیغات بصری</Typography>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>نوع طراحی:</strong> {adTypeName}</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>برند:</strong> {details.brand}</Typography></Grid>
                <Grid size={{ xs: 12 }}><Typography><strong>توضیحات:</strong> {details.description}</Typography></Grid>
            </Grid>
        </Paper>
    );
};

export default VisualAdDetails;