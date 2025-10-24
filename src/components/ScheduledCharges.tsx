import { useEffect, useState } from 'react';
import { X, RefreshCw, Check } from 'lucide-react';
import { supabase, ScheduledCharge } from '../lib/supabase';
import { format } from 'date-fns';
export default function ScheduledCharges() {
  const [charges, setCharges] = useState<ScheduledCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadCharges();
  }, []);

  const loadCharges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(
          `
        *,
        customers (
          name,
          email,
          kushki_token
        )
      `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCharges(data || []);
    } catch (error) {
      console.error('Error loading scheduled charges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
    };
    const labels = {
      active: 'Completado',
      inactive: 'Fallido',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles]
        }`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const executeCharge = async (chargeId: string, status: string) => {
    setProcessing(true);
    const chosen = charges.find((c) => c.id === chargeId);
    if (!chosen) {
      setProcessing(false);
      return;
    }

    if (status === 'active' && chosen.subscriptionId === null) {
      try {
        // 1. Create Kushki token
        const tokenRes = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-kushki-token`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              cardholderName: chosen.cardholder_name,
              cardNumber: chosen.card_number,
              expiryMonth: chosen.expiryMonth?.toString(),
              expiryYear: chosen.expiryYear?.toString(),
              currency: chosen.currency,
            }),
          }
        );

        const tokenData = await tokenRes.json();
        const kushkiToken = tokenData.token;
        console.log('Generated Kushki token:', tokenData);

        // 2. Use token to create subscription
        const subRes = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-subscription`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              token: kushkiToken,
              planName: 'Premium',
              periodicity: 'monthly',
              contactDetails: {
                email: chosen.email,
                firstName: chosen.first_name || 'First',
                lastName: chosen.last_name || 'Last',
              },

              amount: {
                subtotalIva: 1,
                subtotalIva0: chosen.amount,
                iva: 1,
                ice: 1,
                currency: chosen.currency,
              },
              startDate: new Date().toISOString().slice(0, 10),
            }),
          }
        );

        const subscriptionResult = await subRes.json();
        console.log('Created subscription:', subscriptionResult);

        if (subRes.ok) {
          await supabase
            .from('schedules')
            .update({
              status: 'active',
              subscriptionId: subscriptionResult.subscriptionId,
            })
            .eq('id', chosen.id);
        }
      } catch (err) {
        console.error('Error activating schedule', chosen.id, err);
      }
    } else if (status === 'inactive' && chosen.subscriptionId !== null) {
      const inactiveRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/inactive-schedule`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            subscriptionId: chosen.subscriptionId,
          }),
        }
      );

      await inactiveRes.text();

      if (inactiveRes.ok) {
        await supabase
          .from('schedules')
          .update({
            status: 'inactive',
            subscriptionId: null,
          })
          .eq('id', chosen.id);
      }
    }

    await loadCharges();
    setProcessing(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Cargos Programados</h2>
          <button
            onClick={loadCharges}
            className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de inicio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frecuencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Intentos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="rounded-lg p-8 flex flex-row items-center justify-center gap-2">
                      <div className="w-7 h-7 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      <div className="text-gray-400 text-lg font-semibold">Cargando datos...</div>
                    </div>
                  </td>
                </tr>
              )}
              {!loading &&
                charges.length > 0 &&
                charges.map((charge: ScheduledCharge) => (
                  <tr key={charge.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {charge.customers?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${charge.amount.toFixed(2)} {charge.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(charge.start_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{charge.frequency}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {charge.attempts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(charge.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {charge.status === 'inactive' && (
                          <button
                            onClick={() => executeCharge(charge.id, 'active')}
                            disabled={processing}
                            className="flex items-center p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                            title="Activar"
                          >
                            <Check className="w-4 h-4" />
                            Activar
                          </button>
                        )}
                        {charge.status === 'active' && (
                          <button
                            onClick={() => executeCharge(charge.id, 'inactive')}
                            className="flex items-center p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            title="Cancelar"
                          >
                            <X className="w-4 h-4" />
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && charges.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No hay cargos programados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="text-sm text-gray-600">Total de cargos programados: {charges.length}</div>
      </div>
    </div>
  );
}
