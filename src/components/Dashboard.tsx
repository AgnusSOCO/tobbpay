import { useEffect, useState } from 'react';
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
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Target,
  Globe,
  Zap,
} from 'lucide-react';

// API Response Type
type TransactionAPIResponse = {
  total: number;
  data: TransactionData[];
};

type TransactionData = {
  masked_credit_card: string;
  created: string;
  metadata: string;
  approved_transaction_amount: number;
  contact_details: {
    document_code?: string;
    document_type?: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  country: string;
  credential_alias: string;
  credential_id: string;
  currency_code: string;
  ice_value: number;
  iva_value: number;
  merchant_id: string;
  merchant_name: string;
  payment_method: string;
  payment_submethod: string;
  processor_name: string;
  processor_type: string;
  public_credential_id: string;
  request_amount: number;
  response_code: string;
  response_text: string;
  subtotal_iva: number;
  subtotal_iva0: number;
  transaction_id: string;
  transaction_reference: string;
  transaction_status: string;
  transaction_type: string;
  bin_card: string;
  card_country: string;
  card_country_code: string;
  card_holder_name: string;
  card_type: string;
  foreign_card: boolean;
  issuing_bank?: string;
  last_four_digits: string;
  payment_brand: string;
  transaction_card_id?: string;
  acquirer_bank?: string;
  approval_code?: string;
  processor_merchant_id?: string;
  taxes?: {
    agenciaDeViaje: number;
    iac: number;
    tasaAeroportuaria: number;
  };
  processor_id?: string;
  ticket_number?: string;
  sale_approval_code?: string;
  sale_ticket_number?: string;
  sale_transaction_type?: string;
  tax_id?: string;
  processor_code?: string;
  processor_message?: string;
  recap?: any;
  void_ticket_number?: string;
};

type DashboardStats = {
  approvedToday: number;
  salesAmountToday: number;
  monthlyComparison: { month: string; amount: number; count: number }[];
  approvalRate: number;
  rejectionRate: number;
  bankStats: { bank: string; count: number; amount: number; approved: number; declined: number }[];
  hourlyStats: { hour: number; count: number }[];
  weeklyTrend: { day: string; approved: number; rejected: number }[];
  averageTransaction: number;
  totalTransactions: number;
  pendingCharges: number;
  topErrors: { code: string; message: string; count: number }[];
  recentActivity: TransactionData[];
  currencyBreakdown: { currency: string; amount: number; count: number }[];
  dailyComparison: { day: string; amount: number; count: number }[];
  peakHour: number;
  conversionRate: number;
  yesterdayApproved: number;
  lastWeekTotal: number;
};

// Mock API data
const mockAPIData: TransactionAPIResponse = {
  total: 3,
  data: [
    {
      masked_credit_card: '545195XXXXXX5480',
      created: '2025-02-04T15:53:45.000Z',
      metadata: '{"contractID":"157AB"}',
      approved_transaction_amount: 0,
      contact_details: {
        document_code: 'DORJ760623HNGDORJ7',
        document_type: 'CURP',
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+593912345678',
      },
      country: 'Mexico',
      credential_alias: 'Manuel Mexico',
      credential_id: 'aa39582ddf0e4fcdad6d91f0caf64e28',
      currency_code: 'MXN',
      ice_value: 0,
      iva_value: 0,
      merchant_id: '20000000106554380000',
      merchant_name: 'TW Mexico',
      payment_method: 'CARD',
      payment_submethod: 'CARD NO PRESENT',
      processor_name: 'undefined',
      processor_type: 'aggregator_formal',
      public_credential_id: 'fc98ad9ee66443588be2873c89217cdd',
      request_amount: 1000,
      response_code: 'K220',
      response_text: 'Monto de la transacción es diferente al monto de la venta inicial',
      subtotal_iva: 0,
      subtotal_iva0: 1000,
      transaction_id: '1738684425593130452',
      transaction_reference: '1275635a-ad34-4764-a27e-f6215b94b3c7',
      transaction_status: 'DECLINED',
      transaction_type: 'SALE',
      bin_card: '54519515',
      card_country: 'Ecuador',
      card_country_code: 'EC',
      card_holder_name: 'Jose Perez',
      card_type: 'credit',
      foreign_card: true,
      issuing_bank: 'Banco de la Produccion S.A. (PRODUBANCO)',
      last_four_digits: '5480',
      payment_brand: 'Mastercard',
      transaction_card_id: '6420c5bd-5a3f-45d2-8ac4-88de7b09958d',
    },
    {
      masked_credit_card: '545195XXXXXX5480',
      created: '2025-02-04T15:55:37.000Z',
      metadata: '{"contractID":"157AB"}',
      approved_transaction_amount: 1000,
      contact_details: {
        document_code: 'DORJ760623HNGDORJ7',
        document_type: 'CURP',
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+523912345678',
      },
      country: 'Mexico',
      credential_alias: 'Alias1',
      credential_id: '22c33a81f145415cb200ab8139603a51',
      currency_code: 'MXN',
      ice_value: 0,
      iva_value: 0,
      merchant_id: '20000000106554380000',
      merchant_name: 'TW Mexico',
      payment_method: 'CARD',
      payment_submethod: 'CARD NO PRESENT',
      processor_id: '6000000000172166121420424728',
      processor_name: 'Prosa Processor',
      processor_type: 'gateway',
      public_credential_id: 'd5713887dc434cc4bb873781e46e10ca',
      request_amount: 1000,
      response_code: '000',
      response_text: 'Transacción aprobada',
      subtotal_iva: 0,
      subtotal_iva0: 1000,
      ticket_number: '029184246439606168',
      transaction_id: '700011575252919092',
      transaction_reference: 'aa778d12-c56b-4cc2-86c8-1dea7cebe65e',
      transaction_status: 'APPROVED',
      transaction_type: 'SALE',
      acquirer_bank: 'Afirme',
      approval_code: '000000',
      bin_card: '54519515',
      card_country: 'Ecuador',
      card_country_code: 'EC',
      card_holder_name: 'John Doe',
      card_type: 'credit',
      foreign_card: true,
      issuing_bank: 'Banco de la Produccion S.A. (PRODUBANCO)',
      last_four_digits: '5480',
      payment_brand: 'Mastercard',
      processor_merchant_id: '111',
      taxes: {
        agenciaDeViaje: 0,
        iac: 0,
        tasaAeroportuaria: 0,
      },
      transaction_card_id: '6420c5bd-5a3f-45d2-8ac4-88de7b09958d',
    },
    {
      masked_credit_card: '545195XXXXXX5480',
      created: '2025-02-04T15:58:44.302Z',
      metadata: '{"contractID":"157AB"}',
      approved_transaction_amount: 500,
      contact_details: {
        email: 'manuel.guerrero@kushkipagos.com',
      },
      country: 'Mexico',
      credential_alias: 'Alias1',
      credential_id: '22c33a81f145415cb200ab8139603a51',
      currency_code: 'MXN',
      ice_value: 0,
      iva_value: 0,
      merchant_id: '20000000106554380000',
      merchant_name: 'TW Mexico',
      payment_method: 'CARD',
      payment_submethod: 'CARD NO PRESENT',
      processor_id: '6000000000172166121420424728',
      processor_name: 'Prosa Processor',
      processor_type: 'gateway',
      public_credential_id: 'd5713887dc434cc4bb873781e46e10ca',
      request_amount: 500,
      response_code: '000',
      response_text: 'Transacción aprobada',
      sale_approval_code: '000000',
      sale_ticket_number: '029184246439606168',
      sale_transaction_type: 'SALE',
      subtotal_iva: 500,
      subtotal_iva0: 0,
      ticket_number: '661738684712571670',
      transaction_id: '700011575252919092',
      transaction_reference: '2052742c-97dc-4d8a-b7b0-27bf4eafcc0a',
      transaction_status: 'APPROVED',
      transaction_type: 'VOID',
      tax_id: '1234567890123',
      approval_code: null,
      bin_card: '545195',
      card_country: 'Ecuador',
      card_country_code: 'EC',
      card_holder_name: 'John Doe',
      card_type: 'Credit',
      foreign_card: true,
      last_four_digits: '5480',
      payment_brand: 'Mastercard',
      processor_code: '000',
      processor_merchant_id: '111',
      processor_message: 'Transacción aprobada',
      recap: null,
      transaction_card_id: null,
      void_ticket_number: '661738684712571670',
    },
  ],
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
    recentActivity: [],
    currencyBreakdown: [],
    dailyComparison: [],
    peakHour: 0,
    conversionRate: 0,
    yesterdayApproved: 0,
    lastWeekTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      // In production, replace with: const response = await fetch('/api/transactions');
      // const apiData: TransactionAPIResponse = await response.json();
      const apiData = mockAPIData;

      const transactions = apiData.data;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      const todayTransactions = transactions.filter((t) => new Date(t.created) >= today);

      const yesterdayTransactions = transactions.filter(
        (t) => new Date(t.created) >= yesterday && new Date(t.created) < today
      );

      const lastWeekTransactions = transactions.filter((t) => new Date(t.created) >= lastWeek);

      const approvedToday = todayTransactions.filter(
        (t) => t.transaction_status === 'APPROVED'
      ).length;

      const yesterdayApproved = yesterdayTransactions.filter(
        (t) => t.transaction_status === 'APPROVED'
      ).length;

      const lastWeekTotal = lastWeekTransactions.filter(
        (t) => t.transaction_status === 'APPROVED'
      ).length;

      const salesAmountToday = todayTransactions
        .filter((t) => t.transaction_status === 'APPROVED')
        .reduce((sum, t) => sum + t.approved_transaction_amount, 0);

      const approved = transactions.filter((t) => t.transaction_status === 'APPROVED').length;
      const declined = transactions.filter((t) => t.transaction_status === 'DECLINED').length;
      const total = transactions.length || 1;

      const approvalRate = (approved / total) * 100;
      const rejectionRate = (declined / total) * 100;
      const pendingCharges = 0;
      const conversionRate = (approved / (approved + pendingCharges || 1)) * 100;

      const totalAmount = transactions
        .filter((t) => t.transaction_status === 'APPROVED')
        .reduce((sum, t) => sum + t.approved_transaction_amount, 0);
      const averageTransaction = approved > 0 ? totalAmount / approved : 0;

      const monthlyData = calculateMonthlyComparison(transactions);
      const hourlyData = calculateHourlyStats(todayTransactions);
      const weeklyData = calculateWeeklyTrend(transactions);
      const dailyData = calculateDailyComparison(transactions);

      const peakHour = hourlyData.reduce((max, curr) => (curr.count > max.count ? curr : max), {
        hour: 0,
        count: 0,
      }).hour;

      const bankCounts = transactions.reduce(
        (
          acc: Record<
            string,
            { count: number; amount: number; approved: number; declined: number }
          >,
          t
        ) => {
          const bankName = t.issuing_bank || t.acquirer_bank || 'Unknown Bank';
          if (!acc[bankName]) {
            acc[bankName] = { count: 0, amount: 0, approved: 0, declined: 0 };
          }
          acc[bankName].count++;
          if (t.transaction_status === 'APPROVED') {
            acc[bankName].amount += t.approved_transaction_amount;
            acc[bankName].approved++;
          } else if (t.transaction_status === 'DECLINED') {
            acc[bankName].declined++;
          }
          return acc;
        },
        {}
      );

      const bankStats = Object.entries(bankCounts)
        .map(([bank, data]) => ({ bank, ...data }))
        .sort((a, b) => b.approved + b.declined - (a.approved + a.declined))
        .slice(0, 5);

      const currencyCounts = transactions.reduce(
        (acc: Record<string, { amount: number; count: number }>, t) => {
          if (t.transaction_status === 'APPROVED') {
            if (!acc[t.currency_code]) {
              acc[t.currency_code] = { amount: 0, count: 0 };
            }
            acc[t.currency_code].amount += t.approved_transaction_amount;
            acc[t.currency_code].count++;
          }
          return acc;
        },
        {}
      );

      const currencyBreakdown = Object.entries(currencyCounts)
        .map(([currency, data]) => ({ currency, ...data }))
        .sort((a, b) => b.amount - a.amount);

      const errorCounts = transactions
        .filter((t) => t.transaction_status === 'DECLINED' && t.response_code)
        .reduce((acc: Record<string, { message: string; count: number }>, t) => {
          const code = t.response_code;
          if (!acc[code]) {
            acc[code] = { message: t.response_text || code, count: 0 };
          }
          acc[code].count++;
          return acc;
        }, {});

      const topErrors = Object.entries(errorCounts)
        .map(([code, data]) => ({ code, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const recentActivity = transactions.slice(0, 10);

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
        recentActivity,
        currencyBreakdown,
        dailyComparison: dailyData,
        peakHour,
        conversionRate,
        yesterdayApproved,
        lastWeekTotal,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyComparison = (transactions: TransactionData[]) => {
    const months = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    const monthlyData: Record<number, { amount: number; count: number }> = {};

    transactions
      .filter((t) => t.transaction_status === 'APPROVED')
      .forEach((t) => {
        const month = new Date(t.created).getMonth();
        if (!monthlyData[month]) {
          monthlyData[month] = { amount: 0, count: 0 };
        }
        monthlyData[month].amount += t.approved_transaction_amount;
        monthlyData[month].count++;
      });

    return months.map((month, index) => ({
      month,
      amount: monthlyData[index]?.amount || 0,
      count: monthlyData[index]?.count || 0,
    }));
  };

  const calculateHourlyStats = (transactions: TransactionData[]) => {
    const hourlyData: Record<number, number> = {};
    transactions.forEach((t) => {
      const hour = new Date(t.created).getHours();
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    });

    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: hourlyData[i] || 0,
    }));
  };

  const calculateWeeklyTrend = (transactions: TransactionData[]) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const weekData: Record<number, { approved: number; rejected: number }> = {};

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    transactions
      .filter((t) => new Date(t.created) >= oneWeekAgo)
      .forEach((t) => {
        const day = new Date(t.created).getDay();
        if (!weekData[day]) {
          weekData[day] = { approved: 0, rejected: 0 };
        }
        if (t.transaction_status === 'APPROVED') weekData[day].approved++;
        if (t.transaction_status === 'DECLINED') weekData[day].rejected++;
      });

    return days.map((day, index) => ({
      day,
      approved: weekData[index]?.approved || 0,
      rejected: weekData[index]?.rejected || 0,
    }));
  };

  const calculateDailyComparison = (transactions: TransactionData[]) => {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const dailyData: Record<number, { amount: number; count: number }> = {};

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    transactions
      .filter((t) => t.transaction_status === 'APPROVED' && new Date(t.created) >= sevenDaysAgo)
      .forEach((t) => {
        const dayIndex = new Date(t.created).getDay();
        if (!dailyData[dayIndex]) {
          dailyData[dayIndex] = { amount: 0, count: 0 };
        }
        dailyData[dayIndex].amount += t.approved_transaction_amount;
        dailyData[dayIndex].count++;
      });

    return days.map((day, index) => ({
      day,
      amount: dailyData[index]?.amount || 0,
      count: dailyData[index]?.count || 0,
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

  const maxMonthlyAmount = Math.max(...stats.monthlyComparison.map((m) => m.amount), 1);
  const maxHourlyCount = Math.max(...stats.hourlyStats.map((h) => h.count), 1);
  const maxDailyAmount = Math.max(...stats.dailyComparison.map((d) => d.amount), 1);

  const growthVsYesterday =
    stats.yesterdayApproved > 0
      ? ((stats.approvedToday - stats.yesterdayApproved) / stats.yesterdayApproved) * 100
      : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Resumen de actividad en tiempo real</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <Activity className="w-4 h-4 animate-pulse text-green-500" />
            <span>Actualizado ahora</span>
          </div>

          <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  timeRange === range
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range === '7d' ? '7 días' : range === '30d' ? '30 días' : '90 días'}
              </button>
            ))}
          </div>
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
              {growthVsYesterday >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span className="text-emerald-100">
                {Math.abs(growthVsYesterday).toFixed(1)}% vs ayer
              </span>
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
            <p className="text-4xl font-bold mt-2">
              $
              {stats.salesAmountToday.toLocaleString('es-MX', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4" />
              <span className="text-orange-100">
                Promedio: ${stats.averageTransaction.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-10 h-10" />
              <div className="bg-white bg-opacity-20 rounded-full px-3 py-1 text-xs font-semibold">
                TASA
              </div>
            </div>
            <p className="text-blue-100 text-sm font-medium">Conversión</p>
            <p className="text-4xl font-bold mt-2">{stats.conversionRate.toFixed(1)}%</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4" />
              <span className="text-blue-100">Aprobación: {stats.approvalRate.toFixed(1)}%</span>
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
                PICO
              </div>
            </div>
            <p className="text-purple-100 text-sm font-medium">Hora Pico</p>
            <p className="text-4xl font-bold mt-2">{stats.peakHour}:00</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4" />
              <span className="text-purple-100">{stats.pendingCharges} pendientes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Comparación Diaria (7 días)</h3>
            <div className="bg-emerald-50 rounded-full p-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="space-y-4">
            {stats.dailyComparison.map((day, index) => (
              <div key={index} className="group">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="font-medium text-gray-700 w-16">{day.day}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 text-xs">{day.count} trans.</span>
                    <span className="text-gray-900 font-bold">
                      ${day.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="relative w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 rounded-full transition-all duration-700 ease-out group-hover:from-emerald-500 group-hover:to-emerald-700 flex items-center justify-end pr-2"
                    style={{ width: `${(day.amount / maxDailyAmount) * 100}%` }}
                  >
                    {day.amount > maxDailyAmount * 0.2 && (
                      <span className="text-white text-xs font-bold">
                        {((day.amount / maxDailyAmount) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Actividad Reciente</h3>
            <div className="bg-blue-50 rounded-full p-2">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      transaction.transaction_status === 'APPROVED'
                        ? 'bg-emerald-100'
                        : transaction.transaction_status === 'DECLINED'
                        ? 'bg-red-100'
                        : 'bg-yellow-100'
                    }`}
                  >
                    {transaction.transaction_status === 'APPROVED' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : transaction.transaction_status === 'DECLINED' ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.card_holder_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      ${transaction.approved_transaction_amount.toFixed(2)}{' '}
                      {transaction.currency_code}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.created).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Sin actividad reciente</p>
              </div>
            )}
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
                <div
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-500 relative group-hover:shadow-lg"
                  style={{
                    height: `${(hour.count / maxHourlyCount) * 100}%`,
                    minHeight: hour.count > 0 ? '4px' : '0',
                  }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
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
            <h3 className="text-xl font-bold text-gray-900">Distribución por Moneda</h3>
            <div className="bg-purple-50 rounded-full p-2">
              <Globe className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="space-y-4">
            {stats.currencyBreakdown.length > 0 ? (
              stats.currencyBreakdown.map((currency, index) => (
                <div key={index} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {currency.currency}
                      </div>
                      <span className="font-medium text-gray-700">{currency.currency}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">
                        ${currency.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500">{currency.count} trans.</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-700 group-hover:from-purple-600 group-hover:to-purple-700"
                      style={{
                        width: `${(currency.amount / stats.currencyBreakdown[0].amount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Ventas Mensuales</h3>
              <p className="text-sm text-gray-500 mt-1">Tendencia de ingresos por mes</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="relative h-64 mb-6">
            <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <path
                d={`M 0 ${
                  200 - (stats.monthlyComparison[0].amount / maxMonthlyAmount) * 180
                } ${stats.monthlyComparison
                  .map(
                    (month, i) =>
                      `L ${(i / (stats.monthlyComparison.length - 1)) * 800} ${
                        200 - (month.amount / maxMonthlyAmount) * 180
                      }`
                  )
                  .join(' ')} L 800 200 L 0 200 Z`}
                fill="url(#areaGradient)"
                className="transition-all duration-1000"
              />

              <path
                d={`M 0 ${
                  200 - (stats.monthlyComparison[0].amount / maxMonthlyAmount) * 180
                } ${stats.monthlyComparison
                  .map(
                    (month, i) =>
                      `L ${(i / (stats.monthlyComparison.length - 1)) * 800} ${
                        200 - (month.amount / maxMonthlyAmount) * 180
                      }`
                  )
                  .join(' ')}`}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-1000"
              />

              {stats.monthlyComparison.map((month, i) => (
                <g key={i}>
                  <circle
                    cx={(i / (stats.monthlyComparison.length - 1)) * 800}
                    cy={200 - (month.amount / maxMonthlyAmount) * 180}
                    r="5"
                    fill="#3b82f6"
                    className="transition-all duration-1000 hover:r-7"
                  />
                  <circle
                    cx={(i / (stats.monthlyComparison.length - 1)) * 800}
                    cy={200 - (month.amount / maxMonthlyAmount) * 180}
                    r="3"
                    fill="white"
                    className="transition-all duration-1000"
                  />
                </g>
              ))}
            </svg>

            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-xs text-gray-500">
              {stats.monthlyComparison
                .filter((_, i) => i % 2 === 0)
                .map((month, i) => (
                  <span key={i} className="font-medium">
                    {month.month}
                  </span>
                ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.monthlyComparison.slice(0, 4).map((month, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all"
              >
                <p className="text-xs text-gray-500 font-medium mb-1">{month.month}</p>
                <p className="text-lg font-bold text-gray-900">
                  ${(month.amount / 1000).toFixed(1)}k
                </p>
                <p className="text-xs text-gray-600 mt-1">{month.count} trans</p>
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
                <circle cx="96" cy="96" r="70" fill="none" stroke="#e5e7eb" strokeWidth="28" />
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
              <span className="text-sm font-bold text-emerald-600">
                {stats.approvalRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-gray-700">Rechazadas</span>
              </div>
              <span className="text-sm font-bold text-red-600">
                {stats.rejectionRate.toFixed(1)}%
              </span>
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
                      <p className="text-sm font-bold text-gray-900">
                        ${bank.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
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
            <h3 className="text-xl font-bold text-gray-900">Aceptación y Rechazo por Banco</h3>
            <div className="bg-teal-50 rounded-full p-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
            </div>
          </div>

          <div className="relative h-80 mb-4">
            <svg
              className="w-full h-full"
              viewBox="0 0 600 300"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="approvedBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="declinedBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <line
                  key={i}
                  x1="60"
                  y1={50 + i * 40}
                  x2="580"
                  y2={50 + i * 40}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              ))}

              {/* Y-axis labels */}
              {stats.bankStats.length > 0 &&
                [0, 1, 2, 3, 4, 5].map((i) => {
                  const maxValue = Math.max(
                    ...stats.bankStats.map((b) => Math.max(b.approved, b.declined))
                  );
                  const value = Math.round((5 - i) * (maxValue / 5));
                  return (
                    <text
                      key={i}
                      x="50"
                      y={54 + i * 40}
                      textAnchor="end"
                      fontSize="11"
                      fill="#6b7280"
                    >
                      {value}
                    </text>
                  );
                })}

              {/* Bars */}
              {stats.bankStats.map((bank, i) => {
                const maxValue = Math.max(
                  ...stats.bankStats.map((b) => Math.max(b.approved, b.declined))
                );
                const barWidth = 40;
                const groupWidth = 500 / stats.bankStats.length;
                const groupCenter = 80 + i * groupWidth;
                const approvedHeight = (bank.approved / maxValue) * 200;
                const declinedHeight = (bank.declined / maxValue) * 200;

                return (
                  <g key={i}>
                    {/* Approved bar */}
                    <rect
                      x={groupCenter - barWidth - 2}
                      y={250 - approvedHeight}
                      width={barWidth}
                      height={approvedHeight}
                      fill="url(#approvedBarGradient)"
                      rx="4"
                      className="transition-all duration-300 hover:opacity-80"
                    >
                      <title>{`${bank.bank}: ${bank.approved} aprobadas`}</title>
                    </rect>

                    {/* Declined bar */}
                    <rect
                      x={groupCenter + 2}
                      y={250 - declinedHeight}
                      width={barWidth}
                      height={declinedHeight}
                      fill="url(#declinedBarGradient)"
                      rx="4"
                      className="transition-all duration-300 hover:opacity-80"
                    >
                      <title>{`${bank.bank}: ${bank.declined} rechazadas`}</title>
                    </rect>

                    {/* Value labels on top of bars */}
                    {approvedHeight > 20 && (
                      <text
                        x={groupCenter - barWidth / 2 - 2}
                        y={250 - approvedHeight - 5}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill="#10b981"
                      >
                        {bank.approved}
                      </text>
                    )}
                    {declinedHeight > 20 && (
                      <text
                        x={groupCenter + barWidth / 2 + 2}
                        y={250 - declinedHeight - 5}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill="#ef4444"
                      >
                        {bank.declined}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* X-axis labels */}
              {stats.bankStats.map((bank, i) => {
                const groupWidth = 500 / stats.bankStats.length;
                const x = 80 + i * groupWidth;
                return (
                  <text key={i} x={x} y="275" textAnchor="middle" fontSize="10" fill="#6b7280">
                    {bank.bank.length > 12 ? bank.bank.substring(0, 12) + '...' : bank.bank}
                  </text>
                );
              })}
            </svg>
          </div>

          {stats.bankStats.length === 0 && (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay datos disponibles</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            {stats.bankStats.map((bank, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-700 mb-2 truncate">{bank.bank}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-xs font-bold text-emerald-600">{bank.approved}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-xs font-bold text-red-600">{bank.declined}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
                <span className="text-gray-600">Aprobadas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
                <span className="text-gray-600">Rechazadas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                          {error.code}
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
            <p className="text-3xl font-bold mb-1">{stats.lastWeekTotal}</p>
            <p className="text-slate-400 text-sm">Última Semana</p>
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
