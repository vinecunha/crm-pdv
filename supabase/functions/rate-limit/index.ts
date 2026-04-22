// supabase/functions/rate-limit/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS inline
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MAX_ATTEMPTS = 5
const BLOCK_DURATION = 15 * 60 * 1000 // 15 minutos

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, identifier, success } = await req.json()
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const now = Date.now()

    if (action === 'check') {
      const { data } = await supabaseAdmin
        .from('login_rate_limits')
        .select('*')
        .eq('identifier', identifier)
        .maybeSingle()

      if (data) {
        const isBlocked = data.blocked_until && now < new Date(data.blocked_until).getTime()
        const remainingAttempts = Math.max(0, MAX_ATTEMPTS - (data.attempts || 0))
        const timeRemaining = data.blocked_until 
          ? Math.ceil((new Date(data.blocked_until).getTime() - now) / 60000)
          : 0

        // Limpar se o bloqueio expirou
        if (data.blocked_until && now >= new Date(data.blocked_until).getTime()) {
          await supabaseAdmin
            .from('login_rate_limits')
            .delete()
            .eq('identifier', identifier)
        }

        return new Response(
          JSON.stringify({ isBlocked, remainingAttempts, timeRemaining }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ isBlocked: false, remainingAttempts: MAX_ATTEMPTS, timeRemaining: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'record') {
      if (success) {
        await supabaseAdmin
          .from('login_rate_limits')
          .delete()
          .eq('identifier', identifier)

        return new Response(
          JSON.stringify({ success: true, cleared: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data: existing } = await supabaseAdmin
        .from('login_rate_limits')
        .select('*')
        .eq('identifier', identifier)
        .maybeSingle()

      if (existing) {
        const newAttempts = (existing.attempts || 0) + 1
        const blockedUntil = newAttempts >= MAX_ATTEMPTS 
          ? new Date(now + BLOCK_DURATION).toISOString()
          : null

        await supabaseAdmin
          .from('login_rate_limits')
          .update({
            attempts: newAttempts,
            blocked_until: blockedUntil,
            updated_at: new Date().toISOString()
          })
          .eq('identifier', identifier)

        return new Response(
          JSON.stringify({
            success: true,
            attempts: newAttempts,
            isBlocked: newAttempts >= MAX_ATTEMPTS,
            remainingAttempts: Math.max(0, MAX_ATTEMPTS - newAttempts)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        await supabaseAdmin
          .from('login_rate_limits')
          .insert({
            identifier,
            attempts: 1,
            blocked_until: null,
            first_attempt: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        return new Response(
          JSON.stringify({
            success: true,
            attempts: 1,
            isBlocked: false,
            remainingAttempts: MAX_ATTEMPTS - 1
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})