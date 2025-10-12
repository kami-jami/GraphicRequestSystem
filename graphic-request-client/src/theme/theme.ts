import { createTheme } from '@mui/material/styles';
import Vazirmatn from '../assets/fonts/Vazirmatn-Regular.ttf';

const theme = createTheme({
  direction: 'rtl',
  palette: {
    primary: { main: '#005b96' },
    secondary: { main: '#6497b1' },
  },
  typography: {
    fontFamily: 'Vazirmatn, Arial',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @font-face {
          font-family: 'Vazirmatn';
          src: url(${Vazirmatn}) format('truetype');
        }
      `,
    },
  },
});

export default theme;