import { Box, Typography, Breadcrumbs, Link, Stack, Button } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { Link as RouterLink } from 'react-router-dom';

interface Breadcrumb {
    label: string;
    path?: string;
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    breadcrumbs?: Breadcrumb[];
    action?: {
        label: string;
        icon?: React.ReactNode;
        onClick: () => void;
        variant?: 'contained' | 'outlined' | 'text';
    };
    children?: React.ReactNode;
}

const PageHeader = ({
    title,
    subtitle,
    breadcrumbs,
    action,
    children
}: PageHeaderProps) => {
    return (
        <Box sx={{ mb: 4 }}>
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumbs
                    separator={<NavigateNextIcon fontSize="small" />}
                    sx={{ mb: 2 }}
                >
                    {breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1;

                        if (isLast || !crumb.path) {
                            return (
                                <Typography
                                    key={index}
                                    color="text.secondary"
                                    fontSize="0.875rem"
                                >
                                    {crumb.label}
                                </Typography>
                            );
                        }

                        return (
                            <Link
                                key={index}
                                component={RouterLink}
                                to={crumb.path}
                                underline="hover"
                                color="inherit"
                                fontSize="0.875rem"
                            >
                                {crumb.label}
                            </Link>
                        );
                    })}
                </Breadcrumbs>
            )}

            {/* Title and Action */}
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
            >
                <Box>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            mb: subtitle ? 0.5 : 0,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        {title}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>

                {action && (
                    <Button
                        variant={action.variant || 'contained'}
                        startIcon={action.icon}
                        onClick={action.onClick}
                        sx={{
                            minWidth: 150,
                            fontWeight: 600,
                        }}
                    >
                        {action.label}
                    </Button>
                )}
            </Stack>

            {/* Additional Content */}
            {children && (
                <Box sx={{ mt: 3 }}>
                    {children}
                </Box>
            )}
        </Box>
    );
};

export default PageHeader;
