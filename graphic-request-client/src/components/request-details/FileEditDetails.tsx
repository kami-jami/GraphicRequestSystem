import { Paper, Typography, Grid } from '@mui/material';

const FileEditDetails = ({ details }: { details: any }) => (
    <Paper sx={{ p: 2, bgcolor: 'grey.50', mt: 3 }}>
        <Typography variant="h6" gutterBottom>جزئیات اختصاصی: ویرایش فایل</Typography>
        <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}><Typography><strong>موضوع:</strong> {details.topic}</Typography></Grid>
            <Grid size={{ xs: 12 }}><Typography><strong>توضیحات:</strong> {details.description}</Typography></Grid>
        </Grid>
    </Paper>
);

export default FileEditDetails;