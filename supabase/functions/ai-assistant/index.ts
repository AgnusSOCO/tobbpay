import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, context } = await req.json();

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY no está configurada');
    }

    const systemPrompt = `Eres un asistente inteligente para una plataforma de pagos llamada TOBB Pay. Tu trabajo es analizar datos de transacciones y ayudar a los usuarios a entender sus métricas de negocio.

Datos actuales del sistema:
- Transacciones aprobadas hoy: ${context.approvedToday}
- Monto de ventas hoy: $${context.salesAmountToday?.toFixed(2)}
- Tasa de aprobación: ${context.approvalRate?.toFixed(1)}%
- Tasa de rechazo: ${context.rejectionRate?.toFixed(1)}%
- Total de transacciones: ${context.totalTransactions}
- Transacción promedio: $${context.averageTransaction?.toFixed(2)}
- Hora pico: ${context.peakHour}:00
- Cargos pendientes: ${context.pendingCharges}
- Errores principales: ${context.topErrors?.map((e: any) => `ISO ${e.code}: ${e.message} (${e.count} ocurrencias)`).join(', ')}
- Top bancos: ${context.bankStats?.map((b: any) => `${b.bank}: $${b.amount.toFixed(2)}`).join(', ')}
- Monedas: ${context.currencyBreakdown?.map((c: any) => `${c.currency}: $${c.amount.toFixed(2)}`).join(', ')}

Responde de manera concisa, profesional y en español. Proporciona insights accionables basados en los datos. Si el usuario pregunta por métricas específicas, usa los datos exactos proporcionados. Si notas tendencias preocupantes (como tasas de rechazo altas), menciónalas proactivamente.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error('Error al comunicarse con OpenAI');
    }

    const openaiData = await openaiResponse.json();
    const assistantResponse = openaiData.choices[0]?.message?.content || 'No pude generar una respuesta.';

    return new Response(
      JSON.stringify({ response: assistantResponse }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});