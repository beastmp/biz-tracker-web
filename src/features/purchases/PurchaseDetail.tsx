import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  Delete,
  Balance,
  Inventory2,
  Straighten,
  AspectRatio,
  LocalDrink,
  Print,
  Visibility
} from "@mui/icons-material";
import {
  usePurchase,
  useDeletePurchase,
  formatPurchaseMeasurement
} from "@hooks/usePurchases";
import { formatCurrency, formatDate, formatPaymentMethod } from "@utils/formatters";
import LoadingScreen from "@components/ui/LoadingScreen";
import StatusChip from "@components/ui/StatusChip";
import { useItems } from "@hooks/useItems";
import useRelationships from "@hooks/useRelationships";
import { ENTITY_TYPES, RELATIONSHIP_TYPES } from "@utils/apiClient";
import { Relationship } from "@custTypes/models";

// Helper function to extract MongoDB document data
const extractMongoData = <T,>(document: T | { _doc: T }): T => {
  return (document as { _doc: T })._doc || document as T;
};

export default function PurchaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: purchaseData, isLoading, error } = usePurchase(id);
  const { data: items = [] } = useItems();
  const deletePurchase = useDeletePurchase();
  const { getRelationshipsByPrimary, loading: relationshipsLoading } = useRelationships();

  // State to store clean relationship items
  const [relationshipItems, setRelationshipItems] = useState<Relationship[]>([]);

  // Load relationship data for this purchase and clean MongoDB document structure
  useEffect(() => {
    if (id) {
      const loadRelationships = async () => {
        try {
          const relationships = await getRelationshipsByPrimary(
            id,
            ENTITY_TYPES.PURCHASE,
            RELATIONSHIP_TYPES.PURCHASE_ITEM
          );

          // Clean up MongoDB document data
          const cleanRelationships = relationships.map((rel: Relationship | { _doc: Relationship }) => {
            // Extract actual data from MongoDB document
            const relationshipData = extractMongoData<Relationship>(rel);

            return {
              _id: relationshipData._id,
              primaryId: relationshipData.primaryId,
              primaryType: relationshipData.primaryType,
              secondaryId: relationshipData.secondaryId,
              secondaryType: relationshipData.secondaryType,
              relationshipType: relationshipData.relationshipType,
              measurements: relationshipData.measurements || {},
              purchaseItemAttributes: relationshipData.purchaseItemAttributes || {},
              createdAt: relationshipData.createdAt,
              updatedAt: relationshipData.updatedAt,
              notes: relationshipData.notes,
              metadata: relationshipData.metadata || {}
            };
          });

          setRelationshipItems(cleanRelationships);
        } catch (err) {
          console.error("Error loading relationships:", err);
        }
      };

      loadRelationships();
    }
  }, [id, getRelationshipsByPrimary]);

  // Create a lookup object for items by ID
  const itemLookup = Object.fromEntries(
    (items || []).map(item => [item._id, item])
  );

  const handleDelete = async () => {
    if (!id || !window.confirm(
      "Are you sure you want to delete this purchase? This will update inventory quantities."
    )) return;

    try {
      await deletePurchase.mutateAsync(id);
      navigate("/purchases");
    } catch (error) {
      console.error("Failed to delete purchase:", error);
    }
  };

  const getMeasurementIcon = (trackingType: string) => {
    switch (trackingType) {
      case "quantity":
        return <Inventory2 fontSize="small" color="primary" />;
      case "weight":
        return <Balance fontSize="small" color="primary" />;
      case "length":
        return <Straighten fontSize="small" color="primary" />;
      case "area":
        return <AspectRatio fontSize="small" color="primary" />;
      case "volume":
        return <LocalDrink fontSize="small" color="primary" />;
      default:
        return <Inventory2 fontSize="small" color="primary" />;
    }
  };

  // Get tracking type from relationship data
  const getTrackingType = (relationship: Relationship): string => {
    const purchaseItemAttributes = relationship.purchaseItemAttributes || {};
    return purchaseItemAttributes.purchasedBy || "quantity";
  };

  // Format relationship measurements for display
  const formatMeasurement = (relationship: Relationship): string => {
    return formatPurchaseMeasurement(relationship);
  };

  if (isLoading || relationshipsLoading) {
    return <LoadingScreen />;
  }

  if (error || !purchaseData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load purchase details. {error?.message || ""}
        </Alert>
        <Button
          component={RouterLink}
          to="/purchases"
          startIcon={<ArrowBack />}
          sx={{ mt: 2 }}
        >
          Back to Purchases
        </Button>
      </Box>
    );
  }

  // Clean MongoDB document data
  const purchase = extractMongoData(purchaseData);

  // Use the relationships from state to ensure MongoDB document structure is clean
  // This is crucial for handling MongoDB relationship data correctly
  const cleanRelationshipItems = relationshipItems.length > 0
    ? relationshipItems
    : (purchase.relationshipItems || []);

  return (
    <Box>
      <Box sx={{
        display: "flex",
        justifyContent: "space-between",
        mb: 3,
        alignItems: "center"
      }}>
        <Typography variant="h4" component="h1">
          Purchase Details
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            component={RouterLink}
            to="/purchases"
          >
            Back to Purchases
          </Button>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            component={RouterLink}
            to={`/purchases/${id}/edit`}
          >
            Edit Purchase
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleDelete}
          >
            Delete
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2
            }}>
              <Typography variant="h5" component="h2">
                {purchase.supplier?.name || "Unknown Supplier"}
              </Typography>
              <StatusChip status={purchase.status} />
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Purchase Date
                </Typography>
                <Typography variant="body1">
                  {purchase.purchaseDate ?
                    formatDate(purchase.purchaseDate) :
                    "Not specified"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Invoice Number
                </Typography>
                <Typography variant="body1">
                  {purchase.invoiceNumber || "Not specified"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Payment Method
                </Typography>
                <Typography variant="body1">
                  {formatPaymentMethod(purchase.paymentMethod)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatCurrency(purchase.total || 0)}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Contact Information
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Contact Name
                </Typography>
                <Typography variant="body1">
                  {purchase.supplier?.contactName || "Not specified"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {purchase.supplier?.email || "Not specified"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">
                  {purchase.supplier?.phone || "Not specified"}
                </Typography>
              </Grid>
            </Grid>

            {purchase.notes && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Notes</Typography>
                <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>{purchase.notes}</Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Supplier Information</Typography>
            <Divider sx={{ mb: 2 }} />

            {purchase.supplier && purchase.supplier.name ? (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body1">{purchase.notes}</Typography>
              </>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Purchased Items
            </Typography>
            {cleanRelationshipItems && cleanRelationshipItems.length > 0 ? (
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Measurement</TableCell>
                    <TableCell align="right">Cost per Unit</TableCell>
                    <TableCell align="right">Discount</TableCell>
                    <TableCell align="right">Total Cost</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cleanRelationshipItems.map((relationship: Relationship, index: number) => {
                    // Get item details from the lookup
                    const itemId = relationship.secondaryId;
                    const item = itemLookup[itemId];
                    const itemName = item?.name ||
                      relationship.metadata?.name ||
                      "Unknown Item";

                    // Get purchase attributes from the relationship
                    const attributes = relationship.purchaseItemAttributes || {};
                    const costPerUnit = attributes.costPerUnit || 0;
                    const totalCost = attributes.totalCost || 0;
                    const discountAmount = attributes.discountAmount || 0;
                    const trackingType = getTrackingType(relationship);

                    return (
                      <TableRow key={relationship._id || index}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            {getMeasurementIcon(trackingType)}
                            <Typography sx={{ ml: 1 }}>
                              {itemName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{formatMeasurement(relationship)}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(costPerUnit)}
                        </TableCell>
                        <TableCell align="right">
                          {discountAmount > 0
                            ? formatCurrency(discountAmount)
                            : "-"}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(totalCost)}
                        </TableCell>
                        <TableCell>
                          {item && (
                            <Tooltip title="View Item">
                              <IconButton
                                size="small"
                                component={RouterLink}
                                to={`/inventory/${itemId}`}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ py: 2 }}
              >
                No items in this purchase.
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Payment Summary" />
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body1">Subtotal</Typography>
                <Typography variant="body1">
                  {formatCurrency(purchase.subtotal || 0)}
                </Typography>
              </Box>
              {(purchase.discountAmount || 0) > 0 && (
                <Box sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1
                }}>
                  <Typography variant="body1">Discount</Typography>
                  <Typography variant="body1" color="error">
                    -{formatCurrency(purchase.discountAmount || 0)}
                  </Typography>
                </Box>
              )}
              {(purchase.taxAmount || 0) > 0 && (
                <Box sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1
                }}>
                  <Typography variant="body1">
                    Tax ({purchase.taxRate || 0}%)
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(purchase.taxAmount || 0)}
                  </Typography>
                </Box>
              )}
              {(purchase.shippingCost || 0) > 0 && (
                <Box sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1
                }}>
                  <Typography variant="body1">Shipping</Typography>
                  <Typography variant="body1">
                    {formatCurrency(purchase.shippingCost || 0)}
                  </Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(purchase.total || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardHeader title="Purchase Information" />
            <CardContent>
              <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1
              }}>
                <Typography variant="body2" color="text.secondary">
                  Purchase ID
                </Typography>
                <Typography variant="body2">
                  {purchase._id?.substring(0, 10) || "N/A"}
                </Typography>
              </Box>
              <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1
              }}>
                <Typography variant="body2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body2">
                  {purchase.createdAt ? formatDate(purchase.createdAt) : "N/A"}
                </Typography>
              </Box>
              <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1
              }}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2">
                  {purchase.updatedAt ? formatDate(purchase.updatedAt) : "N/A"}
                </Typography>
              </Box>
              <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1
              }}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <StatusChip status={purchase.status} size="small" />
              </Box>
              <Box sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 1
              }}>
                <Typography variant="body2" color="text.secondary">
                  Items Count
                </Typography>
                <Typography variant="body2">
                  {cleanRelationshipItems.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
