import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent } from '@mui/lab';
import { Paper, Typography } from '@mui/material';
import { mapStatusToPersian } from '../../utils/mappers';
import moment from 'moment-jalaali';

const RequestTimeline = ({ histories }: { histories: any[] }) => {
    if (!histories || histories.length === 0) {
        return null;
    }

    return (
        <Paper sx={{ p: 2, mt: 3 }}>
            <Typography variant="h5" gutterBottom>تاریخچه گردش کار</Typography>
            <Timeline position="alternate">
                {histories.map((history, index) => (
                    <TimelineItem key={index}>
                        <TimelineOppositeContent
                            sx={{ m: 'auto 0' }}
                            align="right"
                            variant="body2"
                            color="text.secondary"
                        >
                            {moment.utc(history.actionDate).local().locale('fa').format('jYYYY/jMM/jDD HH:mm')}
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                            <TimelineConnector />
                            <TimelineDot color={index === 0 ? 'primary' : 'grey'} />
                            <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent sx={{ py: '12px', px: 2 }}>
                            <Typography variant="h6" component="span">
                                {mapStatusToPersian(history.newStatus)}
                            </Typography>
                            <Typography variant="caption" display="block">توسط: {history.actorName}</Typography>
                            {history.comment && (
                                <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                                    <strong>یادداشت:</strong> {history.comment}
                                </Typography>
                            )}
                        </TimelineContent>
                    </TimelineItem>
                ))}
            </Timeline>
        </Paper>
    );
};

export default RequestTimeline;