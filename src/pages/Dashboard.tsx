import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, DollarSign, CheckCircle2, XCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  interface Transaction {
    created: string;
    transaction_status: string;
    transaction_type: string;
    approved_transaction_amount?: number;
  }

  const [stats, setStats] = useState({
    todayApproved: 0,
    todaySales: 0,
    approvalRate: 50,
    rejectionRate: 50,
  });

  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [bankData, setBankData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([
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
      transaction_status: 'DECLINED',
      transaction_type: 'SALE',
      approved_transaction_amount: 10,
      card_holder_name: 'Jose Perez',
      last_four_digits: '5480',
      payment_brand: 'Mastercard',
    },
    {
      masked_credit_card: '545195XXXXXX5480',
      created: '2025-02-04T15:55:37.000Z',
      approved_transaction_amount: 1000,
      transaction_status: 'APPROVED',
      transaction_type: 'SALE',
      card_holder_name: 'John Doe',
      last_four_digits: '5480',
      payment_brand: 'Mastercard',
    },
    {
      masked_credit_card: '545195XXXXXX5480',
      created: '2025-02-04T15:58:44.302Z',
      approved_transaction_amount: 500,
      transaction_status: 'APPROVED',
      transaction_type: 'VOID',
      card_holder_name: 'John Doe',
      last_four_digits: '5480',
      payment_brand: 'Mastercard',
    },
    {
      masked_credit_card: '545195XXXXXX5480',
      created: '2025-01-04T15:55:37.000Z',
      approved_transaction_amount: 4000,
      transaction_status: 'APPROVED',
      transaction_type: 'SALE',
      card_holder_name: 'John Doe',
      last_four_digits: '5480',
      payment_brand: 'Mastercard',
    },
    {
      masked_credit_card: '545195XXXXXX5480',
      created: '2025-04-04T15:55:37.000Z',
      approved_transaction_amount: 2000,
      transaction_status: 'APPROVED',
      transaction_type: 'SALE',
      card_holder_name: 'John Doe',
      last_four_digits: '5480',
      payment_brand: 'Mastercard',
    },
  ]);

  const getMonthlySalesTotals = (transactions: Transaction[]) => {
    const monthlyTotals: Record<string, number> = {};

    // Sum approved SALE transactions per month
    transactions.forEach((t) => {
      if (t.transaction_status === 'APPROVED' && t.transaction_type === 'SALE') {
        const date = new Date(t.created);
        const month = date.getMonth(); // 0–11
        const amount = t.approved_transaction_amount || 0;
        monthlyTotals[month] = (monthlyTotals[month] || 0) + amount;
      }
    });

    const monthNames = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'Puede',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];

    const allMonths = monthNames.map((name, index) => ({
      month: name,
      sales: monthlyTotals[index] || 0,
    }));

    setMonthlyData(allMonths);
    console.log(allMonths);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getTransactionsMonthAPI = async () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const fromDate = firstDayOfMonth.toISOString().split('T')[0];
    const toDate = lastDayOfMonth.toISOString().split('T')[0];

    const monthlyTransactions = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          from_date: `${fromDate}T00:00:00`,
          to_date: `${toDate}T23:59:59`,
        }),
      }
    );

    const monthlyTransactionsRes = await monthlyTransactions.json();
    getMonthlySalesTotals(monthlyTransactionsRes);
  };

  const fetchDashboardData = async () => {
    const today = new Date().toISOString().split('T')[0];

    const todayTransactions = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          from_date: `${today}T00:00:00`,
          to_date: `${today}T23:59:59`,
        }),
      }
    );

    const todayTransactionsRes = todayTransactions.json();

    if (todayTransactionsRes.total > 0) {
      setTransactions(todayTransactionsRes.data);
      getTransactionsMonthAPI();

      const approved = todayTransactionsRes.data.filter((t) => t.transaction_status === 'approved');
      const rejected = todayTransactionsRes.data.filter((t) => t.transaction_status === 'declined');
      const totalSales = approved.reduce(
        (sum, t) => sum + Number(t.approved_transaction_amount),
        0
      );

      const total = todayTransactionsRes.length;
      const approvalRate = total > 0 ? (approved.length / total) * 100 : 0;
      const rejectionRate = total > 0 ? (rejected.length / total) * 100 : 0;

      setStats({
        todayApproved: approved.length,
        todaySales: totalSales,
        approvalRate: Math.round(approvalRate),
        rejectionRate: Math.round(rejectionRate),
      });
    } else {
      const approved = transactions.filter((t) => t.transaction_status === 'APPROVED');
      const rejected = transactions.filter((t) => t.transaction_status === 'DECLINED');
      const totalSales = approved.reduce(
        (sum, t) => sum + Number(t.approved_transaction_amount),
        0
      );

      const total = transactions.length;
      const approvalRate = total > 0 ? (approved.length / total) * 100 : 0;
      const rejectionRate = total > 0 ? (rejected.length / total) * 100 : 0;

      getMonthlySalesTotals(transactions);

      setStats({
        todayApproved: approved.length,
        todaySales: totalSales,
        approvalRate: Math.round(approvalRate),
        rejectionRate: Math.round(rejectionRate),
      });
    }

    setBankData([
      { bank: 'Bank A', accepted: 85 },
      { bank: 'Bank B', accepted: 78 },
      { bank: 'Bank C', accepted: 92 },
      { bank: 'Bank D', accepted: 88 },
    ]);
  };

  const pieData = [
    { name: 'Aprobado', value: stats.approvalRate },
    { name: 'Rechazado', value: stats.rejectionRate },
  ];

  const COLORS = ['hsl(var(--success))', 'hsl(var(--destructive))'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de control</h1>
        <p className="text-muted-foreground">Bienvenido a tu plataforma de cobros</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobado hoy</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayApproved}</div>
            <p className="text-xs text-muted-foreground">Transacciones aprobadas hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas de hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Monto total de ventas hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de aprobación</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvalRate}%</div>
            <p className="text-xs text-muted-foreground">Tasa de éxito</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de rechazo</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejectionRate}%</div>
            <p className="text-xs text-muted-foreground">Transacciones fallidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Comparación de ventas mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relación aprobación/rechazo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
