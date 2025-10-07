import { Snackbar, Alert } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { selectNotification, hideNotification } from '../services/notificationSlice';

const Notification = () => {
    const dispatch = useDispatch();
    const { open, message, severity } = useSelector(selectNotification);

    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        dispatch(hideNotification());
    };

    return (
        <Snackbar
            open={open}
            autoHideDuration={6000} // ۶ ثانیه
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
                {message}
            </Alert>
        </Snackbar>
    );
};

export default Notification;