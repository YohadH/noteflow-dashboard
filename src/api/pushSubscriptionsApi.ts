import { supabase, ensureSupabaseConfigured } from '@/lib/supabase/client';
import { getRequiredUserId } from './session';

export const pushSubscriptionsApi = {
  async save(subscription: PushSubscription): Promise<void> {
    ensureSupabaseConfigured();

    const userId = await getRequiredUserId();
    const payload = subscription.toJSON();

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        subscription: payload,
        user_agent: navigator.userAgent,
        last_used_at: new Date().toISOString(),
        last_error: null,
      },
      { onConflict: 'endpoint' },
    );

    if (error) {
      throw error;
    }
  },

  async remove(endpoint: string): Promise<void> {
    ensureSupabaseConfigured();

    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);

    if (error) {
      throw error;
    }
  },
};
