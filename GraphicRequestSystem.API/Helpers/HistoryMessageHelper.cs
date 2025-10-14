using GraphicRequestSystem.API.Core.Enums;

namespace GraphicRequestSystem.API.Helpers
{
    public class HistoryMessageHelper
    {
        public static string GetSystemMessageForStatusChange(RequestStatus newStatus)
        {
            return newStatus switch
            {
                RequestStatus.Submitted => "درخواست جدید ثبت شد.",
                RequestStatus.DesignerReview => "درخواست برای بررسی به کارتابل طراح ارسال شد.",
                RequestStatus.PendingCorrection => "درخواست جهت اصلاح به درخواست‌دهنده بازگردانده شد.",
                RequestStatus.DesignInProgress => "طراحی درخواست آغاز شد و در حال انجام است.",
                RequestStatus.PendingApproval => "طراحی اولیه انجام و درخواست برای اخذ تاییدیه ارسال شد.",
                RequestStatus.PendingRedesign => "درخواست توسط تاییدکننده برای طراحی مجدد بازگردانده شد.",
                RequestStatus.Completed => "فرآیند درخواست با موفقیت به اتمام رسید و مختومه شد.",
                _ => "وضعیت درخواست تغییر کرد."
            };
        }
    }
}
