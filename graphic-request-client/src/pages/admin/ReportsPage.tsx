import { useState } from 'react';
import { Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useLazyGetDesignerPerformanceReportQuery } from '../../services/apiSlice';
import moment from 'moment-jalaali';
import type { Moment } from 'moment-jalaali';

const columns: GridColDef[] = [
    { field: 'designerName', headerName: 'نام طراح', width: 250 },
    { field: 'completedCount', headerName: 'تعداد درخواست‌های تکمیل شده', width: 250, type: 'number' },
];

const ReportsPage = () => {
    const [startDate, setStartDate] = useState<Moment | null>(moment().subtract(30, 'days'));
    const [endDate, setEndDate] = useState<Moment | null>(moment());

    // از نسخه Lazy کوئری استفاده می‌کنیم تا فقط با کلیک دکمه اجرا شود
    const [trigger, { data: reportData, isLoading, isFetching }] = useLazyGetDesignerPerformanceReportQuery();

    const handleGenerateReport = () => {
        if (startDate && endDate) {
            trigger({
                startDate: startDate.toDate().toISOString(),
                endDate: endDate.toDate().toISOString(),
            });
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>گزارش عملکرد طراحان</Typography>

            <Paper sx={{ p: 3, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <DatePicker label="از تاریخ" value={startDate} onChange={(newValue) => setStartDate(newValue)} />
                <DatePicker label="تا تاریخ" value={endDate} onChange={(newValue) => setEndDate(newValue)} />
                <Button variant="contained" onClick={handleGenerateReport} disabled={isFetching}>
                    {isFetching ? <CircularProgress size={24} /> : 'تولید گزارش'}
                </Button>
            </Paper>

            {(isLoading || isFetching) ? (
                <CircularProgress />
            ) : (
                reportData && (
                    <Box sx={{ height: 400, width: '100%' }}>
                        <DataGrid
                            rows={reportData}
                            columns={columns}
                            getRowId={(row) => row.designerId} // شناسه منحصر به فرد هر سطر
                        />
                    </Box>
                )
            )}
        </Box>
    );
};

export default ReportsPage;