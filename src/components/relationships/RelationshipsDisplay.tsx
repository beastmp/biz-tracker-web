import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import useRelationships from "../../hooks/useRelationships";
import {
  EntityType,
  RelationshipType,
  Relationship,
  Item,
  isPopulatedItem,
  Purchase,
  Sale,
  BusinessAsset
} from "../../types/models";
import { useItems } from "../../hooks/useItems";
import { usePurchases } from "../../hooks/usePurchases";
import { useSales } from "../../hooks/useSales";
import { useAssets } from "../../hooks/useAssets";

interface RelationshipsDisplayProps {
  entityId: string;
  entityType: EntityType;
  title?: string;
  allowConversion?: boolean;
  onRelationshipChange?: () => void;
}

const RelationshipsDisplay: React.FC<RelationshipsDisplayProps> = ({
  entityId,
  entityType,
  title = "Relationships",
  allowConversion = true,
  onRelationshipChange,
}) => {
  const {
    getRelationshipsByPrimary,
    getRelationshipsBySecondary,
    convertLegacyRelationships,
    loading: relationshipsLoading,
    error: relationshipsError
  } = useRelationships();

  const { items, loading: itemsLoading, error: itemsError, getItemById } = useItems();
  const { purchases, loading: purchasesLoading, error: purchasesError, getPurchaseById } = usePurchases();
  const { sales, loading: salesLoading, error: salesError, getSaleById } = useSales();
  const { assets, loading: assetsLoading, error: assetsError, getAssetById } = useAssets();

  const [primaryRelationships, setPrimaryRelationships] = useState<Relationship[]>([]);
  const [secondaryRelationships, setSecondaryRelationships] = useState<Relationship[]>([]);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState<any>(null);

  const fetchRelationships = async () => {
    try {
      const primaryRels = await getRelationshipsByPrimary(entityId, entityType);
      const secondaryRels = await getRelationshipsBySecondary(entityId, entityType);

      setPrimaryRelationships(primaryRels);
      setSecondaryRelationships(secondaryRels);
    } catch (error) {
      console.error("Error fetching relationships:", error);
    }
  };

  useEffect(() => {
    if (entityId && entityType) {
      fetchRelationships();
    }
  }, [entityId, entityType]);

  const handleConvertRelationships = async () => {
    try {
      setConverting(true);
      const result = await convertLegacyRelationships(entityId, entityType);
      setConversionResult(result);

      // Refresh relationships
      await fetchRelationships();

      if (onRelationshipChange) {
        onRelationshipChange();
      }

      setConverting(false);
      setConvertDialogOpen(false);
    } catch (error) {
      console.error("Error converting relationships:", error);
      setConverting(false);
    }
  };

  const getRelationshipTypeLabel = (type: RelationshipType): string => {
    switch (type) {
      case "derived": return "Derived From";
      case "product_material": return "Uses Material";
      case "purchase_item": return "Purchased Item";
      case "purchase_asset": return "Purchased Asset";
      case "sale_item": return "Sold Item";
      default: return type;
    }
  };

  const getEntityName = async (id: string, type: EntityType): Promise<string> => {
    try {
      switch (type) {
        case "Item": {
          const item = await getItemById(id);
          return item?.name || "Unknown Item";
        }
        case "Purchase": {
          const purchase = await getPurchaseById(id);
          return `Purchase #${purchase?._id || "Unknown"}`;
        }
        case "Sale": {
          const sale = await getSaleById(id);
          return `Sale #${sale?._id || "Unknown"}`;
        }
        case "Asset": {
          const asset = await getAssetById(id);
          return asset?.name || "Unknown Asset";
        }
        default:
          return "Unknown Entity";
      }
    } catch (error) {
      console.error(`Error getting entity name for ${type} ${id}:`, error);
      return "Error fetching entity";
    }
  };

  const loading = relationshipsLoading || itemsLoading || purchasesLoading ||
                  salesLoading || assetsLoading;
  const error = relationshipsError || itemsError || purchasesError ||
                salesError || assetsError;

  return (
    <Card variant="outlined" sx={{ mt: 2, mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">{title}</Typography>

          {allowConversion && (
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => setConvertDialogOpen(true)}
            >
              Convert Legacy Relationships
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {primaryRelationships.length === 0 && secondaryRelationships.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No relationships found.
              </Typography>
            ) : (
              <>
                {primaryRelationships.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="subtitle1">
                      Outgoing Relationships
                    </Typography>
                    <List>
                      {primaryRelationships.map((relationship) => (
                        <React.Fragment key={relationship._id}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center">
                                  <Typography variant="body1">
                                    {getRelationshipTypeLabel(relationship.relationshipType)}
                                  </Typography>
                                  {relationship.isLegacy && (
                                    <Chip
                                      label="Legacy"
                                      size="small"
                                      color="warning"
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <>
                                  <Typography component="span" variant="body2">
                                    To: {relationship.secondaryType}
                                    <Box component="span" fontWeight="bold">
                                      {" "}{relationship.secondaryId}
                                    </Box>
                                  </Typography>
                                  {relationship.measurements && (
                                    <Box mt={1}>
                                      {relationship.measurements.quantity > 0 && (
                                        <Typography variant="body2">
                                          Quantity: {relationship.measurements.quantity}
                                        </Typography>
                                      )}
                                      {relationship.measurements.weight > 0 && (
                                        <Typography variant="body2">
                                          Weight: {relationship.measurements.weight}
                                          {relationship.measurements.weightUnit}
                                        </Typography>
                                      )}
                                    </Box>
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>
                )}

                {secondaryRelationships.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1">
                      Incoming Relationships
                    </Typography>
                    <List>
                      {secondaryRelationships.map((relationship) => (
                        <React.Fragment key={relationship._id}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center">
                                  <Typography variant="body1">
                                    {getRelationshipTypeLabel(relationship.relationshipType)}
                                  </Typography>
                                  {relationship.isLegacy && (
                                    <Chip
                                      label="Legacy"
                                      size="small"
                                      color="warning"
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <>
                                  <Typography component="span" variant="body2">
                                    From: {relationship.primaryType}
                                    <Box component="span" fontWeight="bold">
                                      {" "}{relationship.primaryId}
                                    </Box>
                                  </Typography>
                                  {relationship.measurements && (
                                    <Box mt={1}>
                                      {relationship.measurements.quantity > 0 && (
                                        <Typography variant="body2">
                                          Quantity: {relationship.measurements.quantity}
                                        </Typography>
                                      )}
                                      {relationship.measurements.weight > 0 && (
                                        <Typography variant="body2">
                                          Weight: {relationship.measurements.weight}
                                          {relationship.measurements.weightUnit}
                                        </Typography>
                                      )}
                                    </Box>
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                    </List>
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </CardContent>

      {/* Convert Relationships Dialog */}
      <Dialog
        open={convertDialogOpen}
        onClose={() => setConvertDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Convert Legacy Relationships</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will convert all legacy relationships for this {entityType.toLowerCase()} to the new relationship model. This can't be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConvertDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleConvertRelationships}
            color="primary"
            variant="contained"
            disabled={converting}
            startIcon={converting ? <CircularProgress size={20} /> : null}
          >
            {converting ? "Converting..." : "Convert Relationships"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default RelationshipsDisplay;