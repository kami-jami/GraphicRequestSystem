import { Box, Typography, Paper, useTheme, alpha } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color?: string;
    subtitle?: string;
    trend?: {
        value: number;
        direction: 'up' | 'down';
    };
    variant?: 'default' | 'gradient' | 'outlined';
}

const StatCard = ({
    title,
    value,
    icon,
    color,
    subtitle,
    trend,
    variant = 'default'
}: StatCardProps) => {
    const theme = useTheme();
    const mainColor = color || theme.palette.primary.main;

    const getVariantStyles = () => {
        switch (variant) {
            case 'gradient':
                return {
                    background: `linear-gradient(135deg, ${mainColor} 0%, ${alpha(mainColor, 0.7)} 100%)`,
                    color: 'white',
                };
            case 'outlined':
                return {
                    border: `2px solid ${mainColor}`,
                    backgroundColor: 'transparent',
                };
            default:
                return {
                    backgroundColor: alpha(mainColor, 0.1),
                    border: `1px solid ${alpha(mainColor, 0.2)}`,
                };
        }
    };

    return (
        <Paper
            elevation={variant === 'gradient' ? 4 : 1}
            sx={{
                p: 3,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2.5,
                transition: 'all 0.3s ease',
                ...getVariantStyles(),
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 24px ${alpha(mainColor, 0.2)}`,
                },
            }}
        >
            {/* Icon Section */}
            <Box
                sx={{
                    backgroundColor: variant === 'gradient' ? 'rgba(255,255,255,0.2)' : mainColor,
                    borderRadius: 2.5,
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: variant === 'gradient' ? 'white' : 'white',
                    boxShadow: variant === 'gradient' ? 'none' : `0 4px 12px ${alpha(mainColor, 0.3)}`,
                }}
            >
                {icon}
            </Box>

            {/* Content Section */}
            <Box sx={{ flex: 1 }}>
                <Typography
                    variant="h3"
                    sx={{
                        fontWeight: 700,
                        mb: 0.5,
                        color: variant === 'gradient' ? 'white' : mainColor,
                    }}
                >
                    {value}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 500,
                        color: variant === 'gradient' ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                    }}
                >
                    {title}
                </Typography>
                {subtitle && (
                    <Typography
                        variant="caption"
                        sx={{
                            display: 'block',
                            mt: 0.5,
                            color: variant === 'gradient' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                        }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>

            {/* Trend Indicator */}
            {trend && (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1.5,
                        backgroundColor:
                            trend.direction === 'up'
                                ? alpha(theme.palette.success.main, 0.15)
                                : alpha(theme.palette.error.main, 0.15),
                    }}
                >
                    {trend.direction === 'up' ? (
                        <TrendingUpIcon
                            fontSize="small"
                            sx={{ color: theme.palette.success.main }}
                        />
                    ) : (
                        <TrendingDownIcon
                            fontSize="small"
                            sx={{ color: theme.palette.error.main }}
                        />
                    )}
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 600,
                            color:
                                trend.direction === 'up'
                                    ? theme.palette.success.main
                                    : theme.palette.error.main,
                        }}
                    >
                        {Math.abs(trend.value)}%
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

export default StatCard;
