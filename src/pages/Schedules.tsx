import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

type Schedule = {
  id: string;
  customer_id: string;
  amount: number;
  currency: string;
  start_date: string;
  frequency: string;
  attempts: number;
  status: 'active' | 'inactive';
  subscriptionId?: string | null;
  customers: {
    name: string;
    email: string;
    kushki_token?: string;
  } | null;
  address: string;
  first_name: string;
  last_name: string;
  bin: string;
  brand: string;
  city: string;
  country: string;
  email: string;
  kushki_token: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardholder_name: string;
  card_number: string;
};

const Schedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>('active');
  const [searchTerm, setSearchTerm] = useState('');
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10); // rows per page
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSchedules();
  }, [page]);

  const fetchSchedules = async () => {
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('schedules')
      .select(
        `
        *,
        customers (
          name,
          email,
          kushki_token
        )
      `,
        { count: 'exact' }
      )
      .order('start_date', { ascending: false })
      .range(from, to);

    if (!error && data) {
      setSchedules(data as Schedule[]);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    }
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const handleBulkAction = async () => {
    const chosen = schedules.filter((s) => selected.has(s.id));

    for (const schedule of chosen) {
      if (bulkStatus === 'active' && schedule.subscriptionId === null) {
        try {
          // 1. Create Kushki token
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

          const tokenData = await tokenRes.json();
          const kushkiToken = tokenData.token;

          // 2. Use token to create subscription
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
                periodicity: (schedule.frequency || 'monthly').toLowerCase(),
                contactDetails: {
                  documentType: 'CC',
                  documentNumber: '1000000000',
                  email: schedule.email,
                  firstName: schedule.first_name || 'First',
                  lastName: schedule.last_name || 'Last',
                  phoneNumber: 'N/A',
                },
                amount: {
                  subtotalIva: 0,
                  subtotalIva0: schedule.amount,
                  iva: 0,
                  ice: 0,
                  currency: schedule.currency,
                },
                startDate: new Date().toISOString().slice(0, 10),
              }),
            }
          );

          const subscriptionResult = await subRes.json();
          console.log('Created subscription:', subscriptionResult);

          if (subRes.ok) {
            // 3. Update Supabase
            await supabase
              .from('schedules')
              .update({
                status: 'active',
                subscriptionId: subscriptionResult.subscriptionId,
              })
              .eq('id', schedule.id);
          }
        } catch (err) {
          console.error('Error activating schedule', schedule.id, err);
        }
      } else if (bulkStatus === 'inactive' && schedule.subscriptionId !== null) {
        const inactiveRes = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/inactive-schedule`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              subscriptionId: schedule.subscriptionId,
            }),
          }
        );

        const inactiveData = await inactiveRes.text();

        if (inactiveRes.ok) {
          await supabase
            .from('schedules')
            .update({
              status: 'inactive',
              subscriptionId: null,
            })
            .eq('id', schedule.id);
        }
      }
    }

    setSelected(new Set());
    fetchSchedules();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive'> = {
      active: 'default',
      inactive: 'destructive',
    };

    return (
      <Badge
        variant={variants[status]}
        className={status === 'active' ? 'bg-success text-success-foreground' : ''}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredSchedules = schedules.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.customers?.name?.toLowerCase().includes(term) ||
      s.customers?.email?.toLowerCase().includes(term) ||
      s.currency.toLowerCase().includes(term) ||
      s.frequency.toLowerCase().includes(term)
    );
  });

  const nextPage = () => setPage((p) => Math.min(p + 1, totalPages));
  const prevPage = () => setPage((p) => Math.max(p - 1, 1));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CalendarIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Cargos programados</h1>
          <p className="text-muted-foreground">Gestione sus pagos recurrentes</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Horarios activos</CardTitle>
          <div className="flex gap-3 items-center">
            <Input
              placeholder="Buscar horarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Select value={bulkStatus} onValueChange={(val) => setBulkStatus(val)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="inactive">Inactiva</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleBulkAction} disabled={selected.size === 0}>
              Aplicar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      checked={selected.size === schedules.length && schedules.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelected(new Set(schedules.map((s) => s.id)));
                        } else {
                          setSelected(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Fecha de inicio</TableHead>
                  <TableHead>Frecuencia</TableHead>
                  <TableHead>Intentos</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Cargando horarios...
                    </TableCell>
                  </TableRow>
                ) : filteredSchedules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No se encontraron horarios
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selected.has(schedule.id)}
                          onChange={() => toggleSelect(schedule.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{schedule.customers?.name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">
                            {schedule.customers?.email || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        ${schedule.amount.toFixed(2)} {schedule.currency}
                      </TableCell>
                      <TableCell>{format(new Date(schedule.start_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="capitalize">{schedule.frequency}</TableCell>
                      <TableCell>{schedule.attempts}</TableCell>
                      <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={prevPage} disabled={page === 1}>
                Previa
              </Button>

              <Input
                type="number"
                min={1}
                max={totalPages}
                value={page}
                onChange={(e) => {
                  let newPage = parseInt(e.target.value, 10);
                  if (isNaN(newPage)) newPage = 1;
                  if (newPage < 1) newPage = 1;
                  if (newPage > totalPages) newPage = totalPages;
                  setPage(newPage);
                }}
                className="w-16 text-center"
              />

              <Button variant="outline" size="sm" onClick={nextPage} disabled={page === totalPages}>
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Schedules;
