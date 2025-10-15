import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { chargeId } = await req.json();

    if (!chargeId) {
      throw new Error('chargeId is required');
    }

    const { data: charge, error: fetchError } = await supabase
      .from('scheduled_charges')
      .select('*')
      .eq('id', chargeId)
      .maybeSingle();

    if (fetchError || !charge) {
      throw new Error('Charge not found');
    }

    await supabase.from('scheduled_charges').update({ status: 'processing' }).eq('id', chargeId);

    const kushkiPublicKey = Deno.env.get('KUSHKI_PUBLIC_KEY') || 'test-key';
    const kushkiPrivateKey = Deno.env.get('KUSHKI_PRIVATE_KEY') || 'test-private-key';

    const tokenResponse = await fetch('https://api.kushkipagos.com/card/v1/tokens', {
      method: 'POST',
      headers: {
        'Public-Merchant-Id': kushkiPublicKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        card: {
          name: charge.customer_name,
          number: charge.card_number,
          expiryMonth: charge.card_expiry_month,
          expiryYear: charge.card_expiry_year,
          cvc: charge.cvv,
        },
        totalAmount: charge.amount,
        currency: charge.currency,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.token) {
      throw new Error('Failed to generate Kushki token');
    }

    const chargeResponse = await fetch('https://api.kushkipagos.com/card/v1/charges', {
      method: 'POST',
      headers: {
        'Private-Merchant-Id': kushkiPrivateKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: tokenData.token,
        amount: {
          subtotalIva: 0,
          subtotalIva0: charge.amount,
          ice: 0,
          iva: 0,
          currency: charge.currency,
        },
      }),
    });

    const chargeData = await chargeResponse.json();

    const status = chargeData.approved ? 'approved' : 'rejected';
    const isoCode = chargeData.responseCode || chargeData.processorResponseCode;

    const isoMessages: Record<string, string> = {
      '00': 'Transacción Aprobada',
      '05': 'Tarjeta sin Fondos',
      '51': 'Fondos Insuficientes',
      '54': 'Tarjeta Expirada',
    };

    await supabase.from('transactions').insert({
      customer_name: charge.customer_name,
      amount: charge.amount,
      currency: charge.currency,
      card_number: charge.card_number.slice(-4),
      bin_code: charge.card_number.slice(0, 6),
      bank_name: chargeData.processor || 'Unknown',
      status,
      iso_code: isoCode,
      iso_message: isoMessages[isoCode] || `Código ISO: ${isoCode}`,
      kushki_token: tokenData.token,
      kushki_transaction_id: chargeData.ticketNumber,
      merchant_id: kushkiPublicKey,
      transaction_date: new Date().toISOString(),
    });

    if (status === 'approved') {
      await supabase
        .from('scheduled_charges')
        .update({ status: 'completed', current_attempt: charge.current_attempt + 1 })
        .eq('id', chargeId);
    } else {
      const shouldRetry = charge.current_attempt < charge.retry_attempts;

      if (shouldRetry) {
        const nextAttempt = new Date();
        nextAttempt.setMinutes(nextAttempt.getMinutes() + charge.retry_interval_minutes);

        await supabase
          .from('scheduled_charges')
          .update({
            status: 'pending',
            current_attempt: charge.current_attempt + 1,
            last_attempt_at: new Date().toISOString(),
            next_attempt_at: nextAttempt.toISOString(),
          })
          .eq('id', chargeId);
      } else {
        await supabase
          .from('scheduled_charges')
          .update({ status: 'failed', current_attempt: charge.current_attempt + 1 })
          .eq('id', chargeId);
      }
    }

    return new Response(
      JSON.stringify({ success: true, status, transactionId: chargeData.ticketNumber }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error processing charge:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});
