import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials } from '../pages/auth/authSlice';
import type { RootState } from './store';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://localhost:7088/api',
    prepareHeaders: (headers, { getState }) => {
      // توکن را از state بخوان
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/account/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials({ token: data.token }));
        } catch (error) {
          console.error('Failed to login: ', error);
        }
      },
    }),
    getDashboardStats: builder.query<any, void>({
      query: () => '/admin/dashboard',
    }),
    getRequests: builder.query<any[], void>({
      query: () => '/requests',
    }),
    getLookupLists: builder.query<string[], void>({
        query: () => '/lookup',
    }),
    getLookupItems: builder.query<any[], number>({
        query: (lookupId) => `/lookup/${lookupId}/items`,
    }),
    getRequestById: builder.query<any, number>({
        query: (id) => `/requests/${id}`,
    }),
    createRequest: builder.mutation<any, FormData>({ 
      query: (requestData) => ({
          url: '/requests',
          method: 'POST',
          body: requestData,
          formData: true, 
      }),
    }),
  }),
});

export const { useLoginMutation, 
  useGetDashboardStatsQuery,
  useGetRequestsQuery,
  useGetLookupListsQuery,
  useGetLookupItemsQuery,
  useCreateRequestMutation,
  useGetRequestByIdQuery
} = apiSlice;