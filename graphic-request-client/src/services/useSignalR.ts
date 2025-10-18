import { useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useSelector } from 'react-redux';
import { selectCurrentUserToken } from '../pages/auth/authSlice';

interface Notification {
    id: number;
    requestId: number;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

export const useSignalR = (
    onNotificationReceived: (notification: Notification) => void,
    onNotificationRead: (notificationId: number) => void,
    onAllNotificationsRead: () => void,
    onInboxUpdate?: () => void
) => {
    const token = useSelector(selectCurrentUserToken);
    const connectionRef = useRef<HubConnection | null>(null);

    useEffect(() => {
        if (!token) return;

        // Remove /api from the base URL for SignalR hub connection
        const baseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
        
        const connection = new HubConnectionBuilder()
            .withUrl(`${baseUrl}/hubs/notifications`, {
                accessTokenFactory: () => token || '',
            })
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        connection.on('ReceiveNotification', onNotificationReceived);
        connection.on('NotificationRead', onNotificationRead);
        connection.on('AllNotificationsRead', onAllNotificationsRead);
        
        // Listen for inbox updates
        if (onInboxUpdate) {
            connection.on('InboxUpdate', onInboxUpdate);
        }

        connection
            .start()
            .then(() => console.log('SignalR Connected'))
            .catch((err) => {
                // Suppress AbortError which is expected during React Strict Mode
                if (err.name !== 'AbortError') {
                    console.error('SignalR Connection Error: ', err);
                }
            });

        connectionRef.current = connection;

        return () => {
            connection.stop();
        };
    }, [token, onNotificationReceived, onNotificationRead, onAllNotificationsRead, onInboxUpdate]);

    return connectionRef.current;
};
