import { useEffect, useState } from 'react';
import { Search, X, RefreshCw, Check } from 'lucide-react';
import { supabase, ScheduledCharge } from '../lib/supabase';
import { format, sub } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

type ExtendedScheduledCharge = ScheduledCharge & {
  response_code: string;
  response_text: string;
};

export default function ScheduledCharges() {
  const [charges, setCharges] = useState<ExtendedScheduledCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filteredCharges, setFilteredCharges] = useState<ExtendedScheduledCharge[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  useEffect(() => {
    loadCharges();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [charges, searchTerm]);

  const applyFilters = () => {
    let filtered = [...charges];

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          (t.response_code?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
          (t.response_text?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCharges(filtered);
  };

  const loadCharges = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];
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

      if (data.length > 0) {
        const result_charges = await Promise.all(
          data.map(async (s, i) => {
            const result_getting_transaction = await loadTransactionsAndGetRequiredField(
              firstDay,
              lastDay,
              s.subscriptionId || '19283723232'
            );

            return { ...s, ...result_getting_transaction };
          })
        );

        setCharges(result_charges);
      }
    } catch (error) {
      console.error('Error loading scheduled charges:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionsAndGetRequiredField = async (
    fromDate?: string,
    toDate?: string,
    subscription_id?: string
  ): Promise<{ response_code: string; response_text: string } | undefined> => {
    setLoading(true);

    try {
      const fromDateTime = new Date(fromDate ?? '');
      fromDateTime.setHours(0, 0, 0, 0);

      const toDateTime = new Date(toDate ?? '');
      toDateTime.setHours(23, 59, 59, 999);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            from_date: formatDate(String(fromDateTime)),
            to_date: formatDate(String(toDateTime)),
            subscription_id,
          }),
        }
      );

      const data = await response.json();
      const latest = data?.data?.[data.data.length - 1] ?? {};

      return {
        response_code: latest.response_code ?? '',
        response_text: latest.response_text ?? '',
      };
    } catch (error) {
      console.error('Error loading transactions:', error);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (initDate: string) => {
    const date = new Date(initDate);
    const formatted =
      date.getFullYear() +
      '-' +
      String(date.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(date.getDate()).padStart(2, '0') +
      'T' +
      String(date.getHours()).padStart(2, '0') +
      ':' +
      String(date.getMinutes()).padStart(2, '0') +
      ':' +
      String(date.getSeconds()).padStart(2, '0') +
      '.000';

    return formatted;
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

        if (subRes.ok && subscriptionResult.subscriptionId) {
          await supabase
            .from('schedules')
            .update({
              status: 'active',
              subscriptionId: subscriptionResult.subscriptionId,
            })
            .eq('id', chosen.id);
        } else {
          toast({
            variant: 'destructive',
            title: subscriptionResult.code,
            description: subscriptionResult?.message,
          });
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Cargos Programados</h2>

          <div className="flex items-center gap-3">
            {/* Search bar */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ISO o respuesta"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-w py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={loadCharges}
              className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <Toaster />

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
                  ISO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Respuesta
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
                filteredCharges.length > 0 &&
                filteredCharges.map((charge: ExtendedScheduledCharge) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {charge.response_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {charge.response_text}
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
              {!loading && filteredCharges.length === 0 && (
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
