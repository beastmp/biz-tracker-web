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
    Tabs,
    Tab,
    Autocomplete,
    CircularProgress,
    Divider,
} from '@mui/material';
import {
    Add,
    DeleteOutline,
    Scale,
    Inventory,
    Search,
    Transform,
    LinkOff,
    Link as LinkIcon,
    Straighten,
    SquareFoot,
    ViewInAr
} from '@mui/icons-material';
import { useCreateBreakdownItems, useNextSku, useItems } from '@hooks/useItems';
import { Item, TrackingType } from '@custTypes/models';
import { formatCurrency, formatMeasurement } from '@utils/formatters';

interface BreakdownItemsDialogProps {
    open: boolean;
    onClose: () => void;
    sourceItem: Item | null;
    onItemsCreated?: (items: Item[]) => void;
}

// Unified derived item form for both new and existing items
interface DerivedItemForm {
    // Common ID field - if specified, use existing item
    itemId?: string;
    item?: Item | null;

    // Fields for new items
    name?: string;
    sku?: string;
    description?: string;
    category?: string;
    price?: number;
    cost?: number;
    tags?: string[];

    // Measurement fields - all supported types
    quantity: number;
    weight?: number;
    length?: number;
    area?: number;
    volume?: number;
}

type BreakdownMode = 'create' | 'allocate';

export default function BreakdownItemsDialog({
    open,
    onClose,
    sourceItem,
    onItemsCreated
}: BreakdownItemsDialogProps) {
    // Hooks
    const { data: nextSku } = useNextSku();
    const createBreakdownItems = useCreateBreakdownItems();
    const { data: existingItems = [], isLoading: itemsLoading } = useItems();

    // State
    const [breakdownMode, setBreakdownMode] = useState<BreakdownMode>('create');
    const [derivedItems, setDerivedItems] = useState<DerivedItemForm[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Track remaining amounts for all measurement types
    const [remainingQuantity, setRemainingQuantity] = useState<number>(0);
    const [remainingWeight, setRemainingWeight] = useState<number>(0);
    const [remainingLength, setRemainingLength] = useState<number>(0);
    const [remainingArea, setRemainingArea] = useState<number>(0);
    const [remainingVolume, setRemainingVolume] = useState<number>(0);

    // Reset form on dialog open/source item change
    useEffect(() => {
        if (open && sourceItem) {
            setDerivedItems([]);
            setError(null);
            setBreakdownMode('create');

            // Reset all measurement quantities
            setRemainingQuantity(sourceItem.quantity || 0);
            setRemainingWeight(sourceItem.weight || 0);
            setRemainingLength(sourceItem.length || 0);
            setRemainingArea(sourceItem.area || 0);
            setRemainingVolume(sourceItem.volume || 0);
        }
    }, [open, sourceItem]);

    // Generate a unique SKU
    const generateSku = useCallback((baseIndex: number) => {
        if (!sourceItem) return '';

        // Use sourceItem SKU with suffix
        return `${sourceItem.sku}-${String(baseIndex + 1).padStart(2, '0')}`;
    }, [sourceItem, nextSku]);

    // Get the measurement unit based on tracking type
    const getMeasurementUnit = useCallback((trackingType: TrackingType): string => {
        if (!sourceItem) return '';

        switch (trackingType) {
            case 'weight': return sourceItem.weightUnit || 'lb';
            case 'length': return sourceItem.lengthUnit || 'in';
            case 'area': return sourceItem.areaUnit || 'sqft';
            case 'volume': return sourceItem.volumeUnit || 'l';
            default: return '';
        }
    }, [sourceItem]);

    // Add a new derived item form
    const handleAddDerivedItem = () => {
        if (!sourceItem) return;

        const newItem: DerivedItemForm = {
            name: `${sourceItem.name} Variant ${derivedItems.length + 1}`,
            sku: generateSku(derivedItems.length),
            quantity: 0,
            category: sourceItem.category,
            price: sourceItem.price,
            cost: sourceItem.cost,
            tags: sourceItem.tags,
        };

        // Add appropriate measurement field based on tracking type
        switch(sourceItem.trackingType) {
            case 'weight':
                newItem.weight = 0;
                break;
            case 'length':
                newItem.length = 0;
                break;
            case 'area':
                newItem.area = 0;
                break;
            case 'volume':
                newItem.volume = 0;
                break;
        }

        setDerivedItems([...derivedItems, newItem]);
    };

    // Add a new allocation to existing item
    const handleAddAllocation = () => {
        if (!sourceItem) return;

        const newAllocation: DerivedItemForm = {
            itemId: '',
            item: null,
            quantity: 0
        };

        // Add appropriate measurement field based on tracking type
        switch(sourceItem.trackingType) {
            case 'weight':
                newAllocation.weight = 0;
                break;
            case 'length':
                newAllocation.length = 0;
                break;
            case 'area':
                newAllocation.area = 0;
                break;
            case 'volume':
                newAllocation.volume = 0;
                break;
        }

        setDerivedItems([...derivedItems, newAllocation]);
    };

    // Remove a derived item
    const handleRemoveDerivedItem = (index: number) => {
        const updatedItems = [...derivedItems];
        const removedItem = updatedItems[index];

        // Update remaining quantities for all measurement types
        if (removedItem.quantity > 0) {
            setRemainingQuantity(prev => prev + removedItem.quantity);
        }

        if (removedItem.weight && removedItem.weight > 0) {
            setRemainingWeight(prev => prev + removedItem.weight);
        }

        if (removedItem.length && removedItem.length > 0) {
            setRemainingLength(prev => prev + removedItem.length);
        }

        if (removedItem.area && removedItem.area > 0) {
            setRemainingArea(prev => prev + removedItem.area);
        }

        if (removedItem.volume && removedItem.volume > 0) {
            setRemainingVolume(prev => prev + removedItem.volume);
        }

        updatedItems.splice(index, 1);
        setDerivedItems(updatedItems);
    };

    // Update a derived item property
    const handleDerivedItemChange = (index: number, field: keyof DerivedItemForm, value: any) => {
        const updatedItems = [...derivedItems];
        const oldValue = updatedItems[index][field];

        // Special handling for item selection
        if (field === 'item') {
            const selectedItem = value as Item | null;
            updatedItems[index] = {
                ...updatedItems[index],
                item: selectedItem,
                itemId: selectedItem?._id || '',
            };
            setDerivedItems(updatedItems);
            return;
        }

        // Handle measurement changes to update remaining amounts
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
        else if (field === 'length' && typeof oldValue === 'number' && typeof value === 'number') {
            const diff = value - oldValue;
            if (diff > remainingLength) {
                setError(`Not enough length remaining. Only ${remainingLength} ${sourceItem?.lengthUnit} available.`);
                return;
            }
            setRemainingLength(prev => prev - diff);
            setError(null);
        }
        else if (field === 'area' && typeof oldValue === 'number' && typeof value === 'number') {
            const diff = value - oldValue;
            if (diff > remainingArea) {
                setError(`Not enough area remaining. Only ${remainingArea} ${sourceItem?.areaUnit} available.`);
                return;
            }
            setRemainingArea(prev => prev - diff);
            setError(null);
        }
        else if (field === 'volume' && typeof oldValue === 'number' && typeof value === 'number') {
            const diff = value - oldValue;
            if (diff > remainingVolume) {
                setError(`Not enough volume remaining. Only ${remainingVolume} ${sourceItem?.volumeUnit} available.`);
                return;
            }
            setRemainingVolume(prev => prev - diff);
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

        try {
            if (breakdownMode === 'create') {
                if (derivedItems.length === 0) {
                    setError('Add at least one derived item');
                    return;
                }

                // Validate that each derived item has a name, SKU and quantity
                const invalidItem = derivedItems.find(item =>
                    !item.name ||
                    !item.sku ||
                    item.quantity <= 0 ||
                    (sourceItem.trackingType === 'weight' && (!item.weight || item.weight <= 0)) ||
                    (sourceItem.trackingType === 'length' && (!item.length || item.length <= 0)) ||
                    (sourceItem.trackingType === 'area' && (!item.area || item.area <= 0)) ||
                    (sourceItem.trackingType === 'volume' && (!item.volume || item.volume <= 0))
                );

                if (invalidItem) {
                    setError(`All items must have a name, SKU and valid ${sourceItem.trackingType}`);
                    return;
                }
            } else {
                // Validate allocations
                if (derivedItems.length === 0) {
                    setError('Add at least one allocation');
                    return;
                }

                // Validate that each allocation has an item selected and valid measurements
                const invalidAllocation = derivedItems.find(item =>
                    !item.itemId ||
                    item.quantity <= 0 ||
                    (sourceItem.trackingType === 'weight' && (!item.weight || item.weight <= 0)) ||
                    (sourceItem.trackingType === 'length' && (!item.length || item.length <= 0)) ||
                    (sourceItem.trackingType === 'area' && (!item.area || item.area <= 0)) ||
                    (sourceItem.trackingType === 'volume' && (!item.volume || item.volume <= 0))
                );

                if (invalidAllocation) {
                    setError(`All allocations must have an item selected and valid ${sourceItem.trackingType}`);
                    return;
                }
            }

            // Send the same data structure regardless of mode
            const result = await createBreakdownItems.mutateAsync({
                sourceItemId: sourceItem._id,
                derivedItems: derivedItems.map(item => {
                    const baseItem = {
                        itemId: item.itemId,
                        quantity: item.quantity,
                        weight: item.weight,
                        length: item.length,
                        area: item.area,
                        volume: item.volume
                    };

                    // Only include new item details if not allocating to existing item
                    if (!item.itemId) {
                        return {
                            ...baseItem,
                            name: item.name,
                            sku: item.sku,
                            category: item.category,
                            description: item.description,
                            price: item.price,
                            cost: item.cost,
                            tags: item.tags,
                            imageUrl: sourceItem.imageUrl
                        };
                    }

                    return baseItem;
                })
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

    // Get the appropriate measurement icon
    const getMeasurementIcon = (trackingType: TrackingType) => {
        switch (trackingType) {
            case 'quantity': return <Inventory />;
            case 'weight': return <Scale />;
            case 'length': return <Straighten />;
            case 'area': return <SquareFoot />;
            case 'volume': return <ViewInAr />;
            default: return <Inventory />;
        }
    };

    // Calculate total allocated quantities for the active tracking type
    const getTotalAllocated = () => {
        switch (sourceItem?.trackingType) {
            case 'quantity':
                return derivedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
            case 'weight':
                return derivedItems.reduce((sum, item) => sum + (item.weight || 0), 0);
            case 'length':
                return derivedItems.reduce((sum, item) => sum + (item.length || 0), 0);
            case 'area':
                return derivedItems.reduce((sum, item) => sum + (item.area || 0), 0);
            case 'volume':
                return derivedItems.reduce((sum, item) => sum + (item.volume || 0), 0);
            default:
                return derivedItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        }
    };

    // Get the remaining amount for the current tracking type
    const getRemaining = () => {
        switch (sourceItem?.trackingType) {
            case 'quantity': return remainingQuantity;
            case 'weight': return remainingWeight;
            case 'length': return remainingLength;
            case 'area': return remainingArea;
            case 'volume': return remainingVolume;
            default: return remainingQuantity;
        }
    };

    // Get the total amount for the current tracking type
    const getTotal = () => {
        if (!sourceItem) return 0;
        switch (sourceItem.trackingType) {
            case 'quantity': return sourceItem.quantity || 0;
            case 'weight': return sourceItem.weight || 0;
            case 'length': return sourceItem.length || 0;
            case 'area': return sourceItem.area || 0;
            case 'volume': return sourceItem.volume || 0;
            default: return sourceItem.quantity || 0;
        }
    };

    // Get measurement unit for the current tracking type
    const getMeasurementUnitDisplay = () => {
        if (!sourceItem) return '';
        switch (sourceItem.trackingType) {
            case 'quantity': return 'units';
            case 'weight': return sourceItem.weightUnit || 'lb';
            case 'length': return sourceItem.lengthUnit || 'in';
            case 'area': return sourceItem.areaUnit || 'sqft';
            case 'volume': return sourceItem.volumeUnit || 'l';
            default: return 'units';
        }
    };

    // Filter items based on search term and compatible tracking type
    const filteredItems = existingItems.filter(item => {
        // Don't include the source item itself
        if (item._id === sourceItem?._id) return false;

        // Don't include items that are already allocated
        const isAlreadyAllocated = derivedItems.some(derivedItem =>
            derivedItem.itemId === item._id
        );
        if (isAlreadyAllocated) return false;

        // Filter by search term
        const matchesSearch = !searchTerm ||
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category?.toLowerCase().includes(searchTerm.toLowerCase());

        // Match tracking type if measurement-based
        const matchesTrackingType = sourceItem?.trackingType === 'quantity' ||
            item.trackingType === sourceItem?.trackingType;

        return matchesSearch && matchesTrackingType;
    });

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
                                                {getRemaining()} {getMeasurementUnitDisplay()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid2>
                            </Grid2>
                        </Paper>

                        {/* Breakdown Mode Selector */}
                        <Tabs
                            value={breakdownMode}
                            onChange={(_, newValue) => {
                                setBreakdownMode(newValue);
                                setDerivedItems([]);

                                // Reset all measurement quantities when changing modes
                                setRemainingQuantity(sourceItem.quantity || 0);
                                setRemainingWeight(sourceItem.weight || 0);
                                setRemainingLength(sourceItem.length || 0);
                                setRemainingArea(sourceItem.area || 0);
                                setRemainingVolume(sourceItem.volume || 0);
                            }}
                            sx={{ mb: 3 }}
                        >
                            <Tab
                                value="create"
                                label="Create New Items"
                                icon={<Add fontSize="small" />}
                                iconPosition="start"
                            />
                            <Tab
                                value="allocate"
                                label="Allocate to Existing Items"
                                icon={<LinkIcon fontSize="small" />}
                                iconPosition="start"
                            />
                        </Tabs>

                        {/* Controls for Items */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Button
                                variant="outlined"
                                startIcon={breakdownMode === 'create' ? <Add /> : <LinkIcon />}
                                onClick={breakdownMode === 'create' ? handleAddDerivedItem : handleAddAllocation}
                            >
                                {breakdownMode === 'create' ? 'Add Derived Item' : 'Add Allocation'}
                            </Button>

                            <Box>
                                <Tooltip title="Total allocated from source item">
                                    <Chip
                                        icon={getMeasurementIcon(sourceItem.trackingType)}
                                        label={`${getTotalAllocated()} / ${getTotal()} ${getMeasurementUnitDisplay()} allocated`}
                                        color={getRemaining() === 0 ? "success" : "default"}
                                    />
                                </Tooltip>
                            </Box>
                        </Box>

                        {breakdownMode === 'create' ? (
                            /* Derived Items (Create New) */
                            <>
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
                                                        {formatMeasurementType(sourceItem.trackingType)}
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
                                                                value={item.name || ''}
                                                                onChange={(e) => handleDerivedItemChange(index, 'name', e.target.value)}
                                                                margin="none"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <TextField
                                                                fullWidth
                                                                size="small"
                                                                value={item.sku || ''}
                                                                onChange={(e) => handleDerivedItemChange(index, 'sku', e.target.value)}
                                                                margin="none"
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <TextField
                                                                type="number"
                                                                size="small"
                                                                value={(() => {
                                                                    switch(sourceItem.trackingType) {
                                                                        case 'quantity': return item.quantity;
                                                                        case 'weight': return item.weight;
                                                                        case 'length': return item.length;
                                                                        case 'area': return item.area;
                                                                        case 'volume': return item.volume;
                                                                        default: return item.quantity;
                                                                    }
                                                                })()}
                                                                onChange={(e) => {
                                                                    const value = parseFloat(e.target.value) || 0;
                                                                    handleDerivedItemChange(
                                                                        index,
                                                                        sourceItem.trackingType as keyof DerivedItemForm,
                                                                        value
                                                                    );
                                                                }}
                                                                InputProps={{
                                                                    endAdornment: sourceItem.trackingType !== 'quantity' ? (
                                                                        <InputAdornment position="end">
                                                                            {getMeasurementUnitDisplay()}
                                                                        </InputAdornment>
                                                                    ) : undefined,
                                                                    inputProps: {
                                                                        min: 0,
                                                                        step: sourceItem.trackingType === 'quantity' ? 1 : 0.1
                                                                    }
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
                        ) : (
                            /* Allocate to Existing Items */
                            <>
                                {/* Search for existing items */}
                                <TextField
                                    fullWidth
                                    label="Search for existing items"
                                    variant="outlined"
                                    size="small"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                {itemsLoading && <CircularProgress size={20} />}
                                            </InputAdornment>
                                        )
                                    }}
                                    sx={{ mb: 2 }}
                                />

                                {derivedItems.length === 0 ? (
                                    <Alert severity="info">
                                        Click "Add Allocation" to allocate quantities to existing items.
                                    </Alert>
                                ) : (
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Item</TableCell>
                                                    <TableCell align="right">
                                                        {formatMeasurementType(sourceItem.trackingType)}
                                                    </TableCell>
                                                    <TableCell align="right">Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {derivedItems.map((item, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <Autocomplete
                                                                options={filteredItems}
                                                                getOptionLabel={(option) => `${option.name} (${option.sku})`}
                                                                value={item.item}
                                                                onChange={(_, newValue) => {
                                                                    handleDerivedItemChange(index, 'item', newValue);
                                                                }}
                                                                renderInput={(params) => (
                                                                    <TextField
                                                                        {...params}
                                                                        size="small"
                                                                        placeholder="Select an existing item"
                                                                        fullWidth
                                                                    />
                                                                )}
                                                                renderOption={(props, option) => (
                                                                    <li {...props}>
                                                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                                            <Typography variant="body1">{option.name}</Typography>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                SKU: {option.sku} - {option.category}
                                                                            </Typography>
                                                                        </Box>
                                                                    </li>
                                                                )}
                                                                loading={itemsLoading}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <TextField
                                                                type="number"
                                                                size="small"
                                                                value={(() => {
                                                                    switch(sourceItem.trackingType) {
                                                                        case 'quantity': return item.quantity;
                                                                        case 'weight': return item.weight;
                                                                        case 'length': return item.length;
                                                                        case 'area': return item.area;
                                                                        case 'volume': return item.volume;
                                                                        default: return item.quantity;
                                                                    }
                                                                })()}
                                                                onChange={(e) => {
                                                                    const value = parseFloat(e.target.value) || 0;
                                                                    handleDerivedItemChange(
                                                                        index,
                                                                        sourceItem.trackingType as keyof DerivedItemForm,
                                                                        value
                                                                    );
                                                                }}
                                                                InputProps={{
                                                                    endAdornment: sourceItem.trackingType !== 'quantity' ? (
                                                                        <InputAdornment position="end">
                                                                            {getMeasurementUnitDisplay()}
                                                                        </InputAdornment>
                                                                    ) : undefined,
                                                                    inputProps: {
                                                                        min: 0,
                                                                        step: sourceItem.trackingType === 'quantity' ? 1 : 0.1
                                                                    }
                                                                }}
                                                                sx={{ width: '120px' }}
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

                                {filteredItems.length === 0 && searchTerm && !itemsLoading && (
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        No matching items found. Try adjusting your search.
                                    </Alert>
                                )}
                            </>
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
                    {breakdownMode === 'create'
                        ? 'Create Items'
                        : 'Allocate to Items'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// Helper function to format measurement type
function formatMeasurementType(type: TrackingType): string {
    switch (type) {
        case 'quantity': return 'Quantity';
        case 'weight': return 'Weight';
        case 'length': return 'Length';
        case 'area': return 'Area';
        case 'volume': return 'Volume';
        default: return 'Quantity';
    }
}
