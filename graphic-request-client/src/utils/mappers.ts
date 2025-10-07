export const mapStatusToPersian = (status: number) => {
  switch (status) {
    case 0: return 'ثبت شده';
    case 1: return 'در حال بررسی طراح';
    case 2: return 'منتظر اصلاح';
    case 3: return 'در حال انجام طراحی';
    case 4: return 'منتظر تایید';
    case 5: return 'منتظر طراحی مجدد';
    case 6: return 'انجام شده';
    default: return 'نامشخص';
  }
};

export const mapPriorityToPersian = (priority: number) => {
  return priority === 0 ? 'عادی' : 'فوری';
};

export const mapSettingKeyToPersian = (key: string) => {
  switch (key) {
    case 'DeadlineWarningDays': return 'زمان هشدار ددلاین (روز)';
    case 'MaxNormalRequestsPerDay': return 'ظرفیت روزانه درخواست عادی';
    case 'MaxUrgentRequestsPerDay': return 'ظرفیت روزانه درخواست فوری';
    case 'OrderableDaysInFuture': return 'بازه زمانی قابل سفارش (روز)';
    case 'DefaultDesignerId': return 'طراح پیش‌فرض برای تخصیص خودکار';
    default: return key;
  }
};