import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AutoReloadToggle from '@/components/ui/AutoReloadToggle';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Search, Download } from 'lucide-react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type Transaction = {
  date: string;
  time: string;
  name: string;
  email: string;
  operation: string;
  amount: string;
  currency: string;
  ios: string;
  answer: string;
  bin_card: string;
  card_number: string;
  issuing_bank: string;
  brand: string;
  status: string;
  response_code: string;
  response_text: string;
  ticket_number: string;
};

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      date: '2025-02-04',
      time: '15:53',
      name: 'Jose Perez',
      email: 'user@example.com',
      operation: '1738684425593130452',
      amount: '0',
      currency: 'MXN',
      ios: '342243',
      answer: 'INVALID TRANSACTION',
      bin_card: '54519515',
      card_number: '545195XXXXXX5480',
      issuing_bank: 'Banco de la Produccion S.A. (PRODUBANCO)',
      brand: 'Mastercard',
      status: 'DECLINED',
      response_code: '89',
      response_text: 'Unacceptable PIN— Transaction Declined— Retry',
      ticket_number: '821738274732841994',
    },
    {
      date: '2025-02-04',
      time: '15:55',
      name: 'John Doe',
      email: 'user@example.com',
      operation: '700011575252919092',
      amount: '1000',
      currency: 'MXN',
      ios: '342243',
      answer: 'APPROVED',
      bin_card: '54519515',
      card_number: '545195XXXXXX5480',
      issuing_bank: 'Banco de la Produccion S.A. (PRODUBANCO)',
      brand: 'Mastercard',
      status: 'APPROVED',
      response_code: '000',
      response_text: 'Approved or completed successfully.',
      ticket_number: '821738274732841994',
    },
  ]);

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const fromDates = firstDay.toISOString();
  const toDates = lastDay.toISOString();

  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState<Date | null>(new Date(fromDates));
  const [toDate, setToDate] = useState<Date | null>(new Date(toDates));
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [autoReload, setAutoReload] = useState(false);

  const transformData = (data: any[]): Transaction[] => {
    return data.map((item) => {
      const createdDate = new Date(item.created);
      return {
        date: createdDate.toISOString().split('T')[0],
        time: createdDate.toISOString().split('T')[1].slice(0, 5),
        name:
          `${item.contact_details?.first_name || ''} ${
            item.contact_details?.last_name || ''
          }`.trim() ||
          item.card_holder_name ||
          'N/A',
        email: item.contact_details?.email || 'N/A',
        operation: '213123123213',
        amount: (item.approved_transaction_amount ?? item.request_amount ?? 0).toString(),
        currency: item.currency_code || 'N/A',
        status: item.transaction_status,
        ios: item.respond_code,
        answer: item.responde_text,
        bin_card: item.bin_card || 'N/A',
        card_number: item.masked_credit_card,
        issuing_bank: item.issuing_bank || 'N/A',
        brand: item.payment_brand || 'N/A',
        response_code: item.response_code || 'N/A',
        response_text: item.response_text || 'N/A',
        ticket_number: item.ticket_number,
      };
    });
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

  const fetchTransactions = async () => {
    const result = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-transactions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          from_date: formatDate(String(fromDate)) ?? format(toDate, 'MMM dd, yyyy'),
          to_date: formatDate(String(toDate)) ?? format(toDate, 'MMM dd, yyyy'),
        }),
      }
    );

    const res = result.json();

    if (res.data) {
      setTransactions(transformData(res.data));
    }
  };

  const getSubscriptionInfo = async () => {
    const result = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dynamic-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        subscriptionId: '1759746628795543',
      }),
    });

    const res = result.json();

    console.log('subscription info:', res);
  };

  // Sample data loader (replace with API fetch)
  useEffect(() => {
    setLoading(true);
    getSubscriptionInfo();
    setLoading(false);
  }, []);

  // Reactive filtering: search, status, and date range
  useEffect(() => {
    let filtered = [...transactions];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.email.toLowerCase().includes(query) ||
          t.operation.toLowerCase().includes(query) ||
          t.amount.toLowerCase().includes(query) ||
          t.currency.toLowerCase().includes(query) ||
          t.ios.toLowerCase().includes(query) ||
          t.status.toLowerCase().includes(query) ||
          t.answer.toLowerCase().includes(query) ||
          t.bin_card.toLowerCase().includes(query) ||
          t.card_number.toLowerCase().includes(query) ||
          t.issuing_bank.toLowerCase().includes(query) ||
          t.brand.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (fromDate) {
      filtered = filtered.filter((t) => new Date(t.date) >= fromDate);
    }
    if (toDate) {
      filtered = filtered.filter((t) => new Date(t.date) <= toDate);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, statusFilter]);

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFontSize(16);
    doc.text('Transactions Report', 40, 40);

    const tableData = filteredTransactions.map((t) => [
      t.date,
      t.time,
      t.name,
      t.operation,
      `$${Number(t.amount).toFixed(2)} ${t.currency}`,
      t.response_code,
      t.response_text,
      t.answer,
      t.bin_card,
      t.card_number,
      t.issuing_bank,
      t.brand,
    ]);

    autoTable(doc, {
      startY: 60,
      head: [
        [
          'Fecha',
          'Hora',
          'Nombre',
          'Operación',
          'Importe',
          'ISO',
          'Respuesta',
          'Bin',
          'Número de tarjeta',
          'Banco emisor',
          'Marca',
        ],
      ],
      body: tableData,
      styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
    });

    doc.save('transactions.pdf');
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredTransactions);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
    XLSX.writeFile(workbook, 'transactions.xlsx');
  };

  // Auto reload effect
  useEffect(() => {
    if (!autoReload) return;

    // Then reload every 10 seconds (adjust as needed)
    const timer = setInterval(() => {
      // fetchTransactions();
      // console.log(1);
    }, 1000);

    return () => clearInterval(timer);
  }, [autoReload]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transacciones</h1>
          <p className="text-muted-foreground">Ver y gestionar transacciones de pago</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="mr-2 h-4 w-4" /> Exportar Excel
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="mr-2 h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Date Pickers */}
          <div className="flex gap-4 mb-4">
            <div className="relative w-full">
              <Input
                readOnly
                value={fromDate ? format(fromDate, 'MMM dd, yyyy') : ''}
                placeholder="Desde fecha"
                onClick={() => setShowFromPicker(!showFromPicker)}
              />
              {showFromPicker && (
                <div className="absolute z-50 mt-2 shadow-lg rounded-lg p-2 bg-gray-800 text-white border">
                  <DayPicker
                    mode="single"
                    selected={fromDate || undefined}
                    onSelect={(date) => {
                      if (date) setFromDate(date);
                      setShowFromPicker(false);
                    }}
                  />
                </div>
              )}
            </div>
            <div className="relative w-full">
              <Input
                readOnly
                value={toDate ? format(toDate, 'MMM dd, yyyy') : ''}
                placeholder="Hasta la fecha"
                onClick={() => setShowToPicker(!showToPicker)}
              />
              {showToPicker && (
                <div className="absolute z-50 mt-2 shadow-lg rounded-lg p-2 bg-gray-800 text-white border">
                  <DayPicker
                    mode="single"
                    selected={toDate || undefined}
                    onSelect={(date) => {
                      if (date) setToDate(date);
                      setShowToPicker(false);
                    }}
                  />
                </div>
              )}
            </div>
            <Button onClick={fetchTransactions} disabled={loading}>
              {loading ? 'Cargando...' : 'Filtro'}
            </Button>
          </div>

          {/* Search + Status filter */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, correo electrónico, ticket..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Estado completo</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="declined">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center space-x-2">
                      <label htmlFor="auto-reload" className="text-sm font-medium text-gray-700">
                        Recarga automática
                      </label>
                      <button
                        id="auto-reload"
                        onClick={() => setAutoReload(!autoReload)}
                        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
                          autoReload ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                            autoReload ? 'translate-x-4' : ''
                          }`}
                        ></div>
                      </button>
                    </div>
                  </TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Operación</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>ISO</TableHead>
                  <TableHead>Respuesta</TableHead>
                  <TableHead>Bin</TableHead>
                  <TableHead>Número de tarjeta</TableHead>
                  <TableHead>Banco emisor</TableHead>
                  <TableHead>Marca</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      Cargando transacciones...
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8">
                      No se encontraron transacciones
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((t, id) => (
                    <TableRow key={id}>
                      <TableCell>
                        <div className="inline-flex items-center justify-center h-10 w-10 rounded-full ">
                          {t.status === 'APPROVED' ? (
                            <CheckCircle2 className="h-8 w-8 text-green-500 hover:text-green-700 transition-colors" />
                          ) : (
                            <XCircle className="h-8 w-8 text-red-500 hover:text-red-700 transition-colors" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{t.date}</TableCell>
                      <TableCell>{t.time}</TableCell>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>{t.operation}</TableCell>
                      <TableCell>${Number(t.amount).toFixed(2)}</TableCell>
                      <TableCell>{t.currency}</TableCell>
                      <TableCell>{t.ios}</TableCell>
                      <TableCell>{t.answer}</TableCell>
                      <TableCell>{t.bin_card}</TableCell>
                      <TableCell>{t.card_number}</TableCell>
                      <TableCell>{t.issuing_bank}</TableCell>
                      <TableCell>{t.brand}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
