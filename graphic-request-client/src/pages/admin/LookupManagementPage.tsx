import { useState } from 'react';
import { Box, CircularProgress, Typography, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useGetLookupsQuery, useGetLookupItemsQuery } from '../../services/apiSlice';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../services/notificationSlice';

const LookupManagementPage = () => {
    const dispatch = useDispatch();
    const [selectedLookupId, setSelectedLookupId] = useState<number | ''>('');

    const { data: lookups, isLoading: isLoadingLookups } = useGetLookupsQuery();
    const { data: lookupItems, isLoading: isLoadingItems } = useGetLookupItemsQuery(
        selectedLookupId as number,
        {
            skip: !selectedLookupId, // تا زمانی که لیستی انتخاب نشده، این کوئری را اجرا نکن
        }
    );

    const columns: GridColDef[] = [
        {
            field: 'id',
            headerName: 'ردیف',
            width: 90,
            renderCell: (params: GridRenderCellParams) => {
                return params.api.getRowIndexRelativeToVisibleRows(params.id) + 1;
            },
        },
        { field: 'value', headerName: 'مقدار', flex: 1 },
        {
            field: 'actions',
            headerName: 'عملیات',
            width: 150,
            renderCell: (params: GridRenderCellParams) => (
                <>
                    <IconButton onClick={() => alert(`Edit item ${params.row.id}`)}><EditIcon /></IconButton>
                    <IconButton onClick={() => alert(`Delete item ${params.row.id}`)} color="error"><DeleteIcon /></IconButton>
                </>
            ),
        },
    ];

    if (isLoadingLookups) return <CircularProgress />;

    return (
        <Box sx={{ height: 600, width: '100%' }}>
            <Typography variant="h4" gutterBottom>مدیریت لیست‌های انتخابی</Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>یک لیست را برای مدیریت انتخاب کنید</InputLabel>
                <Select
                    value={selectedLookupId}
                    label="یک لیست را برای مدیریت انتخاب کنید"
                    onChange={(e) => setSelectedLookupId(e.target.value as number)}
                >
                    {lookups?.map((lookup) => (
                        <MenuItem key={lookup.id} value={lookup.id}>{lookup.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {selectedLookupId && (
                <DataGrid
                    rows={lookupItems || []}
                    columns={columns}
                    loading={isLoadingItems}
                    getRowId={(row) => row.id}
                />
            )}
        </Box>
    );
};

export default LookupManagementPage;