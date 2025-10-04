import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../services/store';

type AuthState = {
  token: string | null;
};

const slice = createSlice({
  name: 'auth',
  initialState: { token: null } as AuthState,
  reducers: {
    setCredentials: (
      state,
      { payload: { token } }: PayloadAction<{ token: string }>
    ) => {
      state.token = token;
    },
    logOut: (state) => {
      state.token = null;
    },
  },
});

export const { setCredentials, logOut } = slice.actions;
export default slice.reducer;
export const selectCurrentUserToken = (state: RootState) => state.auth.token;