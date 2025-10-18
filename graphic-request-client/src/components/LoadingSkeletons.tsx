import { Box, Skeleton, Paper, Stack } from '@mui/material';
import Grid from '@mui/material/Grid';

export const CardSkeleton = () => (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton variant="circular" width={48} height={48} />
                <Skeleton variant="rectangular" width={60} height={32} sx={{ borderRadius: 2 }} />
            </Box>
            <Skeleton variant="text" width="60%" height={32} />
            <Skeleton variant="text" width="90%" height={20} />
        </Stack>
    </Paper>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
            {/* Header */}
            <Box sx={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4].map((item) => (
                    <Skeleton key={item} variant="text" width="25%" height={40} />
                ))}
            </Box>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
                        <Skeleton variant="text" width="25%" />
                        <Skeleton variant="text" width="30%" />
                        <Skeleton variant="text" width="20%" />
                        <Skeleton variant="rectangular" width="15%" height={24} sx={{ borderRadius: 1 }} />
                    </Box>
                </Box>
            ))}
        </Stack>
    </Paper>
);

export const StatsSkeleton = () => (
    <Grid container spacing={3}>
        {[1, 2, 3, 4].map((item) => (
            <Grid key={item} size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper sx={{ p: 3, borderRadius: 3 }}>
                    <Stack spacing={2} direction="row" alignItems="center">
                        <Skeleton variant="circular" width={56} height={56} />
                        <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="60%" height={32} />
                            <Skeleton variant="text" width="80%" height={20} />
                        </Box>
                    </Stack>
                </Paper>
            </Grid>
        ))}
    </Grid>
);

export const DetailSkeleton = () => (
    <Stack spacing={3}>
        {/* Header */}
        <Box>
            <Skeleton variant="text" width="40%" height={40} />
            <Skeleton variant="text" width="60%" height={24} />
        </Box>

        {/* Content Sections */}
        {[1, 2, 3].map((section) => (
            <Paper key={section} sx={{ p: 3, borderRadius: 3 }}>
                <Skeleton variant="text" width="30%" height={28} sx={{ mb: 2 }} />
                <Stack spacing={1.5}>
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="text" width="90%" />
                    <Skeleton variant="text" width="95%" />
                    <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 2, mt: 2 }} />
                </Stack>
            </Paper>
        ))}
    </Stack>
);

export const FormSkeleton = () => (
    <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Stack spacing={3}>
            <Skeleton variant="text" width="40%" height={36} />
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 2 }} />
            </Box>
        </Stack>
    </Paper>
);
