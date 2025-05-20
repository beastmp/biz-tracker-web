import { Button, Paper, Typography, Box } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { RefreshOutlined, HomeOutlined } from "@mui/icons-material";

/**
 * Props for the ErrorFallback component
 *
 * @interface ErrorFallbackProps
 * @property {Error | null} error - The error that was caught
 * @property {() => void} [resetErrorBoundary] - Function to reset the error boundary
 * @property {string} [message] - Custom error message to display
 */
interface ErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary?: () => void;
  message?: string;
}

/**
 * Component to display when an error occurs in the application
 *
 * @param {ErrorFallbackProps} props - Component props
 * @returns {JSX.Element} Error fallback UI
 */
export default function ErrorFallback({
  error,
  resetErrorBoundary,
  message = "Something went wrong"
}: ErrorFallbackProps) {
  // Try to get the navigate function, but it might not be available if rendered outside Router context
  /**
   * Navigation function from React Router
   * @type {import("react-router-dom").NavigateFunction | undefined}
   */
  let navigate: import("react-router-dom").NavigateFunction | undefined;
  try {
    navigate = useNavigate();
  } catch (e) {
    // If useNavigate fails, navigate will remain undefined
    console.warn("ErrorFallback: Router context not available");
  }

  /**
   * Handles navigation to home when router context isn't available
   */
  const handleHomeNavigation = () => {
    if (navigate) {
      navigate("/");
    } else {
      // Fallback to basic navigation if Router context isn't available
      window.location.href = "/";
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        maxWidth: 500,
        mx: "auto",
        my: 4
      }}
    >
      <Typography variant="h5" color="error" gutterBottom>
        {message}
      </Typography>

      {error && (
        <Typography
          variant="body2"
          color="text.secondary"
          component="pre"
          sx={{
            mb: 3,
            p: 2,
            backgroundColor: "grey.100",
            borderRadius: 1,
            overflow: "auto",
            maxWidth: "100%"
          }}
        >
          {error.message}
        </Typography>
      )}

      <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
        {resetErrorBoundary && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshOutlined />}
            onClick={resetErrorBoundary}
          >
            Try Again
          </Button>
        )}

        {navigate ? (
          <Button
            variant="outlined"
            component={RouterLink}
            to="/"
            startIcon={<HomeOutlined />}
            sx={{ textDecoration: "none" }}
          >
            Go to Dashboard
          </Button>
        ) : (
          <Button
            variant="outlined"
            onClick={handleHomeNavigation}
            startIcon={<HomeOutlined />}
          >
            Go to Dashboard
          </Button>
        )}
      </Box>
    </Paper>
  );
}
