import { useEffect, useState } from 'react';
import { supabase, Transaction } from '../lib/supabase';
import { BarChart3, DollarSign, TrendingUp, PieChart } from 'lucide-react';

type DashboardStats = {
  approvedToday: number;
  salesAmountToday: number;
  monthlyComparison: { month: string; amount: number }[];
  approvalRate: number;
  rejectionRate: number;
  bankStats: { bank: string; count: number }[];
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    approvedToday: 0,
    salesAmountToday: 0,
    monthlyComparison: [],
    approvalRate: 0,
    rejectionRate: 0,
    bankStats: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      if (transactions) {
        const todayTransactions = transactions.filter(
          (t: Transaction) => new Date(t.transaction_date) >= today
        );

        const approvedToday = todayTransactions.filter((t: Transaction) => t.status === 'approved').length;
        const salesAmountToday = todayTransactions
          .filter((t: Transaction) => t.status === 'approved')
          .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);

        const approved = transactions.filter((t: Transaction) => t.status === 'approved').length;
        const rejected = transactions.filter((t: Transaction) => t.status === 'rejected').length;
        const total = transactions.length || 1;

        const approvalRate = (approved / total) * 100;
        const rejectionRate = (rejected / total) * 100;

        const monthlyData = calculateMonthlyComparison(transactions);

        const bankCounts = transactions.reduce((acc: Record<string, number>, t: Transaction) => {
          if (t.bank_name && t.status === 'approved') {
            acc[t.bank_name] = (acc[t.bank_name] || 0) + 1;
          }
          return acc;
        }, {});

        const bankStats = Object.entries(bankCounts)
          .map(([bank, count]) => ({ bank, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          approvedToday,
          salesAmountToday,
          monthlyComparison: monthlyData,
          approvalRate,
          rejectionRate,
          bankStats,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyComparison = (transactions: Transaction[]) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyData: Record<number, number> = {};

    transactions
      .filter((t: Transaction) => t.status === 'approved')
      .forEach((t: Transaction) => {
        const month = new Date(t.transaction_date).getMonth();
        monthlyData[month] = (monthlyData[month] || 0) + Number(t.amount);
      });

    return months.map((month, index) => ({
      month,
      amount: monthlyData[index] || 0,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando estadísticas...</div>
      </div>
    );
  }

  const maxMonthlyAmount = Math.max(...stats.monthlyComparison.map(m => m.amount), 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Transacciones Aprobadas Hoy</p>
              <p className="text-3xl font-bold mt-2">{stats.approvedToday}</p>
            </div>
            <BarChart3 className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Monto de Venta Hoy</p>
              <p className="text-3xl font-bold mt-2">${stats.salesAmountToday.toFixed(2)}</p>
            </div>
            <DollarSign className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Tasa de Aprobación</p>
              <p className="text-3xl font-bold mt-2">{stats.approvalRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas por Mes</h3>
          <div className="space-y-2">
            {stats.monthlyComparison.map((month, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{month.month}</span>
                  <span className="text-gray-900 font-medium">${month.amount.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(month.amount / maxMonthlyAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Porcentaje de Aceptación/Rechazo</h3>
          <div className="flex items-center justify-center h-64">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="32"
                  strokeDasharray={`${(stats.approvalRate / 100) * 502.4} 502.4`}
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="32"
                  strokeDasharray={`${(stats.rejectionRate / 100) * 502.4} 502.4`}
                  strokeDashoffset={`-${(stats.approvalRate / 100) * 502.4}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <PieChart className="w-12 h-12 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span className="text-sm text-gray-600">Aprobadas: {stats.approvalRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span className="text-sm text-gray-600">Rechazadas: {stats.rejectionRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Aceptación por Banco</h3>
        <div className="space-y-3">
          {stats.bankStats.length > 0 ? (
            stats.bankStats.map((bank, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-32 text-sm text-gray-600 font-medium">{bank.bank}</div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${(bank.count / stats.bankStats[0].count) * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium">{bank.count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">No hay datos disponibles</p>
          )}
        </div>
      </div>
    </div>
  );
}
