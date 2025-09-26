namespace GraphicRequestSystem.API.Core.Enums
{
    public enum RequestStatus
    {
        Submitted,            // ثبت شده
        DesignerReview,       // در حال بررسی طراح
        PendingCorrection,    // منتظر اصلاح/تکمیل
        DesignInProgress,     // در حال انجام طراحی
        PendingApproval,      // منتظر تایید
        PendingRedesign,      // منتظر اصلاح/طراحی مجدد
        Completed             // انجام شده
    }
}
