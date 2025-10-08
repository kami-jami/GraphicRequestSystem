import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

interface ConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationDialog = ({ open, onClose, onConfirm, title, message }: ConfirmationDialogProps) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{message}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>انصراف</Button>
                <Button onClick={onConfirm} color="error" autoFocus>
                    تایید و حذف
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmationDialog;