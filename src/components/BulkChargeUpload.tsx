import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Toaster } from '@/components/ui/toaster';
import { Progress } from '@/components/ui/progress';

const BulkChargeUpload = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, successful: 0, failed: 0 });
  const [errors, setErrors] = useState<Array<{ row: number; error: string }>>([]);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (selectedFile: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload an Excel file (.xls or .xlsx)',
      });
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setErrors([]);
      setProgress({ current: 0, total: 0, successful: 0, failed: 0 });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    if (validateFile(droppedFile)) {
      setFile(droppedFile);
      setErrors([]);
      setProgress({ current: 0, total: 0, successful: 0, failed: 0 });
    }
  };

  const createKushkiToken = async (schedule: any) => {
    try {
      const tokenRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-kushki-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            cardholderName: schedule.cardholder_name,
            cardNumber: schedule.card_number,
            expiryMonth: schedule.expiryMonth?.toString(),
            expiryYear: schedule.expiryYear?.toString(),
            currency: schedule.currency,
          }),
        }
      );

      if (!tokenRes.ok) {
        const errorData = await tokenRes.json();
        throw new Error(errorData.message || 'Failed to create Kushki token');
      }

      const tokenData = await tokenRes.json();
      return tokenData.token;
    } catch (error) {
      throw new Error(`Token creation failed: ${(error as Error).message}`);
    }
  };

  const createSubscription = async (kushkiToken: string, schedule: any) => {
    try {
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
              email: schedule.email,
              firstName: schedule.first_name || 'First',
              lastName: schedule.last_name || 'Last',
            },
            amount: {
              subtotalIva: 1,
              subtotalIva0: schedule.amount,
              iva: 1,
              ice: 1,
              currency: schedule.currency,
            },
            startDate: new Date().toISOString().slice(0, 10),
          }),
        }
      );

      if (!subRes.ok) {
        const errorData = await subRes.json();
        throw new Error(errorData.message || 'Failed to create subscription');
      } else {
        const { error: scheduleError } = await supabase.from('schedules').insert(schedule);
        if (scheduleError) throw scheduleError;
      }

      const subscriptionResult = await subRes.json();
      return subscriptionResult;
    } catch (error) {
      throw new Error(`Subscription creation failed: ${(error as Error).message}`);
    }
  };

  function isValidDate(dateStr: string) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return false;

    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(dateStr);
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() + 1 === month &&
      date.getUTCDate() === day
    );
  }

  function isValidTime(timeStr: string) {
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    return timeRegex.test(timeStr);
  }

  function excelTimeToHMS(excelTime: string) {
    const totalSeconds = Math.round(Number(excelTime) * 24 * 60 * 60);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  function excelDateToYMD(excelDate: string) {
    const jsDate = new Date((Number(excelDate) - 25569) * 86400 * 1000);
    const year = jsDate.getUTCFullYear();
    const month = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(jsDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No file selected',
        description: 'Please select an Excel file to upload',
      });
      return;
    }

    setUploading(true);
    setErrors([]);
    const errorList: Array<{ row: number; error: string }> = [];

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('User not logged in');

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      if (rows.length === 0) throw new Error('Excel file is empty');

      setProgress({ current: 0, total: rows.length, successful: 0, failed: 0 });

      const customersPayload = rows
        .map((r) => ({
          name: `${r['FIRST NAME'] || ''} ${r['LAST NAME'] || ''}`.trim(),
          email: r['EMAIL']?.toString().trim() || null,
          address: r['ADDRESS'] || null,
          city: r['CITY'] || null,
          country: r['COUNTRY'] || null,
          kushki_token: r['KUSHKI_TOKEN'] || null,
          bin: r['BIN'] || null,
          last4: r['CARD NUMBER']?.toString().slice(-4) || null,
          brand: r['BRAND'] || null,
          updated_at: new Date().toISOString(),
        }))
        .filter((c) => c.email);

      const { data: upsertedCustomers, error: upsertError } = await supabase
        .from('customers')
        .upsert(customersPayload, { onConflict: 'email' })
        .select('id,email');

      if (upsertError) throw upsertError;

      const customerMap: Record<string, string> = {};
      upsertedCustomers.forEach((c) => {
        if (c.email) customerMap[c.email] = c.id;
      });

      const { data: job, error: jobError } = await supabase
        .from('collection_jobs')
        .insert({
          filename: file.name,
          uploaded_by: user.id,
          total_entries: rows.length,
          processed_count: 0,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError) throw jobError;

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const email = r['EMAIL']?.toString().trim();

        if (!customerMap[email]) {
          errorList.push({ row: i + 2, error: 'Customer not found in database' });
          failCount++;
          setProgress({
            current: i + 1,
            total: rows.length,
            successful: successCount,
            failed: failCount,
          });
          continue;
        }

        try {
          const scheduleData = {
            customer_id: customerMap[email],
            collection_job_id: job.id,
            amount: Number(r['AMOUNT'] || 0),
            currency: r['CURRENCY'] || 'USD',
            start_date: isValidDate(r['START DATE'])
              ? r['START DATE']
              : excelDateToYMD(r['START DATE']) || null,
            time_of_day: isValidTime(r['TIME']) ? r['TIME'] : excelTimeToHMS(r['TIME']) || null,
            frequency: (r['FREQUENCY'] || 'monthly').toLowerCase(),
            attempts: Number(r['ATTEMPTS'] || 1),
            attempt_interval_minutes: Number(r['ATTEMPTS TIME ON MINUTES'] || 5),
            reference: r['REFERENCE'] || '',
            status: 'active',
            card_number: r['CARD NUMBER']?.toString() || '',
            cardholder_name: r['CARDHOLDER NAME'] || '',
            movement: r['MOVEMENT'] || '',
            expiryMonth: r['EXPIRATION MONTH'] || '',
            expiryYear: r['EXPIRATION YEAR'] || '',
            first_name: r['FIRST NAME'] || '',
            last_name: r['LAST NAME'] || '',
            email: email,
            address: r['ADDRESS'] || null,
            city: r['CITY'] || null,
            country: r['COUNTRY'] || null,
            kushki_token: null,
            subscriptionId: null,
            bin: null,
            last4: r['CARD NUMBER']?.toString().slice(-4) || null,
            brand: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const kushkiToken = await createKushkiToken(scheduleData);
          scheduleData.kushki_token = kushkiToken;

          const subscription = await createSubscription(kushkiToken, scheduleData);
          scheduleData.subscriptionId = subscription.subscriptionId || subscription.id;

          successCount++;
        } catch (error) {
          console.error(`Error processing row ${i + 2}:`, error);
          errorList.push({ row: i + 2, error: (error as Error).message });
          failCount++;
        }

        setProgress({
          current: i + 1,
          total: rows.length,
          successful: successCount,
          failed: failCount,
        });
      }

      toast({
        title: 'Processing complete',
        description: `Successfully processed ${successCount} out of ${rows.length} entries. ${
          failCount > 0 ? `${failCount} failed.` : ''
        }`,
        variant: successCount === rows.length ? 'default' : 'destructive',
      });

      if (successCount === rows.length) {
        setFile(null);
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: (err as Error).message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alta de Archivo de Cargos Programados</h1>
        <p className="text-muted-foreground">
          A continuación suba su archivo en formato de Microsoft Excel para dar de alta los cargos
          programados
        </p>
      </div>

      <Toaster />
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          NÚMERO DE TARJETA, FECHA DE VENCIMIENTO, MES, AÑO DE VENCIMIENTO, NOMBRE DEL TITULAR DE LA
          TARJETA, NOMBRE, APELLIDO, CORREO ELECTRÓNICO, DIRECCIÓN, CIUDAD, PAÍS, MONTO, MONEDA,
          FECHA DE INICIO, HORA, INTENTOS, TIEMPO DE INTENTOS EN MINUTOS, MOVIMIENTO, REFERENCIA
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-4">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-green-500" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button variant="outline" onClick={() => setFile(null)} disabled={uploading}>
                  Remove File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium mb-2">
                    {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">or</p>
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-primary hover:underline">Choose a file</span>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Supports: .xls, .xlsx (Max 10MB)</p>
              </div>
            )}
          </div>

          {uploading && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  Processing: {progress.current} / {progress.total}
                </span>
                <span>{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} />
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Successful: {progress.successful}
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-4 w-4" />
                  Failed: {progress.failed}
                </span>
              </div>
            </div>
          )}

          <div className="w-full text-center">
            <button
              onClick={handleUpload}
              className={`px-4 py-2 rounded-md transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300`}
              disabled={!file || uploading}
            >
              {uploading ? 'Processing...' : 'Upload and Process'}
            </button>
          </div>

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Errors encountered:</div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {errors.map((err, idx) => (
                    <div key={idx} className="text-sm">
                      Row {err.row}: {err.error}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkChargeUpload;
