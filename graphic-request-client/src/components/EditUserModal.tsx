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

interface EditUserModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (userData: any) => void;
    user: any;
}

const EditUserModal = ({ open, onClose, onSubmit, user }: EditUserModalProps) => {
    const [email, setEmail] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        if (user) {
            setEmail(user.email || '');
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setPhoneNumber(user.phoneNumber || '');
        }
    }, [user]);

    const handleSubmit = () => {
        onSubmit({ email, firstName, lastName, phoneNumber });
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">ویرایش اطلاعات کاربر: {user?.username}</Typography>
                <TextField fullWidth required label="ایمیل" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" />
                <TextField fullWidth label="نام" value={firstName} onChange={(e) => setFirstName(e.target.value)} margin="normal" />
                <TextField fullWidth label="نام خانوادگی" value={lastName} onChange={(e) => setLastName(e.target.value)} margin="normal" />
                <TextField fullWidth label="شماره تماس" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} margin="normal" />
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={onClose}>انصراف</Button>
                    <Button variant="contained" onClick={handleSubmit}>ذخیره تغییرات</Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default EditUserModal;