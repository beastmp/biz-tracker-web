import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from "@mui/material";
import { Sync as SyncIcon } from "@mui/icons-material";
import useRelationships, { ConversionJobStatus } from "@/hooks/useRelationships";

export default function ConvertRelationshipsButton() {
  const { convertAllRelationships, getConversionJobStatus } = useRelationships();
  const [converting, setConverting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<ConversionJobStatus | null>(null);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll for job status updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (jobId && showProgressDialog) {
      intervalId = setInterval(async () => {
        try {
          const status = await getConversionJobStatus(jobId);
          setJobStatus(status);

          // If job is complete or failed, stop polling
          if (status.status === "completed" || status.status === "failed") {
            if (intervalId) clearInterval(intervalId);
          }
        } catch (error) {
          console.error("Error fetching job status:", error);
          setError("Failed to update conversion progress. Please try again.");
          if (intervalId) clearInterval(intervalId);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId, showProgressDialog, getConversionJobStatus]);

  const handleOpenConfirmDialog = () => {
    setShowConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setShowConfirmDialog(false);
  };

  const handleConvertAllRelationships = async () => {
    setConverting(true);
    setShowConfirmDialog(false);
    setError(null);

    try {
      const result = await convertAllRelationships();

      if (result.success && result.jobId) {
        setJobId(result.jobId);
        setShowProgressDialog(true);

        // Get initial job status
        const initialStatus = await getConversionJobStatus(result.jobId);
        setJobStatus(initialStatus);
      } else {
        setError("Failed to start conversion process. Please try again.");
      }
    } catch (error) {
      console.error("Error converting relationships:", error);
      setError("Failed to start conversion process. Please try again.");
    } finally {
      setConverting(false);
    }
  };

  const handleCloseProgressDialog = useCallback(() => {
    // Only allow closing if the job is complete or failed
    if (!jobStatus || jobStatus.status === "completed" || jobStatus.status === "failed") {
      setShowProgressDialog(false);
      setJobId(null);
      setJobStatus(null);
    }
  }, [jobStatus]);

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        onClick={handleOpenConfirmDialog}
        disabled={converting}
        startIcon={converting ? <CircularProgress size={20} /> : <SyncIcon />}
        size="small"
      >
        {converting ? "Converting..." : "Convert all relationships"}
      </Button>

      {/* Confirmation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>Convert All Relationships</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will convert all existing legacy relationships to the new relationship model.
            This process may take some time to complete.
            <br /><br />
            This operation is useful for migrating from the old relationship
            structure to the new one. Once completed, you can safely remove
            the old relationship fields from your entities.
            <br /><br />
            Do you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button
            onClick={handleConvertAllRelationships}
            variant="contained"
            color="primary"
            startIcon={<SyncIcon />}
          >
            Convert Relationships
          </Button>
        </DialogActions>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog
        open={showProgressDialog}
        onClose={handleCloseProgressDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Relationship Conversion
          {jobStatus?.status === "completed" && " - Complete"}
          {jobStatus?.status === "failed" && " - Failed"}
          {jobStatus?.status === "running" && " - In Progress"}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {jobStatus && (
            <Box>
              {jobStatus.status === "running" && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    Current phase: {jobStatus.progress.currentPhase}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress
                      variant="determinate"
                      value={jobStatus.progress.percentComplete}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                    <Typography variant="body2" align="right" color="text.secondary">
                      {Math.round(jobStatus.progress.percentComplete)}%
                    </Typography>
                  </Box>
                </>
              )}

              {(jobStatus.status === "completed" || jobStatus.status === "failed") && (
                <Alert
                  severity={
                    jobStatus.status === "failed"
                      ? "error"
                      : jobStatus.progress.totalErrors > 0
                      ? "warning"
                      : "success"
                  }
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle1">
                    {jobStatus.status === "failed"
                      ? `Conversion failed: ${jobStatus.error || "Unknown error"}`
                      : `${jobStatus.progress.totalConverted} relationships successfully converted
                      ${jobStatus.progress.totalErrors > 0
                          ? ` with ${jobStatus.progress.totalErrors} errors`
                          : ""}`}
                  </Typography>
                </Alert>
              )}

              <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                Conversion Details
              </Typography>

              <List>
                <ListItem divider>
                  <ListItemText
                    primary="Inventory Items"
                    secondary={`${jobStatus.progress.items.converted} converted, ${jobStatus.progress.items.errors} errors`}
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText
                    primary="Purchases"
                    secondary={`${jobStatus.progress.purchases.converted} converted, ${jobStatus.progress.purchases.errors} errors`}
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText
                    primary="Sales"
                    secondary={`${jobStatus.progress.sales.converted} converted, ${jobStatus.progress.sales.errors} errors`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Assets"
                    secondary={`${jobStatus.progress.assets.converted} converted, ${jobStatus.progress.assets.errors} errors`}
                  />
                </ListItem>
              </List>

              {jobStatus.status !== "running" && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Started: {new Date(jobStatus.startTime).toLocaleString()}
                  </Typography>
                  {jobStatus.endTime && (
                    <Typography variant="body2" color="text.secondary">
                      Completed: {new Date(jobStatus.endTime).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseProgressDialog}
            variant="contained"
            disabled={jobStatus?.status === "running"}
          >
            {jobStatus?.status === "running" ? "Please wait..." : "Close"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}