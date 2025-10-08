import { useGetRequestsQuery } from '../services/apiSlice';
import { Box, CircularProgress, Typography, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { mapStatusToPersian, mapPriorityToPersian } from '../utils/mappers';
import { useNavigate } from 'react-router-dom';
import moment from 'moment-jalaali';
import { useState } from 'react';

// تعریف ستون‌های جدول
const columns: GridColDef[] = [
    {
        field: 'id',
        headerName: 'ردیف',
        width: 90,
        renderCell: (params: GridRenderCellParams) => {
            return params.api.getRowIndexRelativeToVisibleRows(params.id) + 1;
        },
    },
    { field: 'title', headerName: 'عنوان درخواست', width: 250 },
    {
        field: 'status',
        headerName: 'وضعیت',
        width: 150,
        valueFormatter: (value) => mapStatusToPersian(value), // اصلاح شد
    },
    {
        field: 'priority',
        headerName: 'اولویت',
        width: 120,
        valueFormatter: (value) => mapPriorityToPersian(value), // اصلاح شد
    },
    { field: 'requesterName', headerName: 'درخواست‌دهنده', width: 150 },
    {
        field: 'dueDate',
        headerName: 'تاریخ تحویل',
        width: 180,
        valueFormatter: (value) => {
            if (!value) return '-';
            return moment(value).format('jYYYY/jMM/jDD');
        },
    },
];

const statusOptions = [
    { value: 0, label: 'ثبت شده' },
    { value: 1, label: 'در حال بررسی طراح' },
    { value: 3, label: 'در حال انجام طراحی' },
    { value: 4, label: 'منتظر تایید' },
    // ... می‌توانید سایر وضعیت‌ها را اضافه کنید
];

const RequestsListPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<number | ''>('');

    const { data: requests, isLoading, isError } = useGetRequestsQuery({
        status: statusFilter,
        searchTerm: searchTerm,
    });


    if (isLoading) {
        return <CircularProgress />;
    }

    if (isError || !requests) {
        return <Typography color="error">خطا در دریافت لیست درخواست‌ها</Typography>;
    }

    return (
        <Box sx={{ height: 700, width: '100%' }}>
            <Typography variant="h4" gutterBottom>
                لیست تمام درخواست‌ها
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                    label="جستجو در عنوان..."
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ flexGrow: 1 }}
                />
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>فیلتر بر اساس وضعیت</InputLabel>
                    <Select
                        value={statusFilter}
                        label="فیلتر بر اساس وضعیت"
                        onChange={(e) => setStatusFilter(e.target.value as number | '')}
                    >
                        <MenuItem value=""><em>همه وضعیت‌ها</em></MenuItem>
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
                    onRowClick={(params) => navigate(`/requests/${params.id}`)}
                    sx={{ boxShadow: 2, border: 2, borderColor: 'primary.light', '& .MuiDataGrid-cell:hover': { color: 'primary.main' }, '& .MuiDataGrid-row': { cursor: 'pointer' } }}
                    rows={requests}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: 10,
                            },
                        },
                    }}
                    pageSizeOptions={[5, 10, 20]}
                    checkboxSelection
                    disableRowSelectionOnClick
                />
            )}
        </Box>
    );
};

export default RequestsListPage;