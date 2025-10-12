import { Box, Button, Modal, TextField, Typography } from '@mui/material';
import { useState, useEffect } from 'react';

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
    onSubmit: (comment: string, files: FileList | null) => void;
}

const ReturnRequestModal = ({ open, onClose, onSubmit }: ReturnRequestModalProps) => {
    const [comment, setComment] = useState('');
    const [files, setFiles] = useState<FileList | null>(null);

    useEffect(() => {
        if (open) {
            setComment('');
            setFiles(null);
        }
    }, [open]);

    const handleSubmit = () => {
        onSubmit(comment, files);
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">بازگشت جهت اصلاح/طراحی مجدد</Typography>
                <TextField fullWidth multiline rows={4} label="دلیل بازگشت (اختیاری)" value={comment} onChange={(e) => setComment(e.target.value)} margin="normal" />
                <Button variant="outlined" component="label" sx={{ mt: 2, width: '100%' }}>
                    پیوست فایل (اختیاری)
                    <input type="file" hidden multiple onChange={(e) => setFiles(e.target.files)} />
                </Button>

                {/* --- این بخش جدید اضافه شده است --- */}
                {files && files.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="caption">فایل‌های انتخاب شده:</Typography>
                        <ul>
                            {[...files].map((file, index) => (
                                <li key={index}><Typography variant="caption">{file.name}</Typography></li>
                            ))}
                        </ul>
                    </Box>
                )}
                {/* --- پایان بخش جدید --- */}

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={onClose}>انصراف</Button>
                    <Button variant="contained" color="warning" onClick={handleSubmit}>ارسال بازخورد</Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default ReturnRequestModal;