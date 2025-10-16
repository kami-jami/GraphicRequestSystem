import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './store';

interface SignalRNotification {
    id: number;
    requestId: number;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

interface SignalRNotificationState {
    notifications: SignalRNotification[];
    unreadCount: number;
}

const initialState: SignalRNotificationState = {
    notifications: [],
    unreadCount: 0,
};

const signalRNotificationSlice = createSlice({
    name: 'signalRNotifications',
    initialState,
    reducers: {
        setSignalRNotifications: (state, action: PayloadAction<SignalRNotification[]>) => {
            state.notifications = action.payload;
            state.unreadCount = action.payload.filter(n => !n.isRead).length;
        },
        addSignalRNotification: (state, action: PayloadAction<SignalRNotification>) => {
            state.notifications.unshift(action.payload);
            if (!action.payload.isRead) {
                state.unreadCount += 1;
            }
        },
        markSignalRNotificationAsRead: (state, action: PayloadAction<number>) => {
            const notification = state.notifications.find(n => n.id === action.payload);
            if (notification && !notification.isRead) {
                notification.isRead = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },
        markAllSignalRNotificationsAsRead: (state) => {
            state.notifications.forEach(n => n.isRead = true);
            state.unreadCount = 0;
        },
        setSignalRUnreadCount: (state, action: PayloadAction<number>) => {
            state.unreadCount = action.payload;
        },
    },
});

export const {
    setSignalRNotifications,
    addSignalRNotification,
    markSignalRNotificationAsRead,
    markAllSignalRNotificationsAsRead,
    setSignalRUnreadCount,
} = signalRNotificationSlice.actions;

export default signalRNotificationSlice.reducer;

export const selectSignalRNotifications = (state: RootState) => state.signalRNotifications.notifications;
export const selectSignalRUnreadCount = (state: RootState) => state.signalRNotifications.unreadCount;
