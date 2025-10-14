import { useSelector } from 'react-redux';
import { selectCurrentUser } from './auth/authSlice';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { useAssignRequestMutation, useReturnRequestMutation, useCompleteDesignMutation, useProcessApprovalMutation, useResubmitRequestMutation, useStartDesignMutation } from '../services/apiSlice';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReturnRequestModal from '../components/ReturnRequestModal';
import SendForApprovalModal from '../components/SendForApprovalModal';
import ConfirmationDialog from '../components/ConfirmationDialog';

const RequestActions = ({ request }: { request: any }) => {
    const user = useSelector(selectCurrentUser);
    const navigate = useNavigate();
    const [isReturnModalOpen, setReturnModalOpen] = useState(false);
    const [isRejectModalOpen, setRejectModalOpen] = useState(false);
    const [isApprovalModalOpen, setApprovalModalOpen] = useState(false);
    const [isCompleteConfirmOpen, setCompleteConfirmOpen] = useState(false);
    const [approvalModalData, setApprovalModalData] = useState({ initialComment: '', initialFiles: [] });


    const [assignRequest, { isLoading: isAssigning }] = useAssignRequestMutation();
    const [returnRequest, { isLoading: isReturning }] = useReturnRequestMutation();
    const [completeDesign, { isLoading: isCompleting }] = useCompleteDesignMutation();
    const [processApproval, { isLoading: isProcessing }] = useProcessApprovalMutation();
    const [resubmitRequest, { isLoading: isResubmitting }] = useResubmitRequestMutation();
    const [startDesign, { isLoading: isStartingDesign }] = useStartDesignMutation();



    const handleAssign = async () => {
        if (user?.id) {
            try {
                await assignRequest({ requestId: request.id, designerId: user.id }).unwrap();
            } catch (error) { console.error("Failed to assign request", error); }
        }
    };

    const handleReturn = async (comment: string, files: FileList | null) => {
        if (user?.id) {
            const formData = new FormData();
            formData.append('requestId', request.id);
            formData.append('actorId', user.id);
            formData.append('comment', comment);
            if (files) {
                for (let i = 0; i < files.length; i++) { formData.append('files', files[i]); }
            }
            try {
                await returnRequest(formData).unwrap();
                setReturnModalOpen(false);
            } catch (error) { console.error("Failed to return request", error); }
        }
    };

    const handleSendForApproval = async (comment: string, files: FileList | null, approverId: string) => {
        if (user?.id) {
            const formData = new FormData();
            formData.append('requestId', request.id);
            formData.append('actorId', user.id);
            formData.append('needsApproval', 'true');
            formData.append('approverId', approverId);
            if (comment) formData.append('comment', comment);
            if (files) {
                for (let i = 0; i < files.length; i++) { formData.append('files', files[i]); }
            }
            try {
                await completeDesign(formData).unwrap();
                setApprovalModalOpen(false);
            } catch (error) { console.error("Failed to send for approval", error); }
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
            } catch (error) { console.error("Failed to complete request directly", error); }
        }
    };

    const handleApprove = async () => {
        if (user?.id) {
            const formData = new FormData();
            formData.append('requestId', request.id);
            formData.append('actorId', user.id);
            formData.append('isApproved', 'true');
            formData.append('comment', 'تایید شد.');
            try {
                await processApproval(formData).unwrap();
            } catch (error) { console.error("Failed to approve", error); }
        }
    };

    const handleReject = async (comment: string, files: FileList | null) => {
        if (user?.id) {
            const formData = new FormData();
            formData.append('requestId', request.id);
            formData.append('actorId', user.id);
            formData.append('isApproved', 'false');
            formData.append('comment', comment);
            if (files) {
                for (let i = 0; i < files.length; i++) { formData.append('files', files[i]); }
            }
            try {
                await processApproval(formData).unwrap();
                setRejectModalOpen(false);
            } catch (error) { console.error("Failed to reject", error); }
        }
    };

    const handleResubmit = async () => {
        try {
            await resubmitRequest({ requestId: request.id }).unwrap();
        } catch (error) { console.error("Failed to resubmit", error); }
    };

    const openApprovalModal = () => {
        // پیدا کردن آخرین رویداد "ارسال برای تایید"
        const lastSubmission = request.histories
            ?.filter((h: any) => h.newStatus === 4)
            .sort((a: any, b: any) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime())[0];

        // تنظیم داده‌های اولیه برای مودال
        setApprovalModalData({
            initialComment: lastSubmission?.comment || '',
            initialFiles: lastSubmission?.attachments || []
        });
        setApprovalModalOpen(true);
    };

    const handleStartDesign = async () => {
        try {
            await startDesign({ requestId: request.id }).unwrap();
        } catch (error) {
            console.error("Failed to start design", error);
        }
    };

    if (request.status === 6) return null;
    if (!user || !user.roles) return null;


    return (
        <>
            <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>عملیات</Typography>

                {/* دکمه شروع طراحی */}
                {request.status === 1 && user.id === request.designerId && (
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button variant="contained" color="primary" onClick={handleStartDesign} disabled={isStartingDesign}>
                            {isStartingDesign ? <CircularProgress size={24} /> : 'شروع طراحی'}
                        </Button>
                        <Button variant="outlined" color="warning" onClick={() => setReturnModalOpen(true)}>
                            بازگشت جهت اصلاح
                        </Button>
                    </Box>
                )}

                {/* دکمه‌های طراح (برای وضعیت‌های "در حال انجام" و "منتظر طراحی مجدد") */}
                {(request.status === 3 || request.status === 5) && user.id === request.designerId && (
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Button variant="contained" color="secondary" onClick={openApprovalModal} disabled={isCompleting}>
                            ارسال برای تایید
                        </Button>
                        <Button variant="contained" color="success" onClick={() => setCompleteConfirmOpen(true)} disabled={isCompleting}>
                            اتمام کار (بدون تایید)
                        </Button>
                        <Button variant="outlined" color="warning" onClick={() => setReturnModalOpen(true)}>
                            بازگشت جهت اصلاح
                        </Button>
                    </Box>
                )}

                {/* دکمه‌های تایید کننده */}
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

                {/* دکمه‌های درخواست‌دهنده */}
                {request.status === 2 && user.id === request.requesterId && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button variant="contained" color="primary" onClick={() => navigate(`/requests/${request.id}/edit`)}>
                            ویرایش درخواست
                        </Button>
                        <Button variant="contained" onClick={handleResubmit} disabled={isResubmitting}>
                            ارسال مجدد
                        </Button>
                    </Box>
                )}
            </Box>

            <SendForApprovalModal open={isApprovalModalOpen} onClose={() => setApprovalModalOpen(false)} onSubmit={handleSendForApproval} initialComment={approvalModalData.initialComment}
                initialFiles={approvalModalData.initialFiles} />
            <ReturnRequestModal open={isReturnModalOpen} onClose={() => setReturnModalOpen(false)} onSubmit={handleReturn} />
            <ReturnRequestModal open={isRejectModalOpen} onClose={() => setRejectModalOpen(false)} onSubmit={handleReject} />
            <ConfirmationDialog open={isCompleteConfirmOpen} onClose={() => setCompleteConfirmOpen(false)} onConfirm={confirmCompleteDirectly} title="تایید اتمام کار" message="آیا از اتمام کار و مختومه کردن این درخواست مطمئن هستید؟" />
        </>
    );
};

export default RequestActions;