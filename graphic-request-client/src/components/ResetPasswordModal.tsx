import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Alert } from '@mui/material';

interface ResetPasswordModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (newPassword: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
    userName: string;
}

const ResetPasswordModal = ({ open, onClose, onSubmit, userName }: ResetPasswordModalProps) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        const newErrors: { newPassword?: string; confirmPassword?: string } = {};

        if (!newPassword || newPassword.length < 6) {
            newErrors.newPassword = 'رمز عبور باید حداقل 6 کاراکتر باشد.';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'تایید رمز عبور الزامی است.';
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'رمز عبور و تایید آن باید یکسان باشند.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        setServerError(null);

        const result = await onSubmit(newPassword, confirmPassword);

        setIsSubmitting(false);

        if (result.success) {
            handleClose();
        } else {
            setServerError(result.error || 'خطای نامشخص');
        }
    };

    const handleClose = () => {
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
        setServerError(null);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>بازنشانی رمز عبور کاربر "{userName}"</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2 }}>
                    {serverError && (
                        <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
                            {serverError}
                        </Alert>
                    )}
                    <TextField
                        label="رمز عبور جدید"
                        type="password"
                        fullWidth
                        value={newPassword}
                        onChange={(e) => {
                            setNewPassword(e.target.value);
                            setErrors({ ...errors, newPassword: undefined });
                            setServerError(null);
                        }}
                        error={!!errors.newPassword}
                        helperText={errors.newPassword}
                        sx={{ mb: 2 }}
                        disabled={isSubmitting}
                    />
                    <TextField
                        label="تایید رمز عبور جدید"
                        type="password"
                        fullWidth
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setErrors({ ...errors, confirmPassword: undefined });
                            setServerError(null);
                        }}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
                        disabled={isSubmitting}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={isSubmitting}>انصراف</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isSubmitting}>
                    {isSubmitting ? 'در حال بازنشانی...' : 'بازنشانی رمز عبور'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ResetPasswordModal;
