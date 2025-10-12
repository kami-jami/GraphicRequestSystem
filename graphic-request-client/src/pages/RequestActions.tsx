import { useSelector } from 'react-redux';
import { selectCurrentUser } from './auth/authSlice';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { useAssignRequestMutation, useReturnRequestMutation, useCompleteDesignMutation, useProcessApprovalMutation, useResubmitRequestMutation, useResubmitForApprovalMutation } from '../services/apiSlice';
import { useState } from 'react';
import ReturnRequestModal from '../components/ReturnRequestModal';
import SendForApprovalModal from '../components/SendForApprovalModal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useNavigate } from 'react-router-dom';

const RequestActions = ({ request }: { request: any }) => {
    const navigate = useNavigate();
    const user = useSelector(selectCurrentUser);
    const [isReturnModalOpen, setReturnModalOpen] = useState(false);
    const [isRejectModalOpen, setRejectModalOpen] = useState(false);
    const [isApprovalModalOpen, setApprovalModalOpen] = useState(false);
    const [isCompleteConfirmOpen, setCompleteConfirmOpen] = useState(false);

    // هوک‌های Mutation
    const [assignRequest, { isLoading: isAssigning }] = useAssignRequestMutation();
    const [returnRequest, { isLoading: isReturning }] = useReturnRequestMutation();
    const [completeDesign, { isLoading: isCompleting }] = useCompleteDesignMutation();
    const [processApproval, { isLoading: isProcessing }] = useProcessApprovalMutation();
    const [resubmitRequest, { isLoading: isResubmitting }] = useResubmitRequestMutation();
    const [resubmitForApproval, { isLoading: isResubmittingForApproval }] = useResubmitForApprovalMutation();



    const handleAssign = async () => {
        console.log("دکمه تخصیص کلیک شد. اطلاعات کاربر فعلی:", user);

        if (user?.id) {
            console.log(`در حال تلاش برای تخصیص درخواست شماره ${request.id} به کاربر با شناسه ${user.id}`);
            try {
                await assignRequest({ requestId: request.id, designerId: user.id }).unwrap();
                console.log("تخصیص با موفقیت در سرور ثبت شد.");
            } catch (error) {
                console.error("خطا در هنگام ارسال درخواست تخصیص:", error);
            }
        } else {
            console.error("خطا: دکمه تخصیص کلیک شد، اما شناسه کاربر (user.id) در دسترس نیست.");
        }
    };

    const handleReturn = async (comment: string) => {
        if (user?.id) {
            try {
                await returnRequest({ requestId: request.id, actorId: user.id, comment }).unwrap();
                setReturnModalOpen(false); // بستن مودال پس از موفقیت
            } catch (error) { console.error("Failed to return request", error); }
        }
    };

    const handleApprove = async () => {
        if (user?.id) {
            try {
                await processApproval({ requestId: request.id, actorId: user.id, isApproved: true, comment: "تایید شد" }).unwrap();
            } catch (error) { console.error("Failed to approve", error); }
        }
    };

    const handleReject = async (comment: string) => {
        if (user?.id) {
            try {
                await processApproval({ requestId: request.id, actorId: user.id, isApproved: false, comment }).unwrap();
                setRejectModalOpen(false); // بستن مودال پس از موفقیت
            } catch (error) { console.error("Failed to reject", error); }
        }
    };

    const handleResubmit = async () => {
        try {
            await resubmitRequest({ requestId: request.id }).unwrap();
        } catch (error) { console.error("Failed to resubmit", error); }
    };

    const handleResubmitForApproval = async () => {
        try {
            await resubmitForApproval({ requestId: request.id }).unwrap();
        } catch (error) { console.error("Failed to resubmit for approval", error); }
    };

    const handleSendForApproval = async (comment: string, files: FileList | null, approverId: string) => {
        if (user?.id) {
            const formData = new FormData();
            formData.append('requestId', request.id);
            formData.append('actorId', user.id);
            formData.append('needsApproval', 'true');
            formData.append('approverId', approverId); // استفاده از approverId داینامیک
            if (comment) formData.append('comment', comment);

            if (files) {
                for (let i = 0; i < files.length; i++) {
                    formData.append('files', files[i]);
                }
            }

            try {
                await completeDesign(formData).unwrap();
                setApprovalModalOpen(false);
            } catch (error) {
                console.error("Failed to send for approval", error);
            }
        }
    };

    const handleCompleteDirectly = async () => {
        if (user?.id) {
            if (window.confirm("آیا از اتمام کار و مختومه کردن این درخواست مطمئن هستید؟")) {
                const formData = new FormData();
                formData.append('requestId', request.id);
                formData.append('actorId', user.id);
                formData.append('needsApproval', 'false');
                formData.append('comment', 'کار توسط طراح به اتمام رسید.');

                try {
                    await completeDesign(formData).unwrap();
                } catch (error) {
                    console.error("Failed to complete request directly", error);
                }
            }
        }
    };

    const confirmCompleteDirectly = async () => {
        if (user?.id) {
            const formData = new FormData();
            formData.append('requestId', request.id);
            formData.append('actorId', user.id);
            formData.append('needsApproval', 'false');
            formData.append('comment', 'کار توسط طراح به اتمام رسید.');

            try {
                await completeDesign(formData).unwrap();
                setCompleteConfirmOpen(false);
            } catch (error) {
                console.error("Failed to complete request directly", error);
            }
        }
    };

    if (request.status === 6) return null;
    if (!user || !user.roles) return null;

    if (!user || !user.roles) return null;

    return (
        <>
            <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>عملیات</Typography>

                {/* {request.status === 0 && user.roles.includes('Designer') && (
                    <Button variant="contained" onClick={handleAssign} disabled={isAssigning}>
                        {isAssigning ? <CircularProgress size={24} /> : 'این درخواست را به من تخصیص بده'}
                    </Button>
                )} */}

                {(request.status === 3 || request.status === 5) && user.id === request.designerId && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="contained" color="secondary" onClick={() => setApprovalModalOpen(true)} disabled={isCompleting}>
                            {isCompleting ? <CircularProgress size={24} /> : 'ارسال برای تایید'}
                        </Button>
                        <Button variant="contained" color="success" onClick={() => setCompleteConfirmOpen(true)} disabled={isCompleting}>
                            اتمام کار (بدون تایید)
                        </Button>
                        <Button variant="outlined" color="warning" onClick={() => setReturnModalOpen(true)}>
                            بازگشت جهت اصلاح
                        </Button>
                    </Box>
                )}

                {request.status === 4 && user.id === request.approverId && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="contained" color="success" onClick={handleApprove} disabled={isProcessing}>
                            {isProcessing ? <CircularProgress size={24} /> : 'تایید نهایی'}
                        </Button>
                        <Button variant="outlined" color="error" onClick={() => setRejectModalOpen(true)} disabled={isProcessing}>
                            نیاز به طراحی مجدد
                        </Button>
                    </Box>
                )}

                {request.status === 2 && user?.id === request.requesterId && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="contained" color="primary" onClick={() => navigate(`/requests/${request.id}/edit`)}>
                            ویرایش درخواست
                        </Button>
                        <Button variant="contained" onClick={handleResubmit} disabled={isResubmitting}>
                            {isResubmitting ? <CircularProgress size={24} /> : 'ثبت اصلاحات و ارسال مجدد'}
                        </Button>
                    </Box>
                )}

                {request.status === 5 && user.id === request.designerId && (
                    <Button variant="contained" color="secondary" onClick={handleResubmitForApproval} disabled={isResubmittingForApproval}>
                        {isResubmittingForApproval ? <CircularProgress size={24} /> : 'ارسال مجدد برای تایید'}
                    </Button>
                )}

                {/* TODO: تکمیل منطق onClick برای سایر دکمه‌ها با استفاده از mutation های مربوطه */}
            </Box>

            <ConfirmationDialog
                open={isCompleteConfirmOpen}
                onClose={() => setCompleteConfirmOpen(false)}
                onConfirm={confirmCompleteDirectly}
                title="تایید اتمام کار"
                message="آیا از اتمام کار و مختومه کردن این درخواست مطمئن هستید؟ این عمل غیرقابل بازگشت است."
            />

            <SendForApprovalModal
                open={isApprovalModalOpen}
                onClose={() => setApprovalModalOpen(false)}
                onSubmit={handleSendForApproval}
            />

            <ReturnRequestModal
                open={isReturnModalOpen}
                onClose={() => setReturnModalOpen(false)}
                onSubmit={handleReturn}
            />
            <ReturnRequestModal
                open={isRejectModalOpen}
                onClose={() => setRejectModalOpen(false)}
                onSubmit={handleReject}
            />
        </>
    );
};

export default RequestActions;