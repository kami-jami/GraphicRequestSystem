import { Box, Button, Modal, Typography, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
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
const allRoles = ['Admin', 'Approver', 'Designer', 'Requester']; // نقش‌های ثابت سیستم

interface EditUserRolesModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (selectedRoles: string[]) => void;
    currentUserRoles: string[];
}

const EditUserRolesModal = ({ open, onClose, onSubmit, currentUserRoles }: EditUserRolesModalProps) => {
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    // هر بار که مودال باز می‌شود، چک‌باکس‌ها را بر اساس نقش‌های فعلی کاربر تنظیم می‌کند
    useEffect(() => {
        if (open) {
            setSelectedRoles(currentUserRoles);
        }
    }, [open, currentUserRoles]);

    const handleRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const role = event.target.name;
        if (event.target.checked) {
            setSelectedRoles((prev) => [...prev, role]);
        } else {
            setSelectedRoles((prev) => prev.filter((r) => r !== role));
        }
    };

    const handleSubmit = () => {
        onSubmit(selectedRoles);
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">ویرایش نقش‌های کاربر</Typography>
                <FormGroup sx={{ mt: 2 }}>
                    {allRoles.map((role) => (
                        <FormControlLabel
                            key={role}
                            control={
                                <Checkbox
                                    checked={selectedRoles.includes(role)}
                                    onChange={handleRoleChange}
                                    name={role}
                                />
                            }
                            label={role}
                        />
                    ))}
                </FormGroup>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={onClose}>انصراف</Button>
                    <Button variant="contained" onClick={handleSubmit}>ذخیره تغییرات</Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default EditUserRolesModal;