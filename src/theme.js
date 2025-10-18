// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FFC107', // Amarillo
      light: '#FFF350',
      dark: '#C79100',
      contrastText: '#000',
    },
    secondary: {
      main: '#FFB300', // Ámbar (amarillo profundo)
      light: '#FFD54F',
      dark: '#C66900',
      contrastText: '#000',
    },
    background: {
      default: '#F5F5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#333333',
      secondary: '#757575',
    },
    success: {
      main: '#4CAF50',
    },
    warning: {
      main: '#FF9800',
    },
    info: {
      main: '#2196F3',
    },
    error: {
      main: '#F44336',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 500,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.5rem',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;