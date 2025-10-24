import { useEffect, useState } from 'react';
import { Search, RefreshCw, Download, CheckCircle2, XCircle, Calendar, X } from 'lucide-react';

type FilterType = 'all' | 'APPROVED' | 'DECLINED';

interface Transaction {
  id: string;
  amount: number;
  ios: string;
  ios_response: string;
  bin_card: string;
  card_number: string;
  bank_name: string;
  brand_name: string;
  status: 'APPROVED' | 'DECLINED' | 'INITIALIZED';
  date: string;
  time: string;
  created_at: string;
}

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

const addOneDay = (date: string | number | Date) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + 1);
  return newDate;
};

const formatDisplayDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const transformData = (data: any[]): Transaction[] => {
  return data.map((item) => {
    const createdDate = new Date(item.created);

    return {
      id: item.transaction_id,
      amount: item.approved_transaction_amount ?? 0,
      ios: item.response_code ?? 'N/A',
      ios_response: item.response_text ?? 'N/A',
      bin_card: item.bin_card ?? 'N/A',
      card_number: item.masked_credit_card ?? 'N/A',
      bank_name: item.issuing_bank ?? 'N/A',
      brand_name: item.payment_brand ?? 'N/A',
      status: item.transaction_status ?? 'INITIALIZED',
      date: createdDate.toISOString().split('T')[0],
      time: createdDate.toISOString().split('T')[1].slice(0, 8),
      created_at: item.created ?? '',
    };
  });
};

export default function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Initialize with current month dates
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [fromDate, setFromDate] = useState(firstDay.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(lastDay.toISOString().split('T')[0]);
  const [tempFromDate, setTempFromDate] = useState(fromDate);
  const [tempToDate, setTempToDate] = useState(toDate);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, filter]);

  const loadTransactions = async (customFromDate?: string, customToDate?: string) => {
    setLoading(true);

    const fromDateToUse = customFromDate || fromDate;
    const toDateToUse = customToDate || toDate;

    const fromDateTime = new Date(fromDateToUse);
    fromDateTime.setHours(0, 0, 0, 0);

    const toDateTime = new Date(toDateToUse);
    toDateTime.setHours(23, 59, 59, 999);

    try {
      const result = await fetch(
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
          }),
        }
      );

      const data = await result.json();

      console.log(data);
      if (data.data) {
        const transactionList = data.data;
        transactionList.sort((a, b) => {
          return new Date(b.created).getTime() - new Date(a.created).getTime();
        });
        setTransactions(transformData(transactionList));
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filter === 'APPROVED') {
      filtered = filtered.filter((t) => t.status === 'APPROVED');
    } else if (filter === 'DECLINED') {
      filtered = filtered.filter((t) => t.status === 'DECLINED');
    }

    setFilteredTransactions(filtered);
  };

  const handleApplyDateRange = () => {
    setFromDate(tempFromDate);
    setToDate(tempToDate);
    setShowDatePicker(false);
    loadTransactions(tempFromDate, tempToDate);
  };

  const handleResetDateRange = () => {
    setTempFromDate(fromDate);
    setTempToDate(toDate);
    setShowDatePicker(false);
  };

  const exportToCSV = () => {
    const headers = [
      'A/R',
      'Fecha',
      'Hora',
      'Operación',
      'Monto',
      'ISO',
      'Respuesta',
      'BIN',
      'Número de tarjeta',
      'Banco emisor',
      'Marca',
    ];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map((t) =>
        [
          t.status,
          t.date,
          t.time,
          t.id,
          t.amount,
          t.ios,
          t.ios_response,
          t.bin_card,
          t.card_number,
          t.bank_name,
          t.brand_name,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacciones_${fromDate}_${toDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 relative">
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'APPROVED'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Aprobadas
            </button>
            <button
              onClick={() => setFilter('DECLINED')}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === 'DECLINED'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Rechazadas
            </button>
          </div>

          <div className="flex gap-2 relative">
            <button
              onClick={() => loadTransactions()}
              className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              title="Seleccionar rango de fechas"
            >
              <Calendar className="w-5 h-5" />
            </button>
            <button
              onClick={exportToCSV}
              className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              title="Descargar reporte"
            >
              <Download className="w-5 h-5" />
            </button>

            {showDatePicker && (
              <div className="absolute right-0 top-12 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Rango de Fechas</h3>
                  <button
                    onClick={() => {
                      setShowDatePicker(false), handleResetDateRange();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                    <input
                      type="date"
                      value={tempFromDate}
                      onChange={(e) => setTempFromDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                    <input
                      type="date"
                      value={tempToDate}
                      onChange={(e) => setTempToDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleResetDateRange}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
                    >
                      Mes actual
                    </button>
                    <button
                      onClick={handleApplyDateRange}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Mostrando transacciones desde{' '}
          <span className="font-semibold">{addOneDay(tempFromDate).toLocaleDateString()}</span> hasta{' '}
          <span className="font-semibold">{addOneDay(tempToDate).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 tracking-wider">
                  A/R
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  Operación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  ISO
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  Respuesta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  BIN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  Número de tarjeta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  Banco emisor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider">
                  Marca
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    <div className="rounded-lg p-8 flex flex-row items-center justify-center gap-2">
                      <div className="w-7 h-7 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      <div className="text-gray-400 text-lg font-semibold">
                        Cargando transacciones...
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {!loading &&
                filteredTransactions.length > 0 &&
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="inline-flex items-center justify-center h-10 w-10 rounded-full ">
                        {transaction.status === 'APPROVED' ? (
                          <CheckCircle2 className="h-8 w-8 text-green-500 hover:text-green-700 transition-colors" />
                        ) : (
                          <XCircle className="h-8 w-8 text-red-500 hover:text-red-700 transition-colors" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${Number(transaction.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {transaction.ios}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {transaction.ios_response}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{transaction.bin_card}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{transaction.card_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{transaction.bank_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {transaction.brand_name.toUpperCase()}
                    </td>
                  </tr>
                ))}
              {!loading && filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron transacciones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="text-sm text-gray-600">
          Mostrando {filteredTransactions.length} de {transactions.length} transacciones
        </div>
      </div>
    </div>
  );
}
