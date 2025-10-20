import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logOut } from '../pages/auth/authSlice';
import type { RootState } from './store';

interface GetRequestsParams {
  statuses?: number[];
  searchTerm?: string;
  inboxCategory?: string;
  actionRequiredOnly?: boolean;
}

interface GetReportParams {
  startDate: string;
  endDate: string;
}

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
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
  tagTypes: ['Comments', 'Request', 'Users', 'Settings', 'Lookups', 'Notifications', 'InboxCounts', 'DesignerNotes'],
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
      invalidatesTags: [{ type: 'Request', id: 'LIST' }, 'InboxCounts'],
    }),
    // ... تمام endpoint های دیگر شما ...
    getDashboardStats: builder.query<any, void>({ query: () => '/requests/dashboard-stats' }),
    // getRequests: builder.query<any[], void>({ query: () => '/requests', providesTags: ['Request'] }),
    getRequests: builder.query<any[], GetRequestsParams>({
        query: (params) => {
            const queryParams = new URLSearchParams();
            if (params.statuses && params.statuses.length > 0) {
              params.statuses.forEach(status => queryParams.append('statuses', status.toString()));
            }
            if (params.searchTerm)
              queryParams.append('searchTerm', params.searchTerm);
            if (params.inboxCategory)
              queryParams.append('inboxCategory', params.inboxCategory);
            if (params.actionRequiredOnly)
              queryParams.append('actionRequiredOnly', 'true');
            return `/requests?${queryParams.toString()}`;
        },
        providesTags: (result) => 
            result
                ? [
                    ...result.map(({ id }) => ({ type: 'Request' as const, id })),
                    { type: 'Request', id: 'LIST' }
                  ]
                : [{ type: 'Request', id: 'LIST' }],
    }),
    getRequestById: builder.query<any, number>({ query: (id) => `/requests/${id}`, providesTags: (result, error, id) => [{ type: 'Request', id }] }),
    getInboxCounts: builder.query<Record<string, number>, void>({ 
      query: () => '/requests/inbox-counts',
      providesTags: ['InboxCounts']
    }),
    markInboxAsViewed: builder.mutation<void, string>({
      query: (inboxCategory) => ({
        url: '/requests/mark-inbox-viewed',
        method: 'POST',
        body: JSON.stringify(inboxCategory),
        headers: { 'Content-Type': 'application/json' }
      }),
      invalidatesTags: [{ type: 'Request', id: 'LIST' }, 'InboxCounts']
    }),
    markRequestAsViewed: builder.mutation<void, number>({
      query: (requestId) => ({
        url: `/requests/${requestId}/mark-viewed`,
        method: 'POST'
      }),
      invalidatesTags: (result, error, requestId) => [
        { type: 'Request', id: requestId },
        { type: 'Request', id: 'LIST' },
        'InboxCounts'
      ]
    }),
    getLookupLists: builder.query<string[], void>({ query: () => '/lookup' }),
    getRequestComments: builder.query<any[], number>({ query: (id) => `/requests/${id}/comments`, providesTags: ['Comments'] }),
    addComment: builder.mutation<any, { requestId: number; content: string }>({ 
        query: ({ requestId, content }) => ({ url: `/requests/${requestId}/comments`, method: 'POST', body: { content } }), 
        invalidatesTags: (result, error, arg) => [
            'Comments', 
            { type: 'Request', id: arg.requestId },
            { type: 'Request', id: 'LIST' },
            'InboxCounts'
        ]
    }),
    assignRequest: builder.mutation<any, { requestId: number; designerId: string }>({ 
        query: ({ requestId, designerId }) => ({ url: `/requests/${requestId}/assign`, method: 'PATCH', body: { designerId } }), 
        invalidatesTags: (result, error, arg) => [
            { type: 'Request', id: arg.requestId }, 
            { type: 'Request', id: 'LIST' },
            'InboxCounts'
        ] 
    }),
    startDesign: builder.mutation<any, { requestId: number }>({
        query: ({ requestId }) => ({
            url: `/requests/${requestId}/start-design`,
            method: 'PATCH',
        }),
        invalidatesTags: (result, error, arg) => [
            { type: 'Request', id: arg.requestId }, 
            { type: 'Request', id: 'LIST' },
            'InboxCounts'
        ],
    }),
    returnRequest: builder.mutation<any, FormData>({
        query: (formData) => ({
            url: `/requests/${formData.get('requestId')}/return`,
            method: 'PATCH',
            body: formData,
        }),
        invalidatesTags: (result, error, arg) => [
            { type: 'Request', id: Number(arg.get('requestId')) },
            { type: 'Request', id: 'LIST' },
            'InboxCounts'
        ],
    }),
    completeDesign: builder.mutation<any, FormData>({
      query: (formData) => {
          const requestId = formData.get('requestId');
          return {
              url: `/requests/${requestId}/complete-design`,
              method: 'PATCH',
              body: formData,
          };
      },
      invalidatesTags: (result, error, arg) => [
          { type: 'Request', id: Number(arg.get('requestId')) }, 
          { type: 'Request', id: 'LIST' },
          'InboxCounts'
      ],
    }),
    processApproval: builder.mutation<any, FormData>({
        query: (formData) => ({
            url: `/requests/${formData.get('requestId')}/process-approval`,
            method: 'PATCH',
            body: formData,
        }),
        invalidatesTags: (result, error, arg) => [
            { type: 'Request', id: Number(arg.get('requestId')) }, 
            { type: 'Request', id: 'LIST' },
            'InboxCounts'
        ],
    }),
    resubmitRequest: builder.mutation<any, { requestId: number }>({ 
        query: ({ requestId }) => ({ url: `/requests/${requestId}/resubmit`, method: 'PATCH', }), 
        invalidatesTags: (result, error, arg) => [
            { type: 'Request', id: arg.requestId }, 
            { type: 'Request', id: 'LIST' },
            'InboxCounts'
        ] 
    }),
    resubmitForApproval: builder.mutation<any, { requestId: number }>({ 
        query: ({ requestId }) => ({ url: `/requests/${requestId}/resubmit-for-approval`, method: 'PATCH', }), 
        invalidatesTags: (result, error, arg) => [
            { type: 'Request', id: arg.requestId }, 
            { type: 'Request', id: 'LIST' },
            'InboxCounts'
        ] 
    }),
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
    // Public endpoint for non-admin users to access capacity and date range settings
    getPublicSettings: builder.query<any[], void>({
      query: () => '/settings/public',
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
        query: () => '/lookup/designers',
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
    getDesignerPerformanceReport: builder.query<any[], GetReportParams>({
      query: ({ startDate, endDate }) => `/admin/reports/designer-performance?startDate=${startDate}&endDate=${endDate}`,
    }),
    getApprovers: builder.query<any[], void>({
        query: () => '/lookup/approvers',
    }),
    updateRequest: builder.mutation<any, { requestId: number; data: FormData }>({
        query: ({ requestId, data }) => ({
            url: `/requests/${requestId}`,
            method: 'PUT',
            body: data,
        }),
        invalidatesTags: (result, error, arg) => [
            { type: 'Request', id: arg.requestId },
            { type: 'Request', id: 'LIST' },
            'InboxCounts'
        ],
    }),
    createUser: builder.mutation<any, any>({
        query: (newUser) => ({
            url: '/admin/users',
            method: 'POST',
            body: newUser,
        }),
        invalidatesTags: ['Users'],
    }),

    toggleUserStatus: builder.mutation<any, string>({
        query: (userId) => ({
            url: `/admin/users/${userId}/toggle-status`,
            method: 'POST', // متد به POST تغییر کرد
        }),
        invalidatesTags: ['Users'],
    }),
    updateUser: builder.mutation<any, { userId: string; userData: any }>({
        query: ({ userId, userData }) => ({
            url: `/admin/users/${userId}`,
            method: 'PUT',
            body: userData,
        }),
        invalidatesTags: ['Users'],
    }),

    resetUserPassword: builder.mutation<any, { userId: string; newPassword: string; confirmPassword: string }>({
        query: ({ userId, newPassword, confirmPassword }) => ({
            url: `/admin/users/${userId}/reset-password`,
            method: 'POST',
            body: { newPassword, confirmPassword },
        }),
        invalidatesTags: ['Users'],
    }),

    // Notification endpoints
    getNotifications: builder.query<any[], void>({
        query: () => '/notifications',
        providesTags: ['Notifications'],
    }),
    getUnreadCount: builder.query<{ count: number }, void>({
        query: () => '/notifications/unread-count',
        providesTags: ['Notifications'],
    }),
    markAsRead: builder.mutation<void, number>({
        query: (notificationId) => ({
            url: `/notifications/${notificationId}/read`,
            method: 'PUT',
        }),
        invalidatesTags: ['Notifications'],
    }),
    markAllAsRead: builder.mutation<void, void>({
        query: () => ({
            url: '/notifications/read-all',
            method: 'PUT',
        }),
        invalidatesTags: ['Notifications'],
    }),

    // Designer Notes endpoints - Only accessible to designers
    getDesignerNotesForRequest: builder.query<any[], number>({
        query: (requestId) => `/designernotes/request/${requestId}`,
        providesTags: (result, error, requestId) => [{ type: 'DesignerNotes', id: requestId }],
    }),
    getDesignerNoteById: builder.query<any, number>({
        query: (noteId) => `/designernotes/${noteId}`,
        providesTags: (result, error, noteId) => [{ type: 'DesignerNotes', id: noteId }],
    }),
    createDesignerNote: builder.mutation<any, { requestId: number; noteText: string }>({
        query: ({ requestId, noteText }) => ({
            url: `/designernotes/request/${requestId}`,
            method: 'POST',
            body: { noteText },
        }),
        invalidatesTags: (result, error, { requestId }) => [{ type: 'DesignerNotes', id: requestId }],
    }),
    updateDesignerNote: builder.mutation<any, { noteId: number; noteText: string }>({
        query: ({ noteId, noteText }) => ({
            url: `/designernotes/${noteId}`,
            method: 'PUT',
            body: { noteText },
        }),
        invalidatesTags: (result, error, { noteId }) => [{ type: 'DesignerNotes', id: noteId }],
    }),
    deleteDesignerNote: builder.mutation<void, number>({
        query: (noteId) => ({
            url: `/designernotes/${noteId}`,
            method: 'DELETE',
        }),
        invalidatesTags: ['DesignerNotes'],
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
    useGetPublicSettingsQuery,
    useUpdateSystemSettingsMutation,
    useGetDesignersQuery,
    useGetLookupsQuery,
    useAddLookupItemMutation,
    useUpdateLookupItemMutation,
    useDeleteLookupItemMutation,
    useGetDesignerPerformanceReportQuery,
    useLazyGetDesignerPerformanceReportQuery,
    useGetApproversQuery,
    useUpdateRequestMutation,
    useCreateUserMutation,
    useToggleUserStatusMutation,
    useUpdateUserMutation,
    useResetUserPasswordMutation,
    useStartDesignMutation,
    useGetNotificationsQuery,
    useGetUnreadCountQuery,
    useMarkAsReadMutation,
    useMarkAllAsReadMutation,
    useGetInboxCountsQuery,
    useMarkInboxAsViewedMutation,
    useMarkRequestAsViewedMutation,
    useGetDesignerNotesForRequestQuery,
    useGetDesignerNoteByIdQuery,
    useCreateDesignerNoteMutation,
    useUpdateDesignerNoteMutation,
    useDeleteDesignerNoteMutation,
} = apiSlice;