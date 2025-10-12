import { Box, Button, Modal, TextField, Typography, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
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

const allRoles = ['Admin', 'Approver', 'Designer', 'Requester'];

interface AddUserModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (userData: any) => void;
}

const AddUserModal = ({ open, onClose, onSubmit }: AddUserModalProps) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            // Reset form on open
            setUsername('');
            setEmail('');
            setPassword('');
            setFirstName('');
            setLastName('');
            setPhoneNumber('');
            setSelectedRoles([]);
        }
    }, [open]);

    const handleRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const role = event.target.name;
        if (event.target.checked) {
            setSelectedRoles((prev) => [...prev, role]);
        } else {
            setSelectedRoles((prev) => prev.filter((r) => r !== role));
        }
    };

    const handleSubmit = () => {
        onSubmit({ username, email, password, roles: selectedRoles, firstName, lastName, phoneNumber });
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">افزودن کاربر جدید</Typography>
                <TextField fullWidth required label="نام کاربری" value={username} onChange={(e) => setUsername(e.target.value)} margin="normal" />
                <TextField fullWidth required label="ایمیل" type="email" value={email} onChange={(e) => setEmail(e.target.value)} margin="normal" />
                <TextField fullWidth required label="رمز عبور" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" />
                <TextField fullWidth label="نام (اختیاری)" value={firstName} onChange={(e) => setFirstName(e.target.value)} margin="normal" />
                <TextField fullWidth label="نام خانوادگی (اختیاری)" value={lastName} onChange={(e) => setLastName(e.target.value)} margin="normal" />
                <TextField fullWidth label="شماره تماس (اختیاری)" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} margin="normal" />
                <Typography sx={{ mt: 2 }}>نقش‌ها:</Typography>
                <FormGroup>
                    {allRoles.map((role) => (
                        <FormControlLabel
                            key={role}
                            control={<Checkbox checked={selectedRoles.includes(role)} onChange={handleRoleChange} name={role} />}
                            label={role}
                        />
                    ))}
                </FormGroup>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={onClose}>انصراف</Button>
                    <Button variant="contained" onClick={handleSubmit}>ایجاد کاربر</Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default AddUserModal;