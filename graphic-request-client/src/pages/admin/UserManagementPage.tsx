import { useGetUsersWithRolesQuery, useUpdateUserRolesMutation } from '../../services/apiSlice';
import { Box, CircularProgress, Typography, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import { useState } from 'react';
import EditUserRolesModal from '../../components/EditUserRolesModal';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../services/notificationSlice';

const UserManagementPage = () => {
    const dispatch = useDispatch();
    const { data: users, isLoading } = useGetUsersWithRolesQuery();
    const [updateUserRoles, { isLoading: isUpdating }] = useUpdateUserRolesMutation();

    const [isModalOpen, setModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const handleOpenModal = (user: any) => {
        setSelectedUser(user);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedUser(null);
        setModalOpen(false);
    };

    const handleUpdateRoles = async (newRoles: string[]) => {
        if (selectedUser) {
            try {
                await updateUserRoles({ userId: selectedUser.id, roles: newRoles }).unwrap();
                handleCloseModal(); // بستن مودال پس از موفقیت
            } catch (error) {
                console.error("Failed to update roles", error);
                dispatch(showNotification({ message: 'خطا در به‌روزرسانی نقش‌ها', severity: 'error' }));
                // می‌توانید اینجا یک پیام خطا نمایش دهید
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
        { field: 'username', headerName: 'نام کاربری', width: 200 },
        { field: 'email', headerName: 'ایمیل', width: 250 },
        {
            field: 'roles',
            headerName: 'نقش‌ها',
            width: 300,
            valueFormatter: (value: string[]) => value.join(', '), // آرایه نقش‌ها را به متن تبدیل می‌کند
        },
        {
            field: 'actions',
            headerName: 'عملیات',
            width: 100,
            renderCell: (params: GridRenderCellParams) => ( // نوع پارامتر را مشخص می‌کنیم
                <IconButton onClick={() => handleOpenModal(params.row)}>
                    <EditIcon />
                </IconButton>
            ),
        },
    ];

    if (isLoading) return <CircularProgress />;

    return (
        <>
            <Box sx={{ height: 600, width: '100%' }}>
                <Typography variant="h4" gutterBottom>مدیریت کاربران</Typography>
                <DataGrid
                    rows={users || []}
                    columns={columns}
                    getRowId={(row) => row.id}
                    loading={isUpdating} // نمایش لودینگ روی جدول هنگام آپدیت
                />
            </Box>
            {selectedUser && (
                <EditUserRolesModal
                    open={isModalOpen}
                    onClose={handleCloseModal}
                    onSubmit={handleUpdateRoles}
                    currentUserRoles={selectedUser.roles || []}
                />
            )}
        </>
    );
};

export default UserManagementPage;