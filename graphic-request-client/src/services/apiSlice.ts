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
  tagTypes: ['Comments', 'Request'],
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
      providesTags: (result, error, id) => [{ type: 'Request', id }],
    }),
    getRequestComments: builder.query<any[], number>({
        query: (id) => `/requests/${id}/comments`,
        providesTags: ['Comments'], 
    }),
    addComment: builder.mutation<any, { requestId: number; content: string }>({
        query: ({ requestId, content }) => ({
            url: `/requests/${requestId}/comments`,
            method: 'POST',
            body: { content },
        }),
        invalidatesTags: ['Comments'], 
    }),
    createRequest: builder.mutation<any, FormData>({ 
      query: (requestData) => ({
          url: '/requests',
          method: 'POST',
          body: requestData,
          formData: true, 
      }),
    }),

    assignRequest: builder.mutation<any, { requestId: number; designerId: string }>({
      query: ({ requestId, designerId }) => ({
        url: `/requests/${requestId}/assign`,
        method: 'PATCH',
        body: { designerId },
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Request', id: arg.requestId }],
    }),
    returnRequest: builder.mutation<any, { requestId: number; actorId: string; comment: string }>({
      query: ({ requestId, ...body }) => ({
        url: `/requests/${requestId}/return`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Request', id: arg.requestId }],
    }),
    completeDesign: builder.mutation<any, { requestId: number; actorId: string; needsApproval: boolean; approverId?: string; comment?: string }>({
      query: ({ requestId, ...body }) => ({
        url: `/requests/${requestId}/complete-design`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Request', id: arg.requestId }],
    }),
    processApproval: builder.mutation<any, { requestId: number; actorId: string; isApproved: boolean; comment?: string }>({
      query: ({ requestId, ...body }) => ({
        url: `/requests/${requestId}/process-approval`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Request', id: arg.requestId }],
    }),

    resubmitRequest: builder.mutation<any, { requestId: number }>({
        query: ({ requestId }) => ({
            url: `/requests/${requestId}/resubmit`,
            method: 'PATCH',
        }),
        invalidatesTags: (result, error, arg) => [{ type: 'Request', id: arg.requestId }],
    }),

    resubmitForApproval: builder.mutation<any, { requestId: number }>({
        query: ({ requestId }) => ({
            url: `/requests/${requestId}/resubmit-for-approval`,
            method: 'PATCH',
        }),
        invalidatesTags: (result, error, arg) => [{ type: 'Request', id: arg.requestId }],
    }),

    getAvailability: builder.query<any[], { startDate: string; endDate: string }>({
        query: ({ startDate, endDate }) => `/availability?startDate=${startDate}&endDate=${endDate}`,
    }),

  }),
});

export const { useLoginMutation, 
  useGetDashboardStatsQuery,
  useGetRequestsQuery,
  useGetLookupListsQuery,
  useGetLookupItemsQuery,
  useCreateRequestMutation,
  useGetRequestByIdQuery,
  useGetRequestCommentsQuery,
  useAddCommentMutation,
  useAssignRequestMutation,
  useReturnRequestMutation,
  useCompleteDesignMutation,
  useProcessApprovalMutation,
  useResubmitRequestMutation,
  useResubmitForApprovalMutation,
  useGetAvailabilityQuery
} = apiSlice;