import { Container, Typography, Box, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import { Home as HomeIcon, ArrowBack, Search } from '@mui/icons-material';

export default function NotFound() {
  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }} className="fade-in">
      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          py: 6,
          px: { xs: 3, md: 6 },
          background: theme => `radial-gradient(circle, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          boxShadow: theme => `0 10px 40px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          fontWeight="bold"
          sx={{
            fontSize: { xs: '7rem', md: '10rem' },
            bgGradient: 'linear(to-l, #7928CA, #FF0080)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          404
        </Typography>

        <Typography
          variant="h4"
          component="h2"
          fontWeight="medium"
          gutterBottom
          sx={{ mb: 2 }}
        >
          Page Not Found
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          paragraph
          sx={{
            maxWidth: '600px',
            mx: 'auto',
            mb: 4
          }}
        >
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'center',
            gap: 2,
            mt: 4
          }}
        >
          <Button
            variant="contained"
            component={Link}
            to="/"
            startIcon={<HomeIcon />}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: 'medium',
              fontSize: '1rem'
            }}
          >
            Go to Dashboard
          </Button>
          <Button
            variant="outlined"
            onClick={() => window.history.back()}
            startIcon={<ArrowBack />}
            sx={{
              px: 4,
              py: 1.5
            }}
          >
            Go Back
          </Button>
        </Box>

        <Box
          component="form"
          action="/search"
          sx={{
            mt: 6,
            maxWidth: '450px',
            mx: 'auto',
            position: 'relative',
            display: 'flex'
          }}
        >
          <Button
            type="submit"
            variant="contained"
            sx={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              minWidth: 'auto',
              px: 2
            }}
          >
            <Search />
          </Button>
          <input
            type="text"
            name="q"
            placeholder="Search for items, sales, or purchases..."
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '1rem',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              outline: 'none'
            }}
          />
        </Box>
      </Paper>
    </Container>
  );
}