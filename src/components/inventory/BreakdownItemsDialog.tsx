import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid2,
    Box,
    Typography,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Paper,
    IconButton,
    Alert,
    Chip,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    InputAdornment,
} from '@mui/material';
import {
    Add,
    DeleteOutline,
    Scale,
    Inventory,
} from '@mui/icons-material';
import { useCreateBreakdownItems, useNextSku } from '@hooks/useItems';
import { Item } from '@custTypes/models';
import { formatCurrency, formatMeasurement } from '@utils/formatters';

interface BreakdownItemsDialogProps {
    open: boolean;
    onClose: () => void;
    sourceItem: Item | null;
    onItemsCreated?: (items: Item[]) => void;
}

interface DerivedItemForm {
    name: string;
    sku: string;
    quantity: number;
    weight?: number;
    description?: string;
    category?: string;
    price?: number;
    cost?: number;
    tags?: string[];
}

export default function BreakdownItemsDialog({
    open,
    onClose,
    sourceItem,
    onItemsCreated
}: BreakdownItemsDialogProps) {
    // Hooks
    const { data: nextSku } = useNextSku();
    const createBreakdownItems = useCreateBreakdownItems();

    // State
    const [derivedItems, setDerivedItems] = useState<DerivedItemForm[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [remainingQuantity, setRemainingQuantity] = useState<number>(0);
    const [remainingWeight, setRemainingWeight] = useState<number>(0);

    // Reset form on dialog open/source item change
    useEffect(() => {
        if (open && sourceItem) {
            setDerivedItems([]);
            setError(null);
            setRemainingQuantity(sourceItem.quantity);
            setRemainingWeight(sourceItem.weight);
        }
    }, [open, sourceItem]);

    // Generate a unique SKU
    const generateSku = useCallback((baseIndex: number) => {
        if (!sourceItem) return '';

        // If we have nextSku from the API, use it with a suffix
        if (nextSku) {
            return `${nextSku}-${String(baseIndex + 1).padStart(2, '0')}`;
        }

        // Fallback: use sourceItem SKU with suffix
        return `${sourceItem.sku}-${String(baseIndex + 1).padStart(2, '0')}`;
    }, [sourceItem, nextSku]);

    // Add a new derived item form
    const handleAddDerivedItem = () => {
        if (!sourceItem) return;

        const newItem: DerivedItemForm = {
            name: `${sourceItem.name} Variant ${derivedItems.length + 1}`,
            sku: generateSku(derivedItems.length),
            quantity: 0,
            weight: sourceItem.trackingType === 'weight' ? 0 : undefined,
            category: sourceItem.category,
            price: sourceItem.price,
            cost: sourceItem.cost,
            tags: sourceItem.tags,
        };

        setDerivedItems([...derivedItems, newItem]);
    };

    // Remove a derived item
    const handleRemoveDerivedItem = (index: number) => {
        const updatedItems = [...derivedItems];
        const removedItem = updatedItems[index];

        // Update remaining quantities
        if (removedItem.quantity > 0) {
            setRemainingQuantity(prev => prev + removedItem.quantity);
        }

        if (removedItem.weight && removedItem.weight > 0) {
            setRemainingWeight(prev => prev + (removedItem.weight || 0));
        }

        updatedItems.splice(index, 1);
        setDerivedItems(updatedItems);
    };

    // Update a derived item property
    const handleDerivedItemChange = (index: number, field: keyof DerivedItemForm, value: any) => {
        const updatedItems = [...derivedItems];
        const oldValue = updatedItems[index][field];

        // Handle quantity and weight changes to update remaining amounts
        if (field === 'quantity' && typeof oldValue === 'number' && typeof value === 'number') {
            const diff = value - oldValue;
            if (diff > remainingQuantity) {
                setError(`Not enough quantity remaining. Only ${remainingQuantity} units available.`);
                return;
            }
            setRemainingQuantity(prev => prev - diff);
            setError(null);
        }
        else if (field === 'weight' && typeof oldValue === 'number' && typeof value === 'number') {
            const diff = value - oldValue;
            if (diff > remainingWeight) {
                setError(`Not enough weight remaining. Only ${remainingWeight} ${sourceItem?.weightUnit} available.`);
                return;
            }
            setRemainingWeight(prev => prev - diff);
            setError(null);
        }

        // Update the field
        updatedItems[index] = {
            ...updatedItems[index],
            [field]: value
        };

        setDerivedItems(updatedItems);
    };

    // Create breakdown items
    const handleCreateItems = async () => {
        if (!sourceItem || !sourceItem._id) {
            setError('Source item is required');
            return;
        }

        if (derivedItems.length === 0) {
            setError('Add at least one derived item');
            return;
        }

        // Validate that each derived item has a name, SKU and quantity
        const invalidItem = derivedItems.find(item =>
            !item.name ||
            !item.sku ||
            item.quantity <= 0 ||
            (sourceItem.trackingType === 'weight' && (!item.weight || item.weight <= 0))
        );

        if (invalidItem) {
            setError('All items must have a name, SKU and valid quantity/weight');
            return;
        }

        try {
            const result = await createBreakdownItems.mutateAsync({
                sourceItemId: sourceItem._id,
                derivedItems: derivedItems.map(item => ({
                    ...item,
                    imageUrl: sourceItem.imageUrl
                }))
            });

            if (onItemsCreated) {
                onItemsCreated(result.derivedItems);
            }

            onClose();
        } catch (err) {
            console.error('Failed to create breakdown items:', err);
            setError('Failed to create items. Please try again.');
        }
    };

    // Calculate total allocated quantities
    const totalAllocatedQuantity = derivedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalAllocatedWeight = derivedItems.reduce((sum, item) => sum + (item.weight || 0), 0);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            PaperProps={{ sx: { height: '80vh' } }}
        >
            <DialogTitle>
                Break Down Inventory Item
                {sourceItem && (
                    <Typography variant="subtitle1" color="text.secondary">
                        Source: {sourceItem.name} ({sourceItem.sku})
                    </Typography>
                )}
            </DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {sourceItem && (
                    <>
                        {/* Source Item Information */}
                        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                            <Grid2 container spacing={2} alignItems="center">
                                <Grid2 size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="subtitle1">Source Item</Typography>
                                    <Typography variant="h6">{sourceItem.name}</Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                        <Chip
                                            size="small"
                                            label={sourceItem.sku}
                                            variant="outlined"
                                        />
                                        <Chip
                                            size="small"
                                            label={sourceItem.category}
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </Box>
                                </Grid2>

                                <Grid2 size={{ xs: 12, sm: 6 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Price
                                            </Typography>
                                            <Typography variant="h6">
                                                {formatCurrency(sourceItem.price)}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Available
                                            </Typography>
                                            <Typography variant="h6">
                                                {sourceItem.trackingType === 'quantity'
                                                    ? `${remainingQuantity} units`
                                                    : `${remainingWeight} ${sourceItem.weightUnit}`
                                                }
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid2>
                            </Grid2>
                        </Paper>

                        {/* Controls for Derived Items */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Button
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={handleAddDerivedItem}
                            >
                                Add Derived Item
                            </Button>

                            <Box>
                                <Tooltip title="Total allocated from source item">
                                    <Chip
                                        icon={sourceItem.trackingType === 'quantity' ? <Inventory /> : <Scale />}
                                        label={sourceItem.trackingType === 'quantity'
                                            ? `${totalAllocatedQuantity} / ${sourceItem.quantity} units allocated`
                                            : `${totalAllocatedWeight} / ${sourceItem.weight} ${sourceItem.weightUnit} allocated`
                                        }
                                        color={remainingQuantity === 0 || remainingWeight === 0 ? "success" : "default"}
                                    />
                                </Tooltip>
                            </Box>
                        </Box>

                        {/* Derived Items */}
                        {derivedItems.length === 0 ? (
                            <Alert severity="info">
                                Click "Add Derived Item" to start creating specific items from this generic item.
                            </Alert>
                        ) : (
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell>SKU</TableCell>
                                            <TableCell align="right">
                                                {sourceItem.trackingType === 'quantity' ? 'Quantity' : 'Weight'}
                                            </TableCell>
                                            <TableCell align="right">Price</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {derivedItems.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        value={item.name}
                                                        onChange={(e) => handleDerivedItemChange(index, 'name', e.target.value)}
                                                        margin="none"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        value={item.sku}
                                                        onChange={(e) => handleDerivedItemChange(index, 'sku', e.target.value)}
                                                        margin="none"
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        value={sourceItem.trackingType === 'quantity' ? item.quantity : item.weight}
                                                        onChange={(e) => {
                                                            const value = parseFloat(e.target.value) || 0;
                                                            handleDerivedItemChange(
                                                                index,
                                                                sourceItem.trackingType === 'quantity' ? 'quantity' : 'weight',
                                                                value
                                                            );
                                                        }}
                                                        InputProps={{
                                                            endAdornment: sourceItem.trackingType !== 'quantity' && (
                                                                <InputAdornment position="end">
                                                                    {sourceItem.weightUnit}
                                                                </InputAdornment>
                                                            ),
                                                            inputProps: { min: 0, step: sourceItem.trackingType === 'quantity' ? 1 : 0.1 }
                                                        }}
                                                        sx={{ width: '120px' }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        value={item.price || sourceItem.price}
                                                        onChange={(e) => handleDerivedItemChange(index, 'price', parseFloat(e.target.value))}
                                                        InputProps={{
                                                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                            inputProps: { min: 0, step: 0.01 }
                                                        }}
                                                        sx={{ width: '100px' }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRemoveDerivedItem(index)}
                                                    >
                                                        <DeleteOutline fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}

                        {/* Additional fields for all derived items */}
                        {derivedItems.length > 0 && (
                            <Paper variant="outlined" sx={{ p: 2, mt: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Set details for all derived items
                                </Typography>

                                <Grid2 container spacing={2}>
                                    <Grid2 size={{ xs: 12, sm: 6 }}>
                                        <FormControl fullWidth size="small">
                                            <InputLabel>Category</InputLabel>
                                            <Select
                                                value={derivedItems[0]?.category || ''}
                                                onChange={(e) => {
                                                    const newCategory = e.target.value;
                                                    setDerivedItems(prev => prev.map(item => ({
                                                        ...item,
                                                        category: newCategory
                                                    })));
                                                }}
                                                label="Category"
                                            >
                                                <MenuItem value="">None</MenuItem>
                                                <MenuItem value={sourceItem.category}>{sourceItem.category}</MenuItem>
                                                <MenuItem value={`${sourceItem.category} - Derived`}>{sourceItem.category} - Derived</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid2>

                                    <Grid2 size={{ xs: 12 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            label="Description (applied to all)"
                                            multiline
                                            rows={2}
                                            value={derivedItems[0]?.description || ''}
                                            onChange={(e) => {
                                                const newDescription = e.target.value;
                                                setDerivedItems(prev => prev.map(item => ({
                                                    ...item,
                                                    description: newDescription
                                                })));
                                            }}
                                        />
                                    </Grid2>
                                </Grid2>
                            </Paper>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleCreateItems}
                    variant="contained"
                    color="primary"
                    disabled={!sourceItem || derivedItems.length === 0}
                >
                    Create Items
                </Button>
            </DialogActions>
        </Dialog>
    );
}
