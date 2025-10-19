import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    IconButton,
    Stack,
    Alert,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    alpha,
    useTheme,
    Tooltip
} from '@mui/material';
import {
    useGetDesignerNotesForRequestQuery,
    useCreateDesignerNoteMutation,
    useUpdateDesignerNoteMutation,
    useDeleteDesignerNoteMutation
} from '../../services/apiSlice';
import moment from 'moment-jalaali';

// Icons
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import LockIcon from '@mui/icons-material/Lock';
import NotesIcon from '@mui/icons-material/Notes';

interface DesignerNote {
    id: number;
    requestId: number;
    designerId: string;
    designerName: string;
    noteText: string;
    createdAt: string;
    updatedAt?: string;
}

interface DesignerNotesProps {
    requestId: number;
}

const DesignerNotes = ({ requestId }: DesignerNotesProps) => {
    const theme = useTheme();
    const [newNoteText, setNewNoteText] = useState('');
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [editingNoteText, setEditingNoteText] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<number | null>(null);

    const { data: notes = [], isLoading, error, refetch } = useGetDesignerNotesForRequestQuery(requestId);
    const [createNote, { isLoading: isCreating }] = useCreateDesignerNoteMutation();
    const [updateNote, { isLoading: isUpdating }] = useUpdateDesignerNoteMutation();
    const [deleteNote, { isLoading: isDeleting }] = useDeleteDesignerNoteMutation();

    const handleCreateNote = async () => {
        if (!newNoteText.trim()) return;

        try {
            await createNote({ requestId, noteText: newNoteText.trim() }).unwrap();
            setNewNoteText('');
            refetch();
        } catch (err) {
            console.error('Failed to create note:', err);
        }
    };

    const handleStartEdit = (note: DesignerNote) => {
        setEditingNoteId(note.id);
        setEditingNoteText(note.noteText);
    };

    const handleCancelEdit = () => {
        setEditingNoteId(null);
        setEditingNoteText('');
    };

    const handleSaveEdit = async (noteId: number) => {
        if (!editingNoteText.trim()) return;

        try {
            await updateNote({ noteId, noteText: editingNoteText.trim() }).unwrap();
            setEditingNoteId(null);
            setEditingNoteText('');
            refetch();
        } catch (err) {
            console.error('Failed to update note:', err);
        }
    };

    const handleDeleteClick = (noteId: number) => {
        setNoteToDelete(noteId);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (noteToDelete === null) return;

        try {
            await deleteNote(noteToDelete).unwrap();
            setDeleteDialogOpen(false);
            setNoteToDelete(null);
            refetch();
        } catch (err) {
            console.error('Failed to delete note:', err);
        }
    };

    if (error) {
        // If we get a 403/401, it means the user is not a designer or not assigned to this request
        return null; // Silently hide the component
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: 3,
                background: alpha(theme.palette.warning.main, 0.02),
            }}
        >
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.2)} 0%, ${alpha(theme.palette.warning.main, 0.1)} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <NotesIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                        یادداشت‌های شخصی طراح
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                        <LockIcon sx={{ fontSize: 14, color: theme.palette.warning.main }} />
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            فقط شما می‌توانید این یادداشت‌ها را مشاهده کنید
                        </Typography>
                    </Stack>
                </Box>
            </Stack>

            {/* Info Alert */}
            <Alert
                severity="info"
                icon={<LockIcon />}
                sx={{
                    mb: 3,
                    backgroundColor: alpha(theme.palette.info.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                    '& .MuiAlert-icon': {
                        color: theme.palette.info.main
                    }
                }}
            >
                <Typography variant="body2">
                    این یادداشت‌ها <strong>کاملاً محرمانه</strong> هستند و تنها توسط شما قابل مشاهده می‌باشند.
                    سایر نقش‌ها (درخواست‌کننده، تأییدکننده، مدیر) دسترسی به این یادداشت‌ها ندارند.
                </Typography>
            </Alert>

            {/* Create New Note */}
            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="یادداشت جدید اضافه کنید..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    disabled={isCreating}
                    sx={{
                        mb: 1.5,
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: 'background.paper',
                            borderRadius: 2
                        }
                    }}
                />
                <Button
                    variant="contained"
                    startIcon={<NoteAddIcon />}
                    onClick={handleCreateNote}
                    disabled={!newNoteText.trim() || isCreating}
                    sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600
                    }}
                >
                    {isCreating ? 'در حال ذخیره...' : 'افزودن یادداشت'}
                </Button>
            </Box>

            {/* Notes List */}
            {isLoading ? (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 2 }}>
                    در حال بارگذاری...
                </Typography>
            ) : notes.length === 0 ? (
                <Box
                    sx={{
                        textAlign: 'center',
                        py: 4,
                        backgroundColor: alpha(theme.palette.grey[500], 0.02),
                        borderRadius: 2,
                        border: `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`
                    }}
                >
                    <NotesIcon sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        هنوز یادداشتی ثبت نشده است
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={2}>
                    {notes.map((note: DesignerNote) => (
                        <Paper
                            key={note.id}
                            elevation={0}
                            sx={{
                                p: 2,
                                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                borderRadius: 2,
                                backgroundColor: 'background.paper',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
                                    borderColor: alpha(theme.palette.primary.main, 0.3)
                                }
                            }}
                        >
                            {editingNoteId === note.id ? (
                                // Edit Mode
                                <Box>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        value={editingNoteText}
                                        onChange={(e) => setEditingNoteText(e.target.value)}
                                        disabled={isUpdating}
                                        sx={{ mb: 1.5 }}
                                    />
                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            startIcon={<SaveIcon />}
                                            onClick={() => handleSaveEdit(note.id)}
                                            disabled={!editingNoteText.trim() || isUpdating}
                                            sx={{ borderRadius: 1.5, textTransform: 'none' }}
                                        >
                                            ذخیره
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            startIcon={<CancelIcon />}
                                            onClick={handleCancelEdit}
                                            disabled={isUpdating}
                                            sx={{ borderRadius: 1.5, textTransform: 'none' }}
                                        >
                                            انصراف
                                        </Button>
                                    </Stack>
                                </Box>
                            ) : (
                                // View Mode
                                <Box>
                                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Chip
                                                label={moment.utc(note.createdAt).local().format('jYYYY/jMM/jDD HH:mm')}
                                                size="small"
                                                sx={{
                                                    height: 24,
                                                    fontSize: '0.75rem',
                                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                    color: theme.palette.primary.main,
                                                    fontWeight: 500
                                                }}
                                            />
                                            {note.updatedAt && (
                                                <Tooltip title={`آخرین ویرایش: ${moment.utc(note.updatedAt).local().format('jYYYY/jMM/jDD HH:mm')}`}>
                                                    <Chip
                                                        label="ویرایش شده"
                                                        size="small"
                                                        sx={{
                                                            height: 24,
                                                            fontSize: '0.7rem',
                                                            backgroundColor: alpha(theme.palette.warning.main, 0.1),
                                                            color: theme.palette.warning.main
                                                        }}
                                                    />
                                                </Tooltip>
                                            )}
                                        </Stack>
                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleStartEdit(note)}
                                                sx={{
                                                    color: theme.palette.primary.main,
                                                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) }
                                                }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDeleteClick(note.id)}
                                                sx={{
                                                    color: theme.palette.error.main,
                                                    '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) }
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </Stack>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            whiteSpace: 'pre-wrap',
                                            lineHeight: 1.7,
                                            color: theme.palette.text.primary
                                        }}
                                    >
                                        {note.noteText}
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    ))}
                </Stack>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => !isDeleting && setDeleteDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>حذف یادداشت</DialogTitle>
                <DialogContent>
                    <Typography>
                        آیا از حذف این یادداشت اطمینان دارید؟ این عمل قابل بازگشت نیست.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={isDeleting}
                        sx={{ textTransform: 'none' }}
                    >
                        انصراف
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                        disabled={isDeleting}
                        sx={{ textTransform: 'none' }}
                    >
                        {isDeleting ? 'در حال حذف...' : 'حذف'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
};

export default DesignerNotes;
