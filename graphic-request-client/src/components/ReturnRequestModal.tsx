import { Box, Button, Modal, TextField, Typography } from '@mui/material';
import { useState } from 'react';

// استایل مودال
const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

interface ReturnRequestModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (comment: string) => void;
}

const ReturnRequestModal = ({ open, onClose, onSubmit }: ReturnRequestModalProps) => {
    const [comment, setComment] = useState('');

    const handleSubmit = () => {
        if (comment.trim()) {
            onSubmit(comment);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">بازگشت جهت اصلاح</Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="لطفا دلیل بازگشت را بنویسید (الزامی)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    margin="normal"
                />
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={onClose}>انصراف</Button>
                    <Button variant="contained" color="warning" onClick={handleSubmit}>ارسال</Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default ReturnRequestModal;