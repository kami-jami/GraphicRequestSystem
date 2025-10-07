import { useGetRequestsQuery } from '../services/apiSlice';
import { Box, CircularProgress, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid'
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { mapStatusToPersian, mapPriorityToPersian } from '../utils/mappers';
import { useNavigate } from 'react-router-dom';
import moment from 'moment-jalaali';

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

const RequestsListPage = () => {
    const { data: requests, isLoading, isError } = useGetRequestsQuery();
    const navigate = useNavigate();

    if (isLoading) {
        return <CircularProgress />;
    }

    if (isError || !requests) {
        return <Typography color="error">خطا در دریافت لیست درخواست‌ها</Typography>;
    }

    return (
        <Box sx={{ height: 600, width: '100%' }}>
            <Typography variant="h4" gutterBottom>
                لیست تمام درخواست‌ها
            </Typography>
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
        </Box>
    );
};

export default RequestsListPage;