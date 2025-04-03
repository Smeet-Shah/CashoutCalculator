import React, { useState, useMemo } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  AppBar,
  Toolbar,
  CssBaseline,
  ThemeProvider,
  createTheme,
  IconButton,
  useMediaQuery,
  Switch,
  Tooltip
} from '@mui/material';
import BettingForm from './components/BettingForm';
import ResultsDisplay from './components/ResultsDisplay';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import CalculateIcon from '@mui/icons-material/Calculate';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(prefersDarkMode ? 'dark' : 'light');
  
  // Toggle theme
  const toggleTheme = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };
  
  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#90caf9' : '#1e88e5',
        light: mode === 'dark' ? '#c3fdff' : '#6ab7ff',
        dark: mode === 'dark' ? '#5d99c6' : '#005cb2',
        contrastText: mode === 'dark' ? '#000000' : '#ffffff',
      },
      secondary: {
        main: mode === 'dark' ? '#ffab40' : '#ff6d00',
        light: mode === 'dark' ? '#ffdd71' : '#ff9e40',
        dark: mode === 'dark' ? '#c77c02' : '#c43c00',
        contrastText: mode === 'dark' ? '#000000' : '#ffffff',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#f5f5f5',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      success: {
        main: mode === 'dark' ? '#66bb6a' : '#43a047',
      },
      warning: {
        main: mode === 'dark' ? '#ffca28' : '#ffa000',
      },
      error: {
        main: mode === 'dark' ? '#ef5350' : '#e53935',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 500,
      },
      h6: {
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'dark' 
              ? '0 8px 24px rgba(0, 0, 0, 0.4)'
              : '0 8px 24px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: mode === 'dark' 
                ? '0 12px 28px rgba(0, 0, 0, 0.5)' 
                : '0 12px 28px rgba(0, 0, 0, 0.15)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 8,
            padding: '8px 16px',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: mode === 'dark' 
                ? '0 4px 12px rgba(144, 202, 249, 0.3)' 
                : '0 4px 12px rgba(30, 136, 229, 0.3)',
            },
          },
          contained: {
            boxShadow: mode === 'dark' 
              ? '0 3px 8px rgba(0, 0, 0, 0.5)' 
              : '0 3px 8px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            height: 8,
          }
        }
      },
    },
  }), [mode]);

  const calculateEV = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/calculate-ev`, formData);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred calculating expected value');
      console.error('Error calculating EV:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOdds = async (params) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/odds`, { params });
      return response.data;
    } catch (err) {
      console.error('Error fetching odds:', err);
      throw new Error(err.response?.data?.message || 'Failed to fetch current odds');
    }
  };

  const fetchEvents = async (params) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/events`, { params });
      return response.data;
    } catch (err) {
      console.error('Error fetching events:', err);
      throw new Error(err.response?.data?.message || 'Failed to fetch events');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        background: mode === 'dark' 
          ? 'linear-gradient(to bottom right, #121212, #1e1e1e)' 
          : 'linear-gradient(to bottom right, #f5f7fa, #e4e7eb)',
        flexGrow: 1,
        transition: 'background 0.5s ease' 
      }}>
        <AppBar 
          position="sticky" 
          elevation={0} 
          sx={{ 
            backdropFilter: 'blur(10px)',
            backgroundColor: mode === 'dark' 
              ? 'rgba(30, 30, 30, 0.8)' 
              : 'rgba(255, 255, 255, 0.8)',
            color: 'primary.main' 
          }}
        >
          <Toolbar>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center'
              }}
            >
              <CalculateIcon sx={{ fontSize: 28, mr: 1.5 }} />
              <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                Cashout Calculator
              </Typography>
            </Box>
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton onClick={toggleTheme} color="primary" sx={{ ml: 1 }}>
                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
          <Paper 
            elevation={3}
            sx={{ 
              p: { xs: 2, sm: 4 }, 
              mb: 4, 
              borderRadius: 3,
              border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
            }}
          >
            <BettingForm 
              onSubmit={calculateEV} 
              fetchOdds={fetchOdds} 
              fetchEvents={fetchEvents}
              loading={loading} 
            />
          </Paper>
          
          {error && (
            <Paper 
              elevation={3}
              sx={{ 
                p: 3, 
                mb: 4, 
                bgcolor: mode === 'dark' ? 'rgba(244, 67, 54, 0.2)' : '#ffebee', 
                borderRadius: 3,
                border: mode === 'dark' ? '1px solid rgba(244, 67, 54, 0.3)' : 'none'
              }}
            >
              <Typography color="error">{error}</Typography>
            </Paper>
          )}
          
          {results && !error && (
            <Paper 
              elevation={3}
              sx={{ 
                p: { xs: 2, sm: 4 }, 
                borderRadius: 3,
                border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
              }}
            >
              <ResultsDisplay results={results} />
            </Paper>
          )}
          
          <Box
            sx={{
              mt: 4,
              textAlign: 'center',
              opacity: 0.7,
              color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
            }}
          >
            <Typography variant="body2">
              Gamble with stats not luck. But don't gamble.
            </Typography>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App; 