import React, { useState, useEffect, useCallback } from "react";
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
  Tooltip,
} from "@mui/material";
import useRelationships from "../../hooks/useRelationships";
import {
  EntityType,
  RelationshipType,
  Relationship,
  RelationshipMeasurement,
  Item,
  Sale,
  Purchase,
  BusinessAsset
} from "../../types/models";
import { get } from "@utils/apiClient";

/**
 * Props for the RelationshipsDisplay component
 */
interface RelationshipsDisplayProps {
  /** ID of the entity to display relationships for */
  entityId: string;
  /** Type of entity (Item, Purchase, Sale, Asset) */
  entityType: EntityType;
  /** Optional title for the relationships card */
  title?: string;
  /** Whether to allow conversion of legacy relationships */
  allowConversion?: boolean;
  /** Callback to invoke when relationships change */
  onRelationshipChange?: () => void;
}

/**
 * Component to display relationships for an entity
 * Shows both outgoing (primary) and incoming (secondary) relationships
 */
const RelationshipsDisplay: React.FC<RelationshipsDisplayProps> = ({
  entityId,
  entityType,
  title = "Relationships",
  allowConversion = true,
  onRelationshipChange,
}) => {
  // Get relationship functions from the useRelationships hook
  const {
    getRelationshipsByPrimary,
    getRelationshipsBySecondary,
    convertLegacyRelationships,
    deleteRelationship,
    loading: relationshipsLoading,
    error: relationshipsError
  } = useRelationships();

  const [primaryRelationships, setPrimaryRelationships] = useState<Relationship[]>([]);
  const [secondaryRelationships, setSecondaryRelationships] = useState<Relationship[]>([]);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [relationshipToDelete, setRelationshipToDelete] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [conversionResult, setConversionResult] = useState<any>(null);
  const [entityNames, setEntityNames] = useState<Record<string, string>>({});
  const [loadingNames, setLoadingNames] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  /**
   * Fetches relationships for the specified entity
   */
  const fetchRelationships = useCallback(async () => {
    try {
      setFetchError(null);
      const primaryRels = await getRelationshipsByPrimary(entityId, entityType);
      const secondaryRels = await getRelationshipsBySecondary(entityId, entityType);

      setPrimaryRelationships(primaryRels);
      setSecondaryRelationships(secondaryRels);

      // Fetch names for all related entities
      fetchEntityNames([...primaryRels, ...secondaryRels]);
    } catch (error) {
      console.error("Error fetching relationships:", error);
      setFetchError(typeof error === "string" ? error : "Failed to fetch relationships");
    }
  }, [entityId, entityType, getRelationshipsByPrimary, getRelationshipsBySecondary]);

  /**
   * Loads relationships when entityId or entityType changes
   */
  useEffect(() => {
    if (entityId && entityType) {
      fetchRelationships();
    }
  }, [entityId, entityType, fetchRelationships]);

  /**
   * Handles the conversion of legacy relationships
   */
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
      setConversionResult({
        success: false,
        message: typeof error === "string" ? error : "Failed to convert relationships"
      });
    }
  };

  /**
   * Opens the delete confirmation dialog for a relationship
   * 
   * @param {string} relationshipId - The ID of the relationship to delete
   */
  const handleDeleteClick = (relationshipId: string) => {
    setRelationshipToDelete(relationshipId);
    setDeleteDialogOpen(true);
  };

  /**
   * Deletes a relationship and refreshes the view
   */
  const handleDeleteConfirm = async () => {
    if (!relationshipToDelete) return;
    
    try {
      setDeleting(true);
      await deleteRelationship(relationshipToDelete);
      await fetchRelationships();
      
      if (onRelationshipChange) {
        onRelationshipChange();
      }
      
      setDeleteDialogOpen(false);
      setRelationshipToDelete(null);
      setDeleting(false);
    } catch (error) {
      console.error("Error deleting relationship:", error);
      setDeleting(false);
    }
  };

  /**
   * Gets the name of an entity by its ID and type using API calls
   * 
   * @param {string} id - The ID of the entity
   * @param {EntityType} type - The type of the entity
   * @returns {Promise<string>} The name of the entity
   */
  const getEntityName = async (id: string, type: EntityType): Promise<string> => {
    try {
      switch (type) {
        case "Item": {
          const item = await get<Item>(`/items/${id}`);
          return item?.name || `Item ${id.substring(0, 8)}...`;
        }
        case "Purchase": {
          const purchase = await get<Purchase>(`/purchases/${id}`);
          return `Purchase ${purchase?.invoiceNumber || id.substring(0, 8)}...`;
        }
        case "Sale": {
          const sale = await get<Sale>(`/sales/${id}`);
          return `Sale ${sale?.orderNumber || id.substring(0, 8)}...`;
        }
        case "Asset": {
          const asset = await get<BusinessAsset>(`/assets/${id}`);
          return asset?.name || `Asset ${id.substring(0, 8)}...`;
        }
        default:
          return `${type} ${id.substring(0, 8)}...`;
      }
    } catch (error) {
      console.error(`Error getting entity name for ${type} ${id}:`, error);
      return `${type} ${id.substring(0, 8)}...`;
    }
  };

  /**
   * Fetches and caches entity names for all relationships
   * 
   * @param {Relationship[]} relationships - The relationships to fetch names for
   */
  const fetchEntityNames = async (relationships: Relationship[]) => {
    setLoadingNames(true);
    const nameMap: Record<string, string> = { ...entityNames };
    const entitiesToFetch: Array<{ id: string; type: EntityType }> = [];

    // Collect all entities that need names
    relationships.forEach(rel => {
      const primaryKey = `${rel.primaryType}-${rel.primaryId}`;
      const secondaryKey = `${rel.secondaryType}-${rel.secondaryId}`;

      if (!nameMap[primaryKey]) {
        entitiesToFetch.push({ id: rel.primaryId, type: rel.primaryType });
      }

      if (!nameMap[secondaryKey]) {
        entitiesToFetch.push({ id: rel.secondaryId, type: rel.secondaryType });
      }
    });

    // Fetch names in parallel
    const results = await Promise.all(
      entitiesToFetch.map(async ({ id, type }) => {
        const key = `${type}-${id}`;
        try {
          const name = await getEntityName(id, type);
          return { key, name };
        } catch (error) {
          console.error(`Error fetching name for ${type} ${id}:`, error);
          return { key, name: `${type} ${id.substring(0, 8)}...` };
        }
      })
    );

    // Update the name map
    results.forEach(({ key, name }) => {
      nameMap[key] = name;
    });

    setEntityNames(nameMap);
    setLoadingNames(false);
  };

  /**
   * Gets the cached entity name or returns a formatted ID if not available
   * 
   * @param {string} id - The ID of the entity
   * @param {EntityType} type - The type of the entity
   * @returns {string} The cached name of the entity or a formatted ID
   */
  const getEntityNameFromCache = (id: string, type: EntityType): string => {
    const key = `${type}-${id}`;
    return entityNames[key] || `${type} ${id.substring(0, 8)}...`;
  };

  /**
   * Gets a user-friendly label for a relationship type
   * 
   * @param {RelationshipType} type - The relationship type to get a label for
   * @returns {string} A user-friendly label for the relationship type
   */
  const getRelationshipTypeLabel = (type: RelationshipType): string => {
    switch (type) {
      case "derived": return "Derived From";
      case "product_material": return "Uses Material";
      case "purchase_item": return "Purchased Item";
      case "purchase_asset": return "Purchased Asset";
      case "sale_item": return "Sold Item";
      case "parent_child": return "Parent/Child";
      case "associated": return "Associated With";
      default: return type;
    }
  };

  /**
   * Renders the measurement details for a relationship
   * 
   * @param {RelationshipMeasurement} measurements - The measurements to display
   * @returns {React.ReactElement} The rendered measurement details
   */
  const renderMeasurements = (measurements: RelationshipMeasurement): React.ReactElement => {
    // Return empty fragment if measurements is not provided
    if (!measurements) return <></>;

    return (
      <Box mt={1}>
        {measurements.quantity !== undefined && measurements.quantity > 0 && (
          <Typography variant="body2">
            Quantity: {measurements.quantity}
          </Typography>
        )}
        {measurements.weight !== undefined && measurements.weight > 0 && (
          <Typography variant="body2">
            Weight: {measurements.weight} {measurements.weightUnit || ""}
          </Typography>
        )}
        {measurements.length !== undefined && measurements.length > 0 && (
          <Typography variant="body2">
            Length: {measurements.length} {measurements.lengthUnit || ""}
          </Typography>
        )}
        {measurements.area !== undefined && measurements.area > 0 && (
          <Typography variant="body2">
            Area: {measurements.area} {measurements.areaUnit || ""}
          </Typography>
        )}
        {measurements.volume !== undefined && measurements.volume > 0 && (
          <Typography variant="body2">
            Volume: {measurements.volume} {measurements.volumeUnit || ""}
          </Typography>
        )}
      </Box>
    );
  };

  /**
   * Renders attributes specific to a relationship type
   * 
   * @param {Relationship} relationship - The relationship to render attributes for
   * @returns {React.ReactElement} The rendered attributes
   */
  const renderAttributes = (relationship: Relationship): React.ReactElement => {
    switch (relationship.relationshipType) {
      case "purchase_item":
        if (relationship.purchaseItemAttributes) {
          return (
            <Box mt={1}>
              {relationship.purchaseItemAttributes.costPerUnit > 0 && (
                <Typography variant="body2">
                  Cost per unit: ${relationship.purchaseItemAttributes.costPerUnit.toFixed(2)}
                </Typography>
              )}
              {relationship.purchaseItemAttributes.totalCost > 0 && (
                <Typography variant="body2">
                  Total cost: ${relationship.purchaseItemAttributes.totalCost.toFixed(2)}
                </Typography>
              )}
              {relationship.purchaseItemAttributes.purchaseType && (
                <Typography variant="body2">
                  Type: {relationship.purchaseItemAttributes.purchaseType}
                </Typography>
              )}
            </Box>
          );
        }
        break;
      case "sale_item":
        if (relationship.saleItemAttributes) {
          return (
            <Box mt={1}>
              {relationship.saleItemAttributes.unitPrice > 0 && (
                <Typography variant="body2">
                  Unit price: ${relationship.saleItemAttributes.unitPrice.toFixed(2)}
                </Typography>
              )}
              {relationship.saleItemAttributes.totalPrice > 0 && (
                <Typography variant="body2">
                  Total price: ${relationship.saleItemAttributes.totalPrice.toFixed(2)}
                </Typography>
              )}
              {relationship.saleItemAttributes.discountAmount > 0 && (
                <Typography variant="body2">
                  Discount: ${relationship.saleItemAttributes.discountAmount.toFixed(2)}
                </Typography>
              )}
            </Box>
          );
        }
        break;
      default:
        return <></>;
    }
    return <></>;
  };

  const loading = relationshipsLoading || loadingNames;
  const error = relationshipsError || fetchError;

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

        {(loading && primaryRelationships.length === 0 && secondaryRelationships.length === 0) ? (
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
                          <ListItem
                            secondaryAction={
                              <Tooltip title="Delete relationship">
                                <Button
                                  color="error"
                                  size="small"
                                  onClick={() => handleDeleteClick(relationship._id as string)}
                                >
                                  Delete
                                </Button>
                              </Tooltip>
                            }
                          >
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
                                    To: {getEntityNameFromCache(
                                      relationship.secondaryId,
                                      relationship.secondaryType
                                    )}
                                  </Typography>
                                  {renderMeasurements(relationship.measurements as RelationshipMeasurement)}
                                  {renderAttributes(relationship)}
                                  {relationship.notes && (
                                    <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
                                      Notes: {relationship.notes}
                                    </Typography>
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
                          <ListItem
                            secondaryAction={
                              <Tooltip title="Delete relationship">
                                <Button
                                  color="error"
                                  size="small"
                                  onClick={() => handleDeleteClick(relationship._id as string)}
                                >
                                  Delete
                                </Button>
                              </Tooltip>
                            }
                          >
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
                                    From: {getEntityNameFromCache(
                                      relationship.primaryId,
                                      relationship.primaryType
                                    )}
                                  </Typography>
                                  {renderMeasurements(relationship.measurements as RelationshipMeasurement)}
                                  {renderAttributes(relationship)}
                                  {relationship.notes && (
                                    <Typography variant="body2" sx={{ mt: 1, fontStyle: "italic" }}>
                                      Notes: {relationship.notes}
                                    </Typography>
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
          {conversionResult && (
            <Alert 
              severity={conversionResult.success === false ? "error" : "info"} 
              sx={{ mt: 2 }}
            >
              {conversionResult.message || "Conversion completed"}
            </Alert>
          )}
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

      {/* Delete Relationship Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setRelationshipToDelete(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Relationship</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this relationship? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setRelationshipToDelete(null);
            }} 
            color="secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : null}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default RelationshipsDisplay;