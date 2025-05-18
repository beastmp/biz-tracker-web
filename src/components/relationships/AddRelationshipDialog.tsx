import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import useRelationships from "../../hooks/useRelationships";
import { useItems } from "../../hooks/useItems";
import {
  Item,
  Relationship,
  RelationshipType,
  RelationshipMeasurement
} from "../../types/models";

interface AddRelationshipDialogProps {
  open: boolean;
  onClose: () => void;
  item: Item;
  onRelationshipAdded?: () => void;
}

const AddRelationshipDialog: React.FC<AddRelationshipDialogProps> = ({
  open,
  onClose,
  item,
  onRelationshipAdded,
}) => {
  const { createRelationship, loading: relationshipLoading, error } = useRelationships();
  /**
   * Get items data from useItems hook
   */
  const { data: items, isLoading: itemsLoading } = useItems();

  const [relationshipType, setRelationshipType] = useState<RelationshipType | "">("");
  const [targetItemId, setTargetItemId] = useState<string>("");
  const [measurements, setMeasurements] = useState<RelationshipMeasurement>({
    quantity: 0,
    weight: 0,
    weightUnit: "lb",
    length: 0,
    lengthUnit: "in",
    area: 0,
    areaUnit: "sqft",
    volume: 0,
    volumeUnit: "l",
  });
  const [notes, setNotes] = useState<string>("");
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");

  // These relationship types are valid for item-to-item relationships
  const validRelationshipTypes: RelationshipType[] = ["derived", "product_material"];

  const handleSubmit = async () => {
    if (!relationshipType || !targetItemId) {
      setSnackbarMessage("Please select a relationship type and target item");
      setSnackbarOpen(true);
      return;
    }

    try {
      let relationshipData: Partial<Relationship> = {
        measurements,
        notes,
      };

      if (relationshipType === "derived") {
        // Item is derived from target
        relationshipData = {
          ...relationshipData,
          primaryId: item._id as string,
          primaryType: "Item",
          secondaryId: targetItemId,
          secondaryType: "Item",
          relationshipType: "derived",
        };
      } else if (relationshipType === "product_material") {
        // Item uses target as material
        relationshipData = {
          ...relationshipData,
          primaryId: item._id as string,
          primaryType: "Item",
          secondaryId: targetItemId,
          secondaryType: "Item",
          relationshipType: "product_material",
        };
      }

      await createRelationship(relationshipData);
      setSnackbarMessage("Relationship created successfully!");
      setSnackbarOpen(true);

      // Reset form
      setRelationshipType("");
      setTargetItemId("");
      setMeasurements({
        quantity: 0,
        weight: 0,
        weightUnit: "lb",
        length: 0,
        lengthUnit: "in",
        area: 0,
        areaUnit: "sqft",
        volume: 0,
        volumeUnit: "l",
      });
      setNotes("");

      // Notify parent component
      if (onRelationshipAdded) {
        onRelationshipAdded();
      }

      // Close dialog
      onClose();
    } catch (err) {
      setSnackbarMessage(`Error creating relationship: ${err}`);
      setSnackbarOpen(true);
    }
  };

  const handleMeasurementChange = (
    field: keyof RelationshipMeasurement,
    value: any
  ) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getRelationshipTypeLabel = (type: RelationshipType): string => {
    switch (type) {
      case "derived": return "Derived From";
      case "product_material": return "Uses Material";
      default: return type;
    }
  };

  // Filter out the current item from the items list
  /**
   * Filters out the current item from the items list
   */
  const availableItems: Item[] = items ? items.filter((i: Item) => i._id !== item._id) : [];

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Add Relationship</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Create a relationship between {item.name} and another item.
          </DialogContentText>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Relationship Type</InputLabel>
                <Select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value as RelationshipType)}
                  label="Relationship Type"
                >
                  {validRelationshipTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {getRelationshipTypeLabel(type)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Target Item</InputLabel>
                <Select
                  value={targetItemId}
                  onChange={(e) => setTargetItemId(e.target.value as string)}
                  label="Target Item"
                  disabled={itemsLoading}
                >
                  {itemsLoading ? (
                    <MenuItem disabled>Loading items...</MenuItem>
                  ) : (
                    availableItems.map((targetItem) => (
                      <MenuItem key={targetItem._id} value={targetItem._id}>
                        {targetItem.name} ({targetItem.sku})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" gutterBottom>
                Measurements
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="Quantity"
                type="number"
                value={measurements.quantity}
                onChange={(e) => handleMeasurementChange(
                  "quantity",
                  parseFloat(e.target.value) || 0
                )}
                fullWidth
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                label="Weight"
                type="number"
                value={measurements.weight}
                onChange={(e) => handleMeasurementChange(
                  "weight",
                  parseFloat(e.target.value) || 0
                )}
                fullWidth
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Weight Unit</InputLabel>
                <Select
                  value={measurements.weightUnit || "lb"}
                  onChange={(e) => handleMeasurementChange(
                    "weightUnit",
                    e.target.value
                  )}
                  label="Weight Unit"
                >
                  <MenuItem value="oz">Ounces (oz)</MenuItem>
                  <MenuItem value="lb">Pounds (lb)</MenuItem>
                  <MenuItem value="g">Grams (g)</MenuItem>
                  <MenuItem value="kg">Kilograms (kg)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                rows={3}
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={relationshipLoading || !relationshipType || !targetItemId}
          >
            {relationshipLoading ? <CircularProgress size={24} /> : "Create Relationship"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
};

export default AddRelationshipDialog;