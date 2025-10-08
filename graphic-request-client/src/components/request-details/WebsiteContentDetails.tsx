import { Paper, Typography, Grid } from '@mui/material';
import { useGetLookupItemsQuery } from '../../services/apiSlice';

const WebsiteContentDetails = ({ details }: { details: any }) => {
    const { data: contentTypes } = useGetLookupItemsQuery(6); // ID 6 for WebsiteContentTypes
    const contentTypeName = contentTypes?.find(item => item.id === details.contentTypeId)?.value || `ID ${details.contentTypeId}`;

    return (
        <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 3 }}>
            <Typography variant="h6" gutterBottom>جزئیات اختصاصی: محتوا برای سایت</Typography>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>نوع محتوا:</strong> {contentTypeName}</Typography></Grid>
                <Grid size={{ xs: 12, sm: 6 }}><Typography><strong>موضوع:</strong> {details.topic}</Typography></Grid>
                <Grid size={{ xs: 12 }}><Typography><strong>توضیحات:</strong> {details.description}</Typography></Grid>
            </Grid>
        </Paper>
    );
};

export default WebsiteContentDetails;