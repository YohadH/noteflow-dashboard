import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async () => {
  const now = new Date().toISOString();

  const { data: emailActions, error } = await supabase
    .from('email_actions')
    .select('id, recipient, subject, body_preview, status, scheduled_at')
    .in('status', ['draft', 'pending'])
    .or(`scheduled_at.is.null,scheduled_at.lte.${now}`);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  for (const emailAction of emailActions || []) {
    try {
      // Integrate your email provider here. For now the worker only marks the job as sent.
      await supabase
        .from('email_actions')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', emailAction.id);
    } catch (deliveryError) {
      await supabase
        .from('email_actions')
        .update({
          status: 'failed',
          last_error: deliveryError instanceof Error ? deliveryError.message : 'Email delivery failed',
        })
        .eq('id', emailAction.id);
    }
  }

  return new Response(JSON.stringify({ processed: emailActions?.length || 0 }), { status: 200 });
});
