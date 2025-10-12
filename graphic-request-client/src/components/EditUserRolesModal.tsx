import { Box, Button, Modal, Typography, FormGroup, FormControlLabel, Checkbox } from '@mui/material';
import { useState, useEffect } from 'react';
import { mapRoleToPersian } from '../utils/mappers';

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

const allRoles = [
    { name: 'Admin', persianName: mapRoleToPersian('Admin') },
    { name: 'Approver', persianName: mapRoleToPersian('Approver') },
    { name: 'Designer', persianName: mapRoleToPersian('Designer') },
    { name: 'Requester', persianName: mapRoleToPersian('Requester') },
];

interface EditUserRolesModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (selectedRoles: string[]) => void;
    currentUserRoles: string[];
}

const EditUserRolesModal = ({ open, onClose, onSubmit, currentUserRoles }: EditUserRolesModalProps) => {
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            setSelectedRoles(currentUserRoles);
        }
    }, [open, currentUserRoles]);

    const handleRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const roleName = event.target.name;
        if (event.target.checked) {
            setSelectedRoles((prev) => [...prev, roleName]);
        } else {
            setSelectedRoles((prev) => prev.filter((r) => r !== roleName));
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
                            key={role.name}
                            control={
                                <Checkbox
                                    checked={selectedRoles.includes(role.name)}
                                    onChange={handleRoleChange}
                                    name={role.name}
                                />
                            }
                            label={role.persianName}
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