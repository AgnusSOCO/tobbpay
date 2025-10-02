import { useEffect, useState } from 'react';
import { Play, Trash2, RefreshCw } from 'lucide-react';
import { supabase, ScheduledCharge } from '../lib/supabase';

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
        .from('scheduled_charges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCharges(data || []);
    } catch (error) {
      console.error('Error loading scheduled charges:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeCharge = async (chargeId: string) => {
    setProcessing(true);
    try {
      const charge = charges.find(c => c.id === chargeId);
      if (!charge) return;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-charge`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chargeId }),
      });

      if (!response.ok) {
        throw new Error('Error al procesar el cargo');
      }

      await loadCharges();
    } catch (error: any) {
      alert(error.message || 'Error al ejecutar el cargo');
    } finally {
      setProcessing(false);
    }
  };

  const deleteCharge = async (chargeId: string) => {
    if (!confirm('¿Está seguro de eliminar este cargo programado?')) return;

    try {
      const { error } = await supabase
        .from('scheduled_charges')
        .delete()
        .eq('id', chargeId);

      if (error) throw error;
      await loadCharges();
    } catch (error: any) {
      alert(error.message || 'Error al eliminar el cargo');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    const labels = {
      pending: 'Pendiente',
      processing: 'Procesando',
      completed: 'Completado',
      failed: 'Fallido',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando cargos programados...</div>
      </div>
    );
  }

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
                  Lote
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Intentos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Próximo Intento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {charges.length > 0 ? (
                charges.map((charge) => (
                  <tr key={charge.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {charge.batch_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {charge.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${charge.amount.toFixed(2)} {charge.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {charge.current_attempt} / {charge.retry_attempts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(charge.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {charge.next_attempt_at ? (
                        new Date(charge.next_attempt_at).toLocaleString('es-MX')
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {charge.status === 'pending' && (
                          <button
                            onClick={() => executeCharge(charge.id)}
                            disabled={processing}
                            className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                            title="Ejecutar cargo"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteCharge(charge.id)}
                          className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
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
        <div className="text-sm text-gray-600">
          Total de cargos programados: {charges.length}
        </div>
      </div>
    </div>
  );
}
