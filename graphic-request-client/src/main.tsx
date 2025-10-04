import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme/theme.ts';
import { CssBaseline } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import stylisRTLPlugin from 'stylis-plugin-rtl';

import { Provider } from 'react-redux';
import { store } from './services/store';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMomentJalaali } from '@mui/x-date-pickers/AdapterMomentJalaali';


import moment from 'moment-jalaali';

moment.loadPersian({ dialect: 'persian-modern', usePersianDigits: true });
// document.documentElement.setAttribute('dir', 'rtl');

const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [stylisRTLPlugin],
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}> {/* <--- این کامپوننت را اضافه کنید */}
      <CacheProvider value={cacheRtl}>
        <LocalizationProvider
          dateAdapter={AdapterMomentJalaali}
          adapterLocale="fa"
          dateFormats={{
            year: 'jYYYY',
            month: 'jMMMM',
            normalDate: 'jYYYY/jMM/jDD',
            shortDate: 'jYY/jMM/jDD',
            keyboardDate: 'jYYYY/jMM/jDD',
          }}
        >
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ThemeProvider>
        </LocalizationProvider>
      </CacheProvider>
    </Provider>
  </React.StrictMode>
);