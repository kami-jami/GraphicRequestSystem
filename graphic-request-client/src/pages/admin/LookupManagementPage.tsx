import { useState } from 'react';
import { Box, CircularProgress, Typography, FormControl, InputLabel, Select, MenuItem, IconButton, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useGetLookupsQuery, useGetLookupItemsQuery, useAddLookupItemMutation, useUpdateLookupItemMutation, useDeleteLookupItemMutation } from '../../services/apiSlice';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import LookupItemModal from '../../components/LookupItemModal';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../services/notificationSlice';

const LookupManagementPage = () => {
    const dispatch = useDispatch();
    const [selectedLookupId, setSelectedLookupId] = useState<number | ''>('');
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any | null>(null);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);

    // --- هوک‌های API ---
    const { data: lookups, isLoading: isLoadingLookups } = useGetLookupsQuery();
    const { data: lookupItems, isLoading: isLoadingItems } = useGetLookupItemsQuery(selectedLookupId as number, { skip: !selectedLookupId });
    const [addLookupItem, { isLoading: isAdding }] = useAddLookupItemMutation();
    const [updateLookupItem, { isLoading: isUpdating }] = useUpdateLookupItemMutation();
    const [deleteLookupItem, { isLoading: isDeleting }] = useDeleteLookupItemMutation();

    // --- هندلرهای مودال ---
    const handleOpenAddModal = () => {
        setEditingItem(null); // حالت افزودن
        setModalOpen(true);
    };

    const handleOpenEditModal = (item: any) => {
        setEditingItem(item); // حالت ویرایش
        setModalOpen(true);
    };

    const handleCloseModal = () => setModalOpen(false);

    const handleSubmitModal = async (value: string) => {
        try {
            if (editingItem) { // ویرایش
                await updateLookupItem({ itemId: editingItem.id, value }).unwrap();
                dispatch(showNotification({ message: 'آیتم با موفقیت به‌روزرسانی شد', severity: 'success' }));
            } else { // افزودن
                await addLookupItem({ lookupId: selectedLookupId as number, value }).unwrap();
                dispatch(showNotification({ message: 'آیتم با موفقیت اضافه شد', severity: 'success' }));
            }
            handleCloseModal();
        } catch (error) {
            console.error("Failed to save item", error);
            dispatch(showNotification({ message: 'خطا در ذخیره‌سازی آیتم', severity: 'error' }));
        }
    };

    const handleOpenDeleteDialog = (item: any) => {
        setItemToDelete(item);
        setConfirmOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setItemToDelete(null);
        setConfirmOpen(false);
    };

    const handleDelete = async () => {
        if (itemToDelete) {
            try {
                await deleteLookupItem({ itemId: itemToDelete.id, lookupId: selectedLookupId as number }).unwrap();
                dispatch(showNotification({ message: 'آیتم با موفقیت حذف شد', severity: 'success' }));
                handleCloseDeleteDialog();
            } catch (error) {
                console.error("Failed to delete item", error);
                dispatch(showNotification({ message: 'خطا در حذف آیتم', severity: 'error' }));
            }
        }
    };

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
                    <IconButton onClick={() => handleOpenEditModal(params.row)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleOpenDeleteDialog(params.row)} color="error"><DeleteIcon /></IconButton>
                </>
            ),
        },
    ];

    if (isLoadingLookups) return <CircularProgress />;

    const isLoading = isLoadingItems || isAdding || isUpdating || isDeleting;

    return (
        <>
            <Box sx={{ height: 600, width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" gutterBottom>مدیریت لیست‌های انتخابی</Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleOpenAddModal}
                        disabled={!selectedLookupId}
                    >
                        افزودن آیتم جدید
                    </Button>
                </Box>

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
            <LookupItemModal
                open={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmitModal}
                initialValue={editingItem?.value || ''}
            />

            {itemToDelete && (
                <ConfirmationDialog
                    open={isConfirmOpen}
                    onClose={handleCloseDeleteDialog}
                    onConfirm={handleDelete}
                    title="تایید حذف"
                    message={`آیا از حذف آیتم "${itemToDelete.value}" مطمئن هستید؟`}
                />
            )}
        </>
    );
};

export default LookupManagementPage;