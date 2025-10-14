import { useGetSystemSettingsQuery, useUpdateSystemSettingsMutation, useGetDesignersQuery } from '../../services/apiSlice';
import { Box, Button, CircularProgress, Paper, TextField, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useState, useEffect } from 'react';
import { mapSettingKeyToPersian } from '../../utils/mappers';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../services/notificationSlice';


const SettingsPage = () => {
    const dispatch = useDispatch();
    const { data: initialSettings, isLoading } = useGetSystemSettingsQuery();
    const [updateSettings, { isLoading: isUpdating }] = useUpdateSystemSettingsMutation();
    const { data: designers, isLoading: isLoadingDesigners } = useGetDesignersQuery(); // جدید


    // State محلی برای نگهداری تغییرات فرم
    const [settings, setSettings] = useState<any[]>([]);

    // وقتی داده‌ها از سرور رسید، state فرم را با آن پر می‌کنیم
    useEffect(() => {
        if (initialSettings) {
            setSettings(initialSettings);
        }
    }, [initialSettings]);

    const handleSettingChange = (key: string, value: string) => {
        setSettings((prev) =>
            prev.map((setting) =>
                setting.settingKey === key ? { ...setting, settingValue: value } : setting
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateSettings(settings).unwrap();
            dispatch(showNotification({ message: 'تنظیمات با موفقیت ذخیره شد!', severity: 'success' }));
        } catch (error) {
            console.error('Failed to update settings', error);
            dispatch(showNotification({ message: 'خطا در ذخیره تنظیمات', severity: 'error' }));
        }
    };

    if (isLoading) return <CircularProgress />;

    return (
        <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h4" gutterBottom>مدیریت تنظیمات سیستم</Typography>
            <Paper sx={{ p: 3 }}>
                {settings.map((setting) => {
                    // --- این بخش به صورت شرطی کار می‌کند ---
                    if (setting.settingKey === 'DefaultDesignerId') {
                        return (
                            <FormControl key={setting.settingKey} fullWidth margin="normal">
                                <InputLabel>{mapSettingKeyToPersian(setting.settingKey)}</InputLabel>
                                <Select
                                    value={setting.settingValue}
                                    label={mapSettingKeyToPersian(setting.settingKey)}
                                    onChange={(e) => handleSettingChange(setting.settingKey, e.target.value)}
                                >
                                    {designers?.map((designer) => (
                                        <MenuItem key={designer.id} value={designer.id}>
                                            {designer.FullName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        );
                    } else {
                        return (
                            <TextField
                                key={setting.settingKey}
                                fullWidth
                                label={mapSettingKeyToPersian(setting.settingKey)}
                                value={setting.settingValue}
                                onChange={(e) => handleSettingChange(setting.settingKey, e.target.value)}
                                margin="normal"
                                type={['MaxNormalRequestsPerDay', 'MaxUrgentRequestsPerDay', 'DeadlineWarningDays', 'OrderableDaysInFuture'].includes(setting.settingKey) ? 'number' : 'text'}
                            />
                        );
                    }
                    // --- پایان بخش شرطی ---
                })}
                <Button type="submit" variant="contained" sx={{ mt: 3 }} disabled={isUpdating}>
                    {isUpdating ? <CircularProgress size={24} /> : 'ذخیره تغییرات'}
                </Button>
            </Paper>
        </Box>
    );
};

export default SettingsPage;