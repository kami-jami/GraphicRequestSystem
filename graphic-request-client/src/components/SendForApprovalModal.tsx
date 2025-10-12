import { Box, Button, Modal, TextField, Typography, CircularProgress, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useState } from 'react';
import { useGetApproversQuery } from '../services/apiSlice';
import { useDispatch } from 'react-redux';
import { showNotification } from '../services/notificationSlice';


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

interface SendForApprovalModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (comment: string, files: FileList | null, approverId: string) => void;
}

const SendForApprovalModal = ({ open, onClose, onSubmit }: SendForApprovalModalProps) => {
    const dispatch = useDispatch();
    const { data: approvers, isLoading } = useGetApproversQuery();
    const [comment, setComment] = useState('');
    const [files, setFiles] = useState<FileList | null>(null);
    const [selectedApproverId, setSelectedApproverId] = useState('');

    const handleSubmit = () => {
        if (!selectedApproverId) {
            dispatch(showNotification({ message: 'لطفا یک تایید کننده انتخاب کنید.', severity: 'error' }));
            return;
        }
        onSubmit(comment, files, selectedApproverId);
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={style}>
                <Typography variant="h6" component="h2">ارسال برای تایید</Typography>

                {isLoading ? <CircularProgress /> : (
                    <FormControl fullWidth required margin="normal">
                        <InputLabel>انتخاب تایید کننده</InputLabel>
                        <Select
                            value={selectedApproverId}
                            label="انتخاب تایید کننده"
                            onChange={(e) => setSelectedApproverId(e.target.value)}
                        >
                            {approvers?.map((approver) => (
                                <MenuItem key={approver.id} value={approver.id}>
                                    {approver.userName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="توضیحات (اختیاری)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    margin="normal"
                />
                <Button variant="contained" component="label" sx={{ mt: 2, width: '100%' }}>
                    پیوست فایل (اختیاری)
                    <input type="file" hidden multiple onChange={(e) => setFiles(e.target.files)} />
                </Button>
                {files && files.length > 0 && (
                    <Box>
                        <ul>
                            {[...files].map((file, index) => <li key={index}><Typography variant="caption">{file.name}</Typography></li>)}
                        </ul>
                    </Box>
                )}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={onClose}>انصراف</Button>
                    <Button variant="contained" color="secondary" onClick={handleSubmit}>ارسال</Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default SendForApprovalModal;