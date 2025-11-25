import React, { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTicketsStore } from '../stores/useTicketsStore';
import { ticketApi } from '../lib/apiClient';
import { Ticket } from '../types/unified';
import { normalizeListResponse } from '../services/api/response-normalizer';
import { useAuthUser } from '../stores/useAuthStore';

/**
 * Hook to sync the tickets store with API data
 * This ensures the store is initialized with existing tickets
 * and stays in sync with the backend
 */
export function useTicketsStoreSync() {
  const user = useAuthUser();
  const { setTickets, setLoading } = useTicketsStore();

  // Only initialize once on authentication, not on every change
  const [hasInitialized, setHasInitialized] = React.useState(false);

  useEffect(() => {
    const initializeTickets = async () => {
      // Check if user is authenticated via Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session && user && !hasInitialized) {
        try {
          setLoading(true);

          // Fetch tickets from API - explicitly set high limit to get all tickets
          const response = await ticketApi.getTickets({
            limit: 10000, // Set a very high limit to get all tickets
          });

          // Set tickets in store using normalized response
          const { items } = normalizeListResponse<Ticket>(response.data);
          setTickets(items);
          setHasInitialized(true);
        } catch (error) {
          // Don't throw error, just log it - store will remain empty
        } finally {
          setLoading(false);
        }
      }
    };

    initializeTickets();
  }, [user, hasInitialized, setTickets, setLoading]);

  // Optional: Set up periodic refresh to keep data in sync
  // Note: Disabled to prevent duplication with WebSocket real-time updates
  // The store will be updated via WebSocket events instead of periodic polling
  // useEffect(() => {
  //   if (status === 'authenticated' && session?.accessToken) {
  //     const interval = setInterval(async () => {
  //       try {
  //         // Fetch tickets from API - explicitly set high limit to get all tickets
  //         const response = await ticketApi.getTickets({
  //           limit: 10000, // Set a very high limit to get all tickets
  //         });

  //         // Use the same data structure handling as initial load
  //         let tickets: Ticket[] = [];
  //         console.log('🔄 Refresh - Raw API Response:', response);

  //         if (
  //           response.data?.data?.data &&
  //           Array.isArray(response.data.data.data)
  //         ) {
  //           tickets = response.data.data.data;
  //           console.log('✅ Refresh - Using response.data.data.data structure');
  //         } else if (response.data?.data && Array.isArray(response.data.data)) {
  //           tickets = response.data.data;
  //           console.log('✅ Refresh - Using response.data.data structure');
  //         } else if (response.data && Array.isArray(response.data)) {
  //           tickets = response.data;
  //           console.log('✅ Refresh - Using response.data structure');
  //         } else {
  //           console.warn('⚠️ Refresh - No valid ticket data found in response');
  //         }

  //         setTickets(tickets);
  //         console.log('🔄 Tickets Store Sync - Refreshed:', tickets.length, 'tickets');
  //       } catch (error) {
  //         console.error('❌ Tickets Store Sync Refresh Error:', error);
  //         // Don't clear existing tickets on error - keep current state
  //       }
  //     }, TIMING_CONFIG.STORE_SYNC_INTERVAL); // Refresh every minute

  //     return () => clearInterval(interval);
  //   }
  // }, [status, session?.accessToken, setTickets]);
}
