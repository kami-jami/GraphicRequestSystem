import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logOut } from '../pages/auth/authSlice';
import type { RootState } from './store';

interface GetRequestsParams {
  status?: number | '';
  searchTerm?: string;
}

const baseQuery = fetchBaseQuery({
  baseUrl: 'https://localhost:7088/api',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: typeof baseQuery = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    console.error('Unauthorized request:', result.error);
    // در آینده می‌توانیم اینجا کاربر را به صورت خودکار log out کنیم
    // api.dispatch(logOut());
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Comments', 'Request', 'Users', 'Settings', 'Lookups'],
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
    createRequest: builder.mutation<any, FormData>({
      query: (requestData) => ({
        url: '/requests',
        method: 'POST',
        body: requestData,
      }),
      invalidatesTags: ['Request'],
    }),
    // ... تمام endpoint های دیگر شما ...
    getDashboardStats: builder.query<any, void>({ query: () => '/admin/dashboard' }),
    // getRequests: builder.query<any[], void>({ query: () => '/requests', providesTags: ['Request'] }),
    getRequests: builder.query<any[], GetRequestsParams>({
        query: (params) => {
            const queryParams = new URLSearchParams();
            if (params.status) queryParams.append('status', params.status.toString());
            if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
            return `/requests?${queryParams.toString()}`;
        },
        providesTags: ['Request'],
    }),
    getRequestById: builder.query<any, number>({ query: (id) => `/requests/${id}`, providesTags: (result, error, id) => [{ type: 'Request', id }] }),
    getLookupLists: builder.query<string[], void>({ query: () => '/lookup' }),
    getRequestComments: builder.query<any[], number>({ query: (id) => `/requests/${id}/comments`, providesTags: ['Comments'] }),
    addComment: builder.mutation<any, { requestId: number; content: string }>({ query: ({ requestId, content }) => ({ url: `/requests/${requestId}/comments`, method: 'POST', body: { content } }), invalidatesTags: ['Comments'] }),
    assignRequest: builder.mutation<any, { requestId: number; designerId: string }>({ query: ({ requestId, designerId }) => ({ url: `/requests/${requestId}/assign`, method: 'PATCH', body: { designerId } }), invalidatesTags: (result, error, arg) => [{ type: 'Request', id: arg.requestId }] }),
    returnRequest: builder.mutation<any, { requestId: number; actorId: string; comment: string }>({ query: ({ requestId, ...body }) => ({ url: `/requests/${requestId}/return`, method: 'PATCH', body, }), invalidatesTags: (result, error, arg) => [{ type: 'Request', id: arg.requestId }] }),
    completeDesign: builder.mutation<any, { requestId: number; actorId: string; needsApproval: boolean; approverId?: string; comment?: string }>({ query: ({ requestId, ...body }) => ({ url: `/requests/${requestId}/complete-design`, method: 'PATCH', body, }), invalidatesTags: (result, error, arg) => [{ type: 'Request', id: arg.requestId }] }),
    processApproval: builder.mutation<any, { requestId: number; actorId: string; isApproved: boolean; comment?: string }>({ query: ({ requestId, ...body }) => ({ url: `/requests/${requestId}/process-approval`, method: 'PATCH', body, }), invalidatesTags: (result, error, arg) => [{ type: 'Request', id: arg.requestId }] }),
    resubmitRequest: builder.mutation<any, { requestId: number }>({ query: ({ requestId }) => ({ url: `/requests/${requestId}/resubmit`, method: 'PATCH', }), invalidatesTags: (result, error, arg) => [{ type: 'Request', id: arg.requestId }] }),
    resubmitForApproval: builder.mutation<any, { requestId: number }>({ query: ({ requestId }) => ({ url: `/requests/${requestId}/resubmit-for-approval`, method: 'PATCH', }), invalidatesTags: (result, error, arg) => [{ type: 'Request', id: arg.requestId }] }),
    getAvailability: builder.query<any[], { startDate: string; endDate: string }>({ query: ({ startDate, endDate }) => `/availability?startDate=${startDate}&endDate=${endDate}` }),
    getUsersWithRoles: builder.query<any[], void>({
    query: () => '/admin/users',
    providesTags: ['Users'], // یک تگ جدید برای مدیریت کاربران
    }),

    updateUserRoles: builder.mutation<any, { userId: string; roles: string[] }>({
        query: ({ userId, roles }) => ({
            url: `/admin/users/${userId}/roles`,
            method: 'POST',
            body: { roles },
        }),
        invalidatesTags: ['Users'], // بعد از تغییر نقش، لیست کاربران را دوباره واکشی کن
    }),

    getSystemSettings: builder.query<any[], void>({
      query: () => '/admin/settings',
      providesTags: ['Settings'],
    }),
    updateSystemSettings: builder.mutation<any, any[]>({
        query: (settings) => ({
          url: '/admin/settings',
          method: 'PUT',
          body: settings,
        }),
        invalidatesTags: ['Settings'],
    }),
    getDesigners: builder.query<any[], void>({
        query: () => '/admin/designers',
    }),

    getLookups: builder.query<any[], void>({
      query: () => '/lookup',
      providesTags: ['Lookups'],
    }),
    // getLookupItems از قبل وجود دارد، اما providesTags آن را اصلاح می‌کنیم
    getLookupItems: builder.query<any[], number>({
      query: (lookupId) => `/lookup/${lookupId}/items`,
      providesTags: (result, error, lookupId) => [{ type: 'Lookups', id: lookupId }],
    }),
    addLookupItem: builder.mutation<any, { lookupId: number; value: string }>({
      query: ({ lookupId, value }) => ({
        url: `/admin/lookups/${lookupId}/items`,
        method: 'POST',
        body: { value },
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Lookups', id: arg.lookupId }],
    }),
    updateLookupItem: builder.mutation<any, { itemId: number; value: string }>({
      query: ({ itemId, value }) => ({
        url: `/admin/lookup-items/${itemId}`,
        method: 'PUT',
        body: { value },
      }),
      invalidatesTags: (result, error, arg) => (result ? [{ type: 'Lookups', id: result.lookupId }] : []),
    }),
    deleteLookupItem: builder.mutation<any, { itemId: number; lookupId: number }>({
      query: ({ itemId }) => ({
        url: `/admin/lookup-items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, arg) => [{ type: 'Lookups', id: arg.lookupId }],
    }),
  }),
});

export const {
    useLoginMutation,
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
    useGetAvailabilityQuery,
    useGetUsersWithRolesQuery,
    useUpdateUserRolesMutation,
    useGetSystemSettingsQuery,
    useUpdateSystemSettingsMutation,
    useGetDesignersQuery,
    useGetLookupsQuery,
    useAddLookupItemMutation,
    useUpdateLookupItemMutation,
    useDeleteLookupItemMutation,
} = apiSlice;