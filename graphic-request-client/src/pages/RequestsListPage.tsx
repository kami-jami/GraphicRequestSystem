import { useGetRequestsQuery } from '../services/apiSlice';
import { Box, CircularProgress, Typography, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mapStatusToPersian, mapPriorityToPersian } from '../utils/mappers';
import moment from 'moment-jalaali';
import { useState, useEffect } from 'react';

const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    { field: 'title', headerName: 'عنوان درخواست', width: 250 },
    { field: 'status', headerName: 'وضعیت', width: 150, valueFormatter: (value) => mapStatusToPersian(value) },
    { field: 'priority', headerName: 'اولویت', width: 120, valueFormatter: (value) => mapPriorityToPersian(value) },
    { field: 'requesterName', headerName: 'درخواست‌دهنده', width: 150 },
    { field: 'dueDate', headerName: 'تاریخ تحویل', width: 180, valueFormatter: (value) => value ? moment(value).locale('fa').format('YYYY/MM/DD HH:mm') : '' },
];

const statusOptions = [
    { value: 0, label: 'ثبت شده' }, { value: 1, label: 'در حال بررسی طراح' }, { value: 2, label: 'منتظر اصلاح' },
    { value: 3, label: 'در حال انجام طراحی' }, { value: 4, label: 'منتظر تایید' }, { value: 5, label: 'منتظر طراحی مجدد' },
];

const getWorklistTitle = (statuses: string[]): string => {
    const statusStr = statuses.sort().join(',');
    switch (statusStr) {
        case '3,5': return 'کارتابل: درخواست‌های در حال انجام';
        case '4': return 'کارتابل: درخواست‌های منتظر تایید';
        case '2': return 'کارتابل: درخواست‌های نیازمند اصلاح';
        default: return 'لیست تمام درخواست‌ها';
    }
};

const RequestsListPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [pageTitle, setPageTitle] = useState('لیست تمام درخواست‌ها');


    // State های داخلی برای مدیریت فیلترها
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<(number | '')[]>([]);

    // --- این useEffect مشکل را حل می‌کند ---
    useEffect(() => {
        const statusesFromUrl = searchParams.getAll('statuses');
        const searchTermFromUrl = searchParams.get('searchTerm') || '';

        // هر بار که پارامترهای URL تغییر می‌کنند، state های داخلی را به‌روز کن
        setStatusFilter(statusesFromUrl.map(s => Number(s)));
        setSearchTerm(searchTermFromUrl);
        setPageTitle(getWorklistTitle(statusesFromUrl)); // عنوان صفحه را ست کن
    }, [searchParams]);

    // هوک API حالا از state های داخلی استفاده می‌کند
    const { data: requests, isLoading, isError } = useGetRequestsQuery({
        statuses: statusFilter,
        searchTerm: searchTerm,
    });

    // این تابع برای زمانی است که کاربر فیلتر را به صورت دستی تغییر می‌دهد
    const handleStatusFilterChange = (value: (number | '')[]) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('statuses'); // پارامترهای قبلی را پاک کن
        value.filter(s => s !== '').forEach(s => newParams.append('statuses', s.toString())); // پارامترهای جدید را اضافه کن
        setSearchParams(newParams);
    };

    return (
        <Box sx={{ height: 700, width: '100%' }}>
            <Typography variant="h4" gutterBottom>{pageTitle}</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField label="جستجو در عنوان..." variant="outlined" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ flexGrow: 1 }} />
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>فیلتر بر اساس وضعیت</InputLabel>
                    <Select
                        multiple // اجازه انتخاب چند وضعیت
                        value={statusFilter}
                        label="فیلتر بر اساس وضعیت"
                        onChange={(e) => handleStatusFilterChange(e.target.value as number[])}
                        renderValue={(selected) => (selected as number[]).map(s => statusOptions.find(opt => opt.value === s)?.label).join(', ')}
                    >
                        {statusOptions.map(opt => (
                            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {isLoading && <CircularProgress />}
            {isError && <Typography color="error">خطا در دریافت لیست درخواست‌ها</Typography>}
            {!isLoading && !isError && (
                <DataGrid
                    rows={requests || []}
                    columns={columns}
                    onRowClick={(params) => navigate(`/requests/${params.id}`)}
                    sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
                />
            )}
        </Box>
    );
};

export default RequestsListPage;