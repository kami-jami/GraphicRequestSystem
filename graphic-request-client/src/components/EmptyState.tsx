import { Box, Typography, Button, Paper } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
    };
}

const EmptyState = ({
    icon = <InboxIcon sx={{ fontSize: 80, opacity: 0.3 }} />,
    title,
    description,
    action
}: EmptyStateProps) => {
    return (
        <Paper
            elevation={0}
            sx={{
                py: 8,
                px: 4,
                textAlign: 'center',
                backgroundColor: 'background.default',
                borderRadius: 3,
                border: '2px dashed',
                borderColor: 'divider',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                {/* Icon */}
                <Box sx={{ color: 'text.secondary', opacity: 0.5 }}>
                    {icon}
                </Box>

                {/* Title */}
                <Typography variant="h6" fontWeight={600} color="text.secondary">
                    {title}
                </Typography>

                {/* Description */}
                {description && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ maxWidth: 400 }}
                    >
                        {description}
                    </Typography>
                )}

                {/* Action Button */}
                {action && (
                    <Button
                        variant="contained"
                        startIcon={action.icon}
                        onClick={action.onClick}
                        sx={{ mt: 2 }}
                    >
                        {action.label}
                    </Button>
                )}
            </Box>
        </Paper>
    );
};

export default EmptyState;
