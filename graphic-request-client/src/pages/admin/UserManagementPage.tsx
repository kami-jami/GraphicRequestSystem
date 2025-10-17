import { useGetUsersWithRolesQuery, useUpdateUserRolesMutation, useCreateUserMutation, useToggleUserStatusMutation, useUpdateUserMutation, useResetUserPasswordMutation } from '../../services/apiSlice';
import { Box, CircularProgress, Typography, IconButton, Chip, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useState } from 'react';
import EditUserRolesModal from '../../components/EditUserRolesModal';
import ConfirmationDialog from '../../components/ConfirmationDialog';
import AddUserModal from '../../components/AddUserModal';
import EditUserModal from '../../components/EditUserModal';
import ResetPasswordModal from '../../components/ResetPasswordModal';
import { useDispatch } from 'react-redux';
import { showNotification } from '../../services/notificationSlice';
import { mapRoleToPersian } from '../../utils/mappers';

const UserManagementPage = () => {
    const dispatch = useDispatch();
    const { data: users, isLoading } = useGetUsersWithRolesQuery();
    const [updateUserRoles, { isLoading: isUpdatingRoles }] = useUpdateUserRolesMutation();
    const [createUser, { isLoading: isCreatingUser }] = useCreateUserMutation();
    const [toggleUserStatus, { isLoading: isTogglingStatus }] = useToggleUserStatusMutation();
    const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();
    const [resetUserPassword, { isLoading: isResettingPassword }] = useResetUserPasswordMutation();


    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const [isEditRolesModalOpen, setEditRolesModalOpen] = useState(false);
    const [isEditUserModalOpen, setEditUserModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setResetPasswordModalOpen] = useState(false);

    const handleOpenEditModal = (user: any) => {
        setSelectedUser(user);
        setEditModalOpen(true);
    };

    const handleToggleStatus = async () => {
        if (selectedUser) {
            try {
                await toggleUserStatus(selectedUser.id).unwrap();
                dispatch(showNotification({ message: 'وضعیت کاربر با موفقیت تغییر کرد.', severity: 'success' }));
                setConfirmOpen(false);
                setSelectedUser(null);
            } catch (error: any) {
                dispatch(showNotification({ message: error.data?.message || 'خطا در تغییر وضعیت', severity: 'error' }));
            }
        }
    };

    const handleUpdateRoles = async (newRoles: string[]) => {
        if (selectedUser) {
            try {
                await updateUserRoles({ userId: selectedUser.id, roles: newRoles }).unwrap();
                dispatch(showNotification({ message: 'نقش‌های کاربر با موفقیت به‌روز شد.', severity: 'success' }));
                setEditModalOpen(false);
            } catch (error: any) {
                dispatch(showNotification({ message: error.data?.message || 'خطا در به‌روزرسانی نقش‌ها', severity: 'error' }));
            }
        }
    };

    const handleCreateUser = async (userData: any) => {
        try {
            await createUser(userData).unwrap();
            dispatch(showNotification({ message: 'کاربر جدید با موفقیت ایجاد شد.', severity: 'success' }));
            setAddModalOpen(false);
        } catch (error: any) {
            const errorMessage = error.data?.[0]?.description || 'خطا در ایجاد کاربر';
            dispatch(showNotification({ message: errorMessage, severity: 'error' }));
        }
    };

    const handleUpdateUser = async (userData: any) => {
        if (selectedUser) {
            try {
                await updateUser({ userId: selectedUser.id, userData }).unwrap();
                dispatch(showNotification({ message: 'اطلاعات کاربر با موفقیت به‌روز شد.', severity: 'success' }));
                setEditUserModalOpen(false);
            } catch (error: any) {
                dispatch(showNotification({ message: error.data?.message || 'خطا در به‌روزرسانی اطلاعات کاربر', severity: 'error' }));
            }
        }
    };

    const handleResetPassword = async (newPassword: string, confirmPassword: string) => {
        if (selectedUser) {
            try {
                await resetUserPassword({ userId: selectedUser.id, newPassword, confirmPassword }).unwrap();
                dispatch(showNotification({ message: 'رمز عبور کاربر با موفقیت بازنشانی شد.', severity: 'success' }));
                setResetPasswordModalOpen(false);
                return { success: true };
            } catch (error: any) {
                // Extract detailed error messages from ASP.NET Identity validation
                let errorMessage = 'خطا در بازنشانی رمز عبور';

                if (error.data?.errors && Array.isArray(error.data.errors)) {
                    // Map Identity errors to Persian messages
                    errorMessage = error.data.errors.map((err: any) => {
                        if (err.description) return err.description;
                        if (err.code === 'PasswordTooShort') return 'رمز عبور باید حداقل 6 کاراکتر باشد.';
                        if (err.code === 'PasswordRequiresNonAlphanumeric') return 'رمز عبور باید شامل حداقل یک کاراکتر خاص باشد.';
                        if (err.code === 'PasswordRequiresDigit') return 'رمز عبور باید شامل حداقل یک عدد باشد.';
                        if (err.code === 'PasswordRequiresUpper') return 'رمز عبور باید شامل حداقل یک حرف بزرگ باشد.';
                        if (err.code === 'PasswordRequiresLower') return 'رمز عبور باید شامل حداقل یک حرف کوچک باشد.';
                        return err.code || 'خطای نامشخص';
                    }).join('\n');
                } else if (error.data?.message) {
                    errorMessage = error.data.message;
                }

                return { success: false, error: errorMessage };
            }
        }
        return { success: false, error: 'خطای نامشخص' };
    };

    const columns: GridColDef[] = [
        { field: 'username', headerName: 'نام کاربری', width: 200 },
        { field: 'email', headerName: 'ایمیل', width: 250 },
        { field: 'roles', headerName: 'نقش‌ها', width: 300, valueFormatter: (value: string[]) => value.map(mapRoleToPersian).join(', ') },
        {
            field: 'isActive',
            headerName: 'وضعیت',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Chip label={params.value ? "فعال" : "غیرفعال"} color={params.value ? "success" : "default"} size="small" variant="outlined" />
            ),
        },
        {
            field: 'actions',
            headerName: 'عملیات',
            width: 200,
            renderCell: (params: GridRenderCellParams) => (
                <>
                    <IconButton onClick={() => { setSelectedUser(params.row); setEditUserModalOpen(true); }} title="ویرایش اطلاعات"><PersonIcon /></IconButton>
                    <IconButton onClick={() => { setSelectedUser(params.row); setEditRolesModalOpen(true); }} title="ویرایش نقش‌ها"><EditIcon /></IconButton>
                    <IconButton onClick={() => { setSelectedUser(params.row); setResetPasswordModalOpen(true); }} color="warning" title="بازنشانی رمز عبور"><LockResetIcon /></IconButton>
                    <IconButton onClick={() => { setSelectedUser(params.row); setConfirmOpen(true); }} color={params.row.isActive ? "error" : "success"} title={params.row.isActive ? "غیرفعال کردن" : "فعال کردن"}>
                        {params.row.isActive ? <ToggleOffIcon /> : <ToggleOnIcon />}
                    </IconButton>
                </>
            ),
        },
    ];

    const isActionLoading = isUpdatingRoles || isCreatingUser || isTogglingStatus || isUpdatingUser || isResettingPassword;

    return (
        <>
            <Box sx={{ height: 600, width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" gutterBottom>مدیریت کاربران</Typography>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddModalOpen(true)}>افزودن کاربر</Button>
                </Box>
                <DataGrid
                    rows={users || []}
                    columns={columns}
                    getRowId={(row) => row.id}
                    loading={isLoading || isActionLoading}
                />
            </Box>

            {selectedUser && (
                <EditUserRolesModal open={isEditRolesModalOpen} onClose={() => setEditRolesModalOpen(false)} onSubmit={handleUpdateRoles} currentUserRoles={selectedUser.roles || []} />
            )}

            {selectedUser && (
                <EditUserModal open={isEditUserModalOpen} onClose={() => setEditUserModalOpen(false)} onSubmit={handleUpdateUser} user={selectedUser} />
            )}

            {selectedUser && (
                <ResetPasswordModal open={isResetPasswordModalOpen} onClose={() => setResetPasswordModalOpen(false)} onSubmit={handleResetPassword} userName={selectedUser.username} />
            )}

            <AddUserModal open={isAddModalOpen} onClose={() => setAddModalOpen(false)} onSubmit={handleCreateUser} />

            {selectedUser && (
                <ConfirmationDialog
                    open={isConfirmOpen}
                    onClose={() => setConfirmOpen(false)}
                    onConfirm={handleToggleStatus}
                    title={`تایید تغییر وضعیت کاربر`}
                    message={`آیا از ${selectedUser.isActive ? "غیرفعال" : "فعال"} کردن کاربر "${selectedUser.username}" مطمئن هستید؟`}
                />
            )}
        </>
    );
};

export default UserManagementPage;