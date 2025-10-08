// import { PickersDay } from '@mui/x-date-pickers';
// import type { PickersDayProps } from '@mui/x-date-pickers';
// import { Badge } from '@mui/material';
// import moment from 'moment-jalaali';
// import type { Moment } from 'moment-jalaali';

// interface CustomDayProps extends PickersDayProps {
//     availability?: { isNormalSlotAvailable: boolean; isUrgentSlotAvailable: boolean };
// }


// export const CustomDay = (props: CustomDayProps) => {
//     const { day, outsideCurrentMonth, availability, ...other } = props;

//     const isFull = !availability?.isNormalSlotAvailable && !availability?.isUrgentSlotAvailable;

//     return (
//         <Badge
//             key={props.day.toString()}
//             overlap="circular"
//             badgeContent={isFull && !outsideCurrentMonth ? 'تکمیل' : undefined}
//             color="error"
//         >
//             <PickersDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
//         </Badge>
//     );
// };