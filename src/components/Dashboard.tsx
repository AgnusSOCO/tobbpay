import { useEffect, useState } from 'react';
import { supabase, Transaction } from '../lib/supabase';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  CreditCard,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

type DashboardStats = {
  approvedToday: number;
  salesAmountToday: number;
  monthlyComparison: { month: string; amount: number; count: number }[];
  approvalRate: number;
  rejectionRate: number;
  bankStats: { bank: string; count: number; amount: number }[];
  hourlyStats: { hour: number; count: number }[];
  weeklyTrend: { day: string; approved: number; rejected: number }[];
  averageTransaction: number;
  totalTransactions: number;
  pendingCharges: number;
  topErrors: { code: string; message: string; count: number }[];
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    approvedToday: 0,
    salesAmountToday: 0,
    monthlyComparison: [],
    approvalRate: 0,
    rejectionRate: 0,
    bankStats: [],
    hourlyStats: [],
    weeklyTrend: [],
    averageTransaction: 0,
    totalTransactions: 0,
    pendingCharges: 0,
    topErrors: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [transactionsResult, scheduledResult] = await Promise.all([
        supabase.from('transactions').select('*').order('transaction_date', { ascending: false }),
        supabase.from('scheduled_charges').select('*').eq('status', 'pending')
      ]);

      const transactions = transactionsResult.data || [];
      const pendingCharges = scheduledResult.data?.length || 0;

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

      const totalAmount = transactions
        .filter((t: Transaction) => t.status === 'approved')
        .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);
      const averageTransaction = approved > 0 ? totalAmount / approved : 0;

      const monthlyData = calculateMonthlyComparison(transactions);
      const hourlyData = calculateHourlyStats(todayTransactions);
      const weeklyData = calculateWeeklyTrend(transactions);

      const bankCounts = transactions.reduce((acc: Record<string, { count: number; amount: number }>, t: Transaction) => {
        if (t.bank_name && t.status === 'approved') {
          if (!acc[t.bank_name]) {
            acc[t.bank_name] = { count: 0, amount: 0 };
          }
          acc[t.bank_name].count++;
          acc[t.bank_name].amount += Number(t.amount);
        }
        return acc;
      }, {});

      const bankStats = Object.entries(bankCounts)
        .map(([bank, data]) => ({ bank, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      const errorCounts = transactions
        .filter((t: Transaction) => t.status === 'rejected' && t.iso_code)
        .reduce((acc: Record<string, { message: string; count: number }>, t: Transaction) => {
          const code = t.iso_code!;
          if (!acc[code]) {
            acc[code] = { message: t.iso_message || code, count: 0 };
          }
          acc[code].count++;
          return acc;
        }, {});

      const topErrors = Object.entries(errorCounts)
        .map(([code, data]) => ({ code, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({
        approvedToday,
        salesAmountToday,
        monthlyComparison: monthlyData,
        approvalRate,
        rejectionRate,
        bankStats,
        hourlyStats: hourlyData,
        weeklyTrend: weeklyData,
        averageTransaction,
        totalTransactions: total,
        pendingCharges,
        topErrors,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyComparison = (transactions: Transaction[]) => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyData: Record<number, { amount: number; count: number }> = {};

    transactions
      .filter((t: Transaction) => t.status === 'approved')
      .forEach((t: Transaction) => {
        const month = new Date(t.transaction_date).getMonth();
        if (!monthlyData[month]) {
          monthlyData[month] = { amount: 0, count: 0 };
        }
        monthlyData[month].amount += Number(t.amount);
        monthlyData[month].count++;
      });

    return months.map((month, index) => ({
      month,
      amount: monthlyData[index]?.amount || 0,
      count: monthlyData[index]?.count || 0,
    }));
  };

  const calculateHourlyStats = (transactions: Transaction[]) => {
    const hourlyData: Record<number, number> = {};
    transactions.forEach((t: Transaction) => {
      const hour = new Date(t.transaction_date).getHours();
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    });

    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourlyData[i] || 0,
    }));
  };

  const calculateWeeklyTrend = (transactions: Transaction[]) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const weekData: Record<number, { approved: number; rejected: number }> = {};

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    transactions
      .filter((t: Transaction) => new Date(t.transaction_date) >= oneWeekAgo)
      .forEach((t: Transaction) => {
        const day = new Date(t.transaction_date).getDay();
        if (!weekData[day]) {
          weekData[day] = { approved: 0, rejected: 0 };
        }
        if (t.status === 'approved') weekData[day].approved++;
        if (t.status === 'rejected') weekData[day].rejected++;
      });

    return days.map((day, index) => ({
      day,
      approved: weekData[index]?.approved || 0,
      rejected: weekData[index]?.rejected || 0,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  const maxMonthlyAmount = Math.max(...stats.monthlyComparison.map(m => m.amount), 1);
  const maxHourlyCount = Math.max(...stats.hourlyStats.map(h => h.count), 1);
  const maxWeeklyCount = Math.max(
    ...stats.weeklyTrend.map(d => Math.max(d.approved, d.rejected)),
    1
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Resumen de actividad en tiempo real</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Activity className="w-4 h-4 animate-pulse text-green-500" />
          <span>Actualizado hace instantes</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-10 h-10" />
              <div className="bg-white bg-opacity-20 rounded-full px-3 py-1 text-xs font-semibold">
                HOY
              </div>
            </div>
            <p className="text-emerald-100 text-sm font-medium">Transacciones Aprobadas</p>
            <p className="text-4xl font-bold mt-2">{stats.approvedToday}</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span className="text-emerald-100">Exitosas</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-10 h-10" />
              <div className="bg-white bg-opacity-20 rounded-full px-3 py-1 text-xs font-semibold">
                HOY
              </div>
            </div>
            <p className="text-orange-100 text-sm font-medium">Monto de Ventas</p>
            <p className="text-4xl font-bold mt-2">${stats.salesAmountToday.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="text-orange-100">Total procesado</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-10 h-10" />
              <div className="bg-white bg-opacity-20 rounded-full px-3 py-1 text-xs font-semibold">
                GLOBAL
              </div>
            </div>
            <p className="text-blue-100 text-sm font-medium">Tasa de Aprobación</p>
            <p className="text-4xl font-bold mt-2">{stats.approvalRate.toFixed(1)}%</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4" />
              <span className="text-blue-100">{stats.totalTransactions} transacciones</span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-10 h-10" />
              <div className="bg-white bg-opacity-20 rounded-full px-3 py-1 text-xs font-semibold">
                PENDIENTE
              </div>
            </div>
            <p className="text-purple-100 text-sm font-medium">Cargos Programados</p>
            <p className="text-4xl font-bold mt-2">{stats.pendingCharges}</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4" />
              <span className="text-purple-100">En espera</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Transacciones por Hora</h3>
            <div className="bg-blue-50 rounded-full p-2">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-1">
            {stats.hourlyStats.map((hour) => (
              <div key={hour.hour} className="flex-1 flex flex-col items-center group">
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500 relative group-hover:shadow-lg"
                  style={{ height: `${(hour.count / maxHourlyCount) * 100}%`, minHeight: hour.count > 0 ? '4px' : '0' }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {hour.count} transacciones
                  </div>
                </div>
                <span className="text-xs text-gray-500 mt-2">{hour.hour}h</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Tendencia Semanal</h3>
            <div className="bg-emerald-50 rounded-full p-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="space-y-4">
            {stats.weeklyTrend.map((day, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 w-12">{day.day}</span>
                  <div className="flex gap-4 text-xs">
                    <span className="text-emerald-600">{day.approved} ✓</span>
                    <span className="text-red-600">{day.rejected} ✗</span>
                  </div>
                </div>
                <div className="flex gap-1 h-8">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-l transition-all duration-300 hover:from-emerald-500 hover:to-emerald-600 flex items-center justify-center text-white text-xs font-semibold"
                    style={{ width: `${(day.approved / (day.approved + day.rejected || 1)) * 100}%` }}
                  >
                    {day.approved > 0 && day.approved}
                  </div>
                  <div
                    className="bg-gradient-to-r from-red-400 to-red-500 rounded-r transition-all duration-300 hover:from-red-500 hover:to-red-600 flex items-center justify-center text-white text-xs font-semibold"
                    style={{ width: `${(day.rejected / (day.approved + day.rejected || 1)) * 100}%` }}
                  >
                    {day.rejected > 0 && day.rejected}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Ventas Mensuales</h3>
            <div className="bg-blue-50 rounded-full p-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="space-y-3">
            {stats.monthlyComparison.map((month, index) => (
              <div key={index} className="group">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">{month.month}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">{month.count} trans.</span>
                    <span className="text-gray-900 font-bold">${month.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="relative w-full bg-gray-100 rounded-full h-10 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-full transition-all duration-700 ease-out flex items-center justify-end pr-4 group-hover:from-blue-600 group-hover:to-blue-800"
                    style={{ width: `${(month.amount / maxMonthlyAmount) * 100}%` }}
                  >
                    <span className="text-white text-xs font-bold">{month.amount > 0 && `${((month.amount / maxMonthlyAmount) * 100).toFixed(0)}%`}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Distribución</h3>
            <div className="bg-purple-50 rounded-full p-2">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="70"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="28"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="70"
                  fill="none"
                  stroke="url(#gradient-approved)"
                  strokeWidth="28"
                  strokeDasharray={`${(stats.approvalRate / 100) * 439.6} 439.6`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="70"
                  fill="none"
                  stroke="url(#gradient-rejected)"
                  strokeWidth="28"
                  strokeDasharray={`${(stats.rejectionRate / 100) * 439.6} 439.6`}
                  strokeDashoffset={`-${(stats.approvalRate / 100) * 439.6}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="gradient-approved" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="gradient-rejected" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-bold text-gray-900">{stats.approvalRate.toFixed(0)}%</p>
                <p className="text-xs text-gray-500 mt-1">Aprobación</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">Aprobadas</span>
              </div>
              <span className="text-sm font-bold text-emerald-600">{stats.approvalRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-gray-700">Rechazadas</span>
              </div>
              <span className="text-sm font-bold text-red-600">{stats.rejectionRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Top Bancos por Monto</h3>
            <div className="bg-indigo-50 rounded-full p-2">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="space-y-4">
            {stats.bankStats.length > 0 ? (
              stats.bankStats.map((bank, index) => (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-700">{bank.bank}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">${bank.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-gray-500">{bank.count} trans.</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-700 group-hover:from-indigo-600 group-hover:to-indigo-700"
                      style={{ width: `${(bank.amount / stats.bankStats[0].amount) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Errores Principales</h3>
            <div className="bg-red-50 rounded-full p-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="space-y-3">
            {stats.topErrors.length > 0 ? (
              stats.topErrors.map((error, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                          ISO {error.code}
                        </span>
                        <span className="text-xs text-gray-500">{error.count} ocurrencias</span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{error.message}</p>
                    </div>
                  </div>
                  <div className="w-full bg-red-100 rounded-full h-2 mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-700"
                      style={{ width: `${(error.count / stats.topErrors[0].count) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay errores registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-2xl shadow-2xl p-8 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-white bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              <CreditCard className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.totalTransactions}</p>
            <p className="text-slate-400 text-sm">Total Transacciones</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-white bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              <DollarSign className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-1">${stats.averageTransaction.toFixed(2)}</p>
            <p className="text-slate-400 text-sm">Ticket Promedio</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-white bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              <TrendingUp className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.approvalRate.toFixed(1)}%</p>
            <p className="text-slate-400 text-sm">Tasa Éxito</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-white bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              <Activity className="w-8 h-8" />
            </div>
            <p className="text-3xl font-bold mb-1">{stats.bankStats.length}</p>
            <p className="text-slate-400 text-sm">Bancos Activos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
