import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async () => {
  const now = new Date().toISOString();

  const { data: alerts, error } = await supabase
    .from('alerts')
    .select('id, note_id, channel, status, scheduled_at, notes:notes(id, title, content)')
    .in('status', ['active', 'scheduled'])
    .lte('scheduled_at', now);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  for (const alert of alerts || []) {
    try {
      // Hook your delivery provider here. A common next step is a webhook call to n8n.
      await supabase.from('alerts').update({ status: 'sent', last_error: null }).eq('id', alert.id);
    } catch (deliveryError) {
      await supabase
        .from('alerts')
        .update({
          status: 'failed',
          last_error: deliveryError instanceof Error ? deliveryError.message : 'Alert delivery failed',
        })
        .eq('id', alert.id);
    }
  }

  return new Response(JSON.stringify({ processed: alerts?.length || 0 }), { status: 200 });
});
