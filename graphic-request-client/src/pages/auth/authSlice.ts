import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../services/store';
import { jwtDecode } from 'jwt-decode';

type UserState = {
    username: string | null;
    firstName: string | null;
    lastName: string | null; 
    roles: string[] | null;
    id: string | null;
};

type AuthState = {
  user: UserState | null;
  token: string | null;
};

// یک تابع کمکی برای decode کردن و نرمال‌سازی توکن
const decodeAndNormalizeToken = (token: string): UserState | null => {
  try {
    const decoded: any = jwtDecode(token);

    let roles = decoded.role; 
    if (typeof roles === 'string') {
        roles = [roles];
    }
    const userId = decoded.id || decoded.nameid || decoded.sub;
    return {
        username: decoded.username || decoded.name,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        roles: roles,
        id: userId,
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

const userToken = localStorage.getItem('userToken');

const initialState: AuthState = {
  token: userToken ? userToken : null,
  user: userToken ? decodeAndNormalizeToken(userToken) : null,
};

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      { payload: { token } }: PayloadAction<{ token: string }>
    ) => {
      state.token = token;
      localStorage.setItem('userToken', token);
      state.user = decodeAndNormalizeToken(token);
    },
    logOut: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem('userToken');
    },
  },
});

export const { setCredentials, logOut } = slice.actions;
export default slice.reducer;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectCurrentUserToken = (state: RootState) => state.auth.token;