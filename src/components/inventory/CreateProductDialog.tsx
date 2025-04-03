import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid2,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Divider,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableFooter,
    Paper,
    IconButton,
    FormControlLabel,
    Switch,
    Slider,
    InputAdornment,
    Alert,
    Checkbox,
    Avatar,
} from '@mui/material';
import {
    Add,
    DeleteOutline,
    Search,
    Category,
} from '@mui/icons-material';
import { useItems, useCreateItem } from '@hooks/useItems';
import { Item } from '@custTypes/models';
import { formatCurrency } from '@utils/formatters';

interface CreateProductDialogProps {
    open: boolean;
    onClose: () => void;
    onProductCreated?: (product: Item) => void;
}

export default function CreateProductDialog({
    open,
    onClose,
    onProductCreated
}: CreateProductDialogProps) {
    // API hooks
    const { data: items = [] } = useItems();
    const createItem = useCreateItem();

    // Form state
    const [newProductName, setNewProductName] = useState('');
    const [newProductSku, setNewProductSku] = useState('');
    const [newProductCategory, setNewProductCategory] = useState('');
    const [newProductDescription, setNewProductDescription] = useState('');
    const [selectedMaterials, setSelectedMaterials] = useState<Array<{
        material: Item;
        quantity: number;
        totalCost: number;
    }>>([]);
    const [materialSearchQuery, setMaterialSearchQuery] = useState('');
    const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
    const [newProductMarkup, setNewProductMarkup] = useState(50); // Default 50% markup
    const [isManualPrice, setIsManualPrice] = useState<boolean>(false);
    const [finalPrice, setFinalPrice] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    // Material selection state
    const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
    const [materialQuantities, setMaterialQuantities] = useState<Record<string, string>>({});

    // Extract unique categories from items
    const categories = useMemo(() =>
        Array.from(new Set(items.map(item => item.category).filter(Boolean))),
        [items]
    );

    // Calculate total cost of all materials
    const calculateMaterialsCost = useCallback(() => {
        return selectedMaterials.reduce((sum, { totalCost }) => sum + totalCost, 0);
    }, [selectedMaterials]);

    // Calculate product price based on materials cost and markup
    const calculateProductPrice = useCallback(() => {
        const materialsCost = calculateMaterialsCost();
        return isManualPrice ? finalPrice : materialsCost * (1 + newProductMarkup / 100);
    }, [calculateMaterialsCost, newProductMarkup, isManualPrice, finalPrice]);

    // Generate a unique SKU
    const generateProductSku = useCallback(() => {
        const prefix = 'PROD';
        const timestamp = Date.now().toString().slice(-6);
        return `${prefix}${timestamp}`;
    }, []);

    // Generate SKU when dialog opens
    useEffect(() => {
        if (open) {
            setNewProductSku(generateProductSku());
        }
    }, [open, generateProductSku]);

    // Filter materials based on search query
    const filteredMaterials = useMemo(() => {
        return items
            .filter(item => item.itemType === 'material' || item.itemType === 'both')
            .filter(item =>
                item.name.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
                item.sku.toLowerCase().includes(materialSearchQuery.toLowerCase())
            );
    }, [items, materialSearchQuery]);

    // Update price when markup or materials change
    useEffect(() => {
        if (isManualPrice) {
            // Keep current price if already set
            return;
        }
        // Otherwise set default price based on materials cost and markup
        const materialsCost = calculateMaterialsCost();
        setFinalPrice(materialsCost * (1 + newProductMarkup / 100));
    }, [calculateMaterialsCost, newProductMarkup, selectedMaterials, isManualPrice]);

    // Reset all form fields
    const resetForm = useCallback(() => {
        setNewProductName('');
        setNewProductSku(generateProductSku());
        setNewProductCategory('');
        setNewProductDescription('');
        setSelectedMaterials([]);
        setMaterialSearchQuery('');
        setNewProductMarkup(50);
        setIsManualPrice(false);
        setFinalPrice(0);
        setError(null);
        setSelectedMaterialIds([]);
        setMaterialQuantities({});
    }, [generateProductSku]);


    // Reset form when dialog closes
    useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open, resetForm]);

    // Remove a material from the new product
    const handleRemoveMaterial = (index: number) => {
        setSelectedMaterials(prev => prev.filter((_, i) => i !== index));
    };

    // Add multiple materials at once from the materials dialog
    const handleAddMultipleMaterials = () => {
        const newMaterials = selectedMaterialIds.map(id => {
            const material = items.find(item => item._id === id);
            if (!material) return null;

            const quantity = parseInt(materialQuantities[id]) || 1;
            const unitCost = material.cost || material.price;
            const totalCost = unitCost * quantity;

            return { material, quantity, totalCost };
        }).filter(Boolean) as Array<{ material: Item; quantity: number; totalCost: number }>;

        setSelectedMaterials(prev => [...prev, ...newMaterials]);
        setSelectedMaterialIds([]);
        setMaterialQuantities({});
        setMaterialDialogOpen(false);
    };

    // Create the new product
    const handleCreateProduct = async () => {
        if (!newProductName) {
            setError("Product name is required");
            return;
        }

        if (selectedMaterials.length === 0) {
            setError("At least one material is required");
            return;
        }

        try {
            // Create new product
            const materialsCost = calculateMaterialsCost();
            const productPrice = calculateProductPrice();

            const newProduct: Partial<Item> = {
                name: newProductName,
                sku: newProductSku,
                category: newProductCategory,
                description: newProductDescription,
                trackingType: 'quantity',
                sellByMeasurement: 'quantity',
                quantity: 1, // Start with one item
                weight: 0,
                weightUnit: 'lb',
                price: productPrice,
                priceType: 'each',
                itemType: 'product',
                cost: materialsCost,
                components: selectedMaterials.map(({ material, quantity }) => ({
                    item: material._id || '',
                    quantity
                }))
            };

            // Create the product via API
            const createdProduct = await createItem.mutateAsync(newProduct as Item);

            // Call the callback if provided
            if (onProductCreated) {
                onProductCreated(createdProduct);
            }

            resetForm();
            onClose();
        } catch (err) {
            console.error('Failed to create product:', err);
            setError('Failed to create product. Please try again.');
        }
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>Create New Product</DialogTitle>
                <DialogContent dividers>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Grid2 container spacing={3}>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                required
                                label="Product Name"
                                value={newProductName}
                                onChange={(e) => setNewProductName(e.target.value)}
                                margin="normal"
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth
                                required
                                label="SKU"
                                value={newProductSku}
                                onChange={(e) => setNewProductSku(e.target.value)}
                                margin="normal"
                            />
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={newProductCategory}
                                    onChange={(e) => setNewProductCategory(e.target.value)}
                                    label="Category"
                                >
                                    <MenuItem value="">None</MenuItem>
                                    {categories.map((category) => (
                                        <MenuItem key={category} value={category}>
                                            {category}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid2>
                        <Grid2 size={{ xs: 12, sm: 6 }}>
                            <Box sx={{ mt: 2, mb: 1 }}>
                                <Typography variant="subtitle2">Materials Cost</Typography>
                                <Typography variant="h6" color="text.secondary">
                                    {formatCurrency(calculateMaterialsCost())}
                                </Typography>
                            </Box>
                        </Grid2>
                        <Grid2 size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Description"
                                value={newProductDescription}
                                onChange={(e) => setNewProductDescription(e.target.value)}
                                margin="normal"
                            />
                        </Grid2>
                    </Grid2>

                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" gutterBottom>Materials</Typography>

                    <Box sx={{ mb: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => setMaterialDialogOpen(true)}
                        >
                            Add Material
                        </Button>
                    </Box>

                    {selectedMaterials.length > 0 ? (
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Material</TableCell>
                                        <TableCell align="right">Cost</TableCell>
                                        <TableCell align="center">Quantity</TableCell>
                                        <TableCell align="right">Total</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {selectedMaterials.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.material.name}</TableCell>
                                            <TableCell align="right">{formatCurrency(item.material.cost || item.material.price)}</TableCell>
                                            <TableCell align="center">{item.quantity}</TableCell>
                                            <TableCell align="right">{formatCurrency(item.totalCost)}</TableCell>
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleRemoveMaterial(index)}
                                                >
                                                    <DeleteOutline fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow>
                                        <TableCell colSpan={3} align="right">
                                            <Typography variant="subtitle2">Total Materials Cost:</Typography>
                                        </TableCell>
                                        <TableCell align="right" colSpan={2}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {formatCurrency(calculateMaterialsCost())}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            No materials added yet. Click "Add Material" to add materials to this product.
                        </Alert>
                    )}

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" gutterBottom>Pricing</Typography>
                    <Grid2 container spacing={2} alignItems="center">
                        <Grid2 size={{ xs: 12 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={!isManualPrice}
                                        onChange={() => setIsManualPrice(!isManualPrice)}
                                    />
                                }
                                label={isManualPrice ? "Set Final Price" : "Set Markup Percentage"}
                            />
                        </Grid2>

                        {!isManualPrice ? (
                            // Markup Percentage Mode
                            <Grid2 size={{ xs: 12, md: 6 }}>
                                <Box>
                                    <Typography variant="body2" gutterBottom>
                                        Markup percentage: {newProductMarkup}%
                                    </Typography>
                                    <Slider
                                        value={newProductMarkup}
                                        onChange={(_, newValue) => setNewProductMarkup(newValue as number)}
                                        step={5}
                                        marks
                                        min={0}
                                        max={1000}
                                        valueLabelDisplay="auto"
                                        valueLabelFormat={(value) => `${value}%`}
                                    />
                                </Box>
                            </Grid2>
                        ) : (
                            // Final Price Mode
                            <Grid2 size={{ xs: 12, md: 6 }}>
                                <TextField
                                    fullWidth
                                    label="Final Price"
                                    type="number"
                                    value={finalPrice}
                                    onChange={(e) => {
                                        const price = parseFloat(e.target.value) || 0;
                                        setFinalPrice(price);
                                        // Calculate markup percentage based on materials cost
                                        const materialsCost = calculateMaterialsCost();
                                        if (materialsCost > 0) {
                                            const calculatedMarkup = ((price / materialsCost) - 1) * 100;
                                            setNewProductMarkup(Math.round(calculatedMarkup));
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                        inputProps: { min: 0, step: 0.01 }
                                    }}
                                />
                            </Grid2>
                        )}

                        <Grid2 size={{ xs: 12, md: 6 }}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Materials Cost: {formatCurrency(calculateMaterialsCost())}
                                </Typography>
                                <Typography variant="body2" color="success.main">
                                    Markup: {formatCurrency(calculateProductPrice() - calculateMaterialsCost())}
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="h6" fontWeight="bold" color="primary">
                                    Final Price: {formatCurrency(calculateProductPrice())}
                                </Typography>
                            </Paper>
                        </Grid2>
                    </Grid2>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        onClick={handleCreateProduct}
                        variant="contained"
                        color="primary"
                        disabled={!newProductName || selectedMaterials.length === 0}
                    >
                        Create Product
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Material Selection Dialog */}
            <Dialog
                open={materialDialogOpen}
                onClose={() => setMaterialDialogOpen(false)}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    Select Materials
                    <Typography variant="subtitle2" color="text.secondary">
                        Select multiple materials to add at once
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <TextField
                        fullWidth
                        label="Search Materials"
                        value={materialSearchQuery}
                        onChange={(e) => setMaterialSearchQuery(e.target.value)}
                        margin="normal"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            indeterminate={selectedMaterialIds.length > 0 && selectedMaterialIds.length < filteredMaterials.length}
                                            checked={filteredMaterials.length > 0 && selectedMaterialIds.length === filteredMaterials.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    // Select all materials
                                                    setSelectedMaterialIds(filteredMaterials.map(m => m._id || ''));
                                                    // Initialize all quantities to 1
                                                    const newQuantities: Record<string, string> = {};
                                                    filteredMaterials.forEach(m => {
                                                        if (m._id) newQuantities[m._id] = '1';
                                                    });
                                                    setMaterialQuantities({ ...materialQuantities, ...newQuantities });
                                                } else {
                                                    // Unselect all
                                                    setSelectedMaterialIds([]);
                                                }
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>Material</TableCell>
                                    <TableCell align="right">Cost</TableCell>
                                    <TableCell align="center">In Stock</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredMaterials.map(item => (
                                    <TableRow
                                        key={item._id}
                                        selected={item._id ? selectedMaterialIds.includes(item._id) : false}
                                        sx={{
                                            '&.Mui-selected': {
                                                backgroundColor: 'rgba(25, 118, 210, 0.08)'
                                            }
                                        }}
                                    >
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={item._id ? selectedMaterialIds.includes(item._id) : false}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        // Add to selection
                                                        setSelectedMaterialIds(prev => [...prev, item._id || '']);
                                                        // Set default quantity
                                                        setMaterialQuantities(prev => ({
                                                            ...prev,
                                                            [item._id || '']: '1'
                                                        }));
                                                    } else {
                                                        // Remove from selection
                                                        setSelectedMaterialIds(prev => prev.filter(id => id !== item._id));
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Avatar
                                                    src={item.imageUrl || undefined}
                                                    variant="rounded"
                                                    sx={{ width: 40, height: 40, mr: 2 }}
                                                >
                                                    <Category fontSize="small" />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body1">{item.name}</Typography>
                                                    <Typography variant="body2" color="text.secondary">SKU: {item.sku}</Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">{formatCurrency(item.cost || item.price)}</TableCell>
                                        <TableCell align="center">
                                            {item.trackingType === 'quantity'
                                                ? `${item.quantity} units`
                                                : `${item.weight} ${item.weightUnit}`}
                                        </TableCell>
                                        <TableCell align="right">
                                            {item._id && selectedMaterialIds.includes(item._id) && (
                                                <TextField
                                                    type="number"
                                                    size="small"
                                                    value={materialQuantities[item._id] || '1'}
                                                    onChange={(e) => setMaterialQuantities(prev => ({
                                                        ...prev,
                                                        [item._id as string]: e.target.value
                                                    }))}
                                                    InputProps={{ inputProps: { min: 1 } }}
                                                    sx={{ width: 70 }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMaterialDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleAddMultipleMaterials}
                        variant="contained"
                        color="primary"
                        disabled={selectedMaterialIds.length === 0}
                    >
                        Add Selected Materials
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
