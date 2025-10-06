import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload as UploadIcon, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Upload = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast({
        variant: 'destructive',
        title: 'Tipo de archivo no válido',
        description: 'Suba un archivo Excel (.xls o .xlsx)',
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No hay ningún archivo seleccionado',
        description: 'Seleccione un archivo de Excel para cargar.',
      });
      return;
    }

    setUploading(true);
    const startTime = performance.now();

    try {
      // 1. Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuario no conectado');

      // 2. Parse Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      if (rows.length === 0) throw new Error('El archivo de Excel está vacío');

      // 4. Prepare customer payload
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

      // 5. Upsert customers
      const { data: upsertedCustomers, error: upsertError } = await supabase
        .from('customers')
        .upsert(customersPayload, { onConflict: 'email' })
        .select('id,email');

      if (upsertError) throw upsertError;

      // Map email → customer_id
      const customerMap: Record<string, string> = {};
      upsertedCustomers.forEach((c) => {
        if (c.email) customerMap[c.email] = c.id;
      });

      // 6. Create collection job
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

      // 7. Prepare schedules
      const now = new Date().toISOString();
      const schedulesPayload = rows
        .filter((r) => customerMap[r['EMAIL']?.toString().trim()])
        .map((r) => ({
          customer_id: customerMap[r['EMAIL']?.toString().trim()],
          collection_job_id: job.id,
          amount: Number(r['AMOUNT'] || 0),
          currency: r['CURRENCY'] || 'USD',
          start_date: r['START DATE'] || null,
          time_of_day: r['TIME'] || null,
          frequency: (r['FREQUENCY'] || 'monthly').toLowerCase(),
          attempts: Number(r['ATTEMPTS'] || 1),
          attempt_interval_minutes: Number(r['ATTEMPTS TIME ON MINUTES'] || 5),
          reference: r['REFERENCE'] || '',
          status: 'inactive',
          card_number: r['CARD NUMBER']?.toString() || '',
          cardholder_name: r['CARDHOLDER NAME'] || '',
          movement: r['MOVEMENT'] || '',
          expiryMonth: r['EXPIRATION MONTH'] || '',
          expiryYear: r['EXPIRATION YEAR'] || '',

          first_name: `${r['FIRST NAME'] || ''}`,
          last_name: `${r['LAST NAME'] || ''}`,
          email: r['EMAIL']?.toString().trim() || null,
          address: r['ADDRESS'] || null,
          city: r['CITY'] || null,
          country: r['COUNTRY'] || null,
          kushki_token: null,
          subscriptionId: null,
          bin: null,
          last4: r['CARD NUMBER']?.toString().slice(-4) || null,
          brand: null,
          created_at: now,
          updated_at: now,
        }));

      // 8. Insert schedules
      const { error: scheduleError } = await supabase.from('schedules').insert(schedulesPayload);
      if (scheduleError) throw scheduleError;

      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      toast({
        title: 'Subida exitosa',
        description: `${file.name} procesado (${rows.length} entradas) en ${duration}s`,
      });

      setFile(null);
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
        <h1 className="text-3xl font-bold">Subir archivo de cobro</h1>
        <p className="text-muted-foreground">
          Suba un archivo de Excel con la información de pago del cliente.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Excel debe contener: Nombre del cliente, Correo electrónico, Dirección, Ciudad, País,
          Número de tarjeta, BIN, MARCA, Importe, Moneda, Fecha de inicio, Hora,
          Frecuencia, Intentos, Referencia.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Subir archivo Excel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            {file ? (
              <div className="space-y-4">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-green-500" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <Button variant="outline" onClick={() => setFile(null)}>
                  Eliminar archivo
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <div>
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-primary hover:underline">Elige un archivo</span> o
                    arrástralo
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".xls,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Soportes: .xls, .xlsx (Máximo 10MB)</p>
              </div>
            )}
          </div>

          <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
            {uploading ? 'Procesando...' : 'Cargar y procesar'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Upload;
