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

interface LookupItemModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (value: string) => void;
    initialValue?: string; // برای حالت ویرایش
}

const LookupItemModal = ({ open, onClose, onSubmit, initialValue = '' }: LookupItemModalProps) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (open) {
            setValue(initialValue);
        }
    }, [open, initialValue]);

    const handleSubmit = () => {
        if (value.trim()) {
            onSubmit(value);
        }
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">
                    {initialValue ? 'ویرایش آیتم' : 'افزودن آیتم جدید'}
                </Typography>
                <TextField
                    fullWidth
                    label="مقدار"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    margin="normal"
                />
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={onClose}>انصراف</Button>
                    <Button variant="contained" onClick={handleSubmit}>ذخیره</Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default LookupItemModal;