import { Paper, Typography, List, ListItem, ListItemIcon, ListItemText, Link } from '@mui/material';
import AttachmentIcon from '@mui/icons-material/Attachment';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AttachmentList = ({ attachments }: { attachments: any[] }) => {
    if (!attachments || attachments.length === 0) {
        return <Typography>هیچ فایلی پیوست نشده است.</Typography>;
    }

    return (
        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>فایل‌های پیوست</Typography>
            <List dense>
                {attachments.map((file) => (
                    <ListItem key={file.id}>
                        <ListItemIcon>
                            <AttachmentIcon />
                        </ListItemIcon>
                        <Link
                            href={`${API_BASE_URL}/uploads/${file.storedFileName}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                        >
                            <ListItemText primary={file.originalFileName} />
                        </Link>
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
};

export default AttachmentList;