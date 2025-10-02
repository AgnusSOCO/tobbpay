import { useState } from 'react';
import { Upload, Download, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type ExcelRow = {
  customer_name: string;
  amount: number;
  currency: string;
  card_number: string;
  card_expiry_month: string;
  card_expiry_year: string;
  cvv: string;
  retry_attempts: number;
  retry_interval_minutes: number;
};

export default function BulkChargeUpload() {
  const [batchName, setBatchName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const { user } = useAuth();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !batchName.trim()) {
      setMessage('Por favor ingrese un nombre de lote y seleccione un archivo');
      setMessageType('error');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('El archivo debe contener al menos una fila de datos');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const rows: ExcelRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length === headers.length) {
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });

          rows.push({
            customer_name: row.customer_name || row.nombre || '',
            amount: parseFloat(row.amount || row.monto || '0'),
            currency: row.currency || row.moneda || 'USD',
            card_number: row.card_number || row.numero_tarjeta || '',
            card_expiry_month: row.card_expiry_month || row.mes_expiracion || '',
            card_expiry_year: row.card_expiry_year || row.año_expiracion || '',
            cvv: row.cvv || '',
            retry_attempts: parseInt(row.retry_attempts || row.intentos || '1'),
            retry_interval_minutes: parseInt(row.retry_interval_minutes || row.intervalo_minutos || '30'),
          });
        }
      }

      const scheduledCharges = rows.map(row => ({
        batch_name: batchName,
        customer_name: row.customer_name,
        amount: row.amount,
        currency: row.currency,
        card_number: row.card_number,
        card_expiry_month: row.card_expiry_month,
        card_expiry_year: row.card_expiry_year,
        cvv: row.cvv,
        retry_attempts: row.retry_attempts,
        retry_interval_minutes: row.retry_interval_minutes,
        current_attempt: 0,
        status: 'pending',
        uploaded_by: user?.id,
        next_attempt_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('scheduled_charges')
        .insert(scheduledCharges);

      if (error) throw error;

      setMessage(`Se cargaron exitosamente ${rows.length} registros`);
      setMessageType('success');
      setBatchName('');
      e.target.value = '';
    } catch (error: any) {
      setMessage(error.message || 'Error al procesar el archivo');
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `customer_name,amount,currency,card_number,card_expiry_month,card_expiry_year,cvv,retry_attempts,retry_interval_minutes
Juan Pérez,100.00,USD,4111111111111111,12,2025,123,3,30
María García,250.50,USD,5555555555554444,06,2026,456,2,60`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_cargos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Alta de Archivo de Cargos Programados</h2>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            A continuación suba su archivo en formato de Microsoft Excel para dar de alta los cargos programados
          </p>

          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Descargue aquí su archivo en formato Excel</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de archivo aquí
            </label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="Ingrese el nombre del lote"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={!batchName.trim() || uploading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Examinar
            </button>
            <button
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={!batchName.trim() || uploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Cargando...' : 'Cargar'}
            </button>
          </div>

          <input
            id="file-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {message && (
          <div className={`mt-6 p-4 rounded-md flex items-start gap-2 ${
            messageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <h3 className="font-medium text-blue-900 mb-2">Formato del archivo:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Archivo CSV o Excel (.csv, .xlsx, .xls)</li>
            <li>• Primera fila: encabezados de columnas</li>
            <li>• Columnas requeridas: customer_name, amount, currency, card_number, card_expiry_month, card_expiry_year, cvv, retry_attempts, retry_interval_minutes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
