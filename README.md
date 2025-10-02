# TOBB Payment Platform

Plataforma de pagos electrónicos que reemplaza a Bluemon y se conecta directamente con Kushki para procesar cobros masivos.

## Características Principales

### 1. Dashboard con Reportes
- Transacciones aprobadas del día
- Monto de ventas del día
- Gráfico comparativo de ventas por mes
- Gráfico de porcentaje de aceptación/rechazo
- Gráfico de aceptación por banco

### 2. Gestión de Transacciones
- Lista completa de todas las transacciones
- Filtros: Todas, Aprobadas, Rechazadas
- Buscador por cliente, banco, número de tarjeta
- Visualización de códigos ISO con mensajes descriptivos
- Exportación de reportes en CSV
- Actualización en tiempo real

### 3. Carga Masiva de Cobros
- Carga de archivos Excel/CSV con datos bancarios
- Configuración de reintentos automáticos
- Configuración de intervalos entre reintentos
- Validación de formato de archivo

### 4. Cargos Programados
- Visualización de todos los cargos pendientes
- Ejecución manual de cobros
- Reintentos automáticos según configuración
- Estado de cada cargo (pendiente, procesando, completado, fallido)
- Gestión de lotes de cobros

### 5. Integración con Kushki
- Conexión directa mediante Edge Functions
- Tokenización de tarjetas
- Procesamiento de pagos recurrentes
- Manejo de códigos de error ISO
- Registro completo de transacciones

## Estructura de la Base de Datos

### Tabla: users
- Gestión de usuarios del sistema
- Autenticación con Supabase Auth

### Tabla: transactions
- Registro de todas las transacciones procesadas
- Incluye información del cliente, banco, tarjeta
- Códigos ISO con mensajes descriptivos
- Estado de cada transacción

### Tabla: scheduled_charges
- Cargos programados para ejecución
- Configuración de reintentos
- Tracking de intentos realizados
- Estado y próxima ejecución

## Tecnologías Utilizadas

- **Frontend**: React + TypeScript + Vite
- **Estilos**: TailwindCSS
- **Base de Datos**: Supabase PostgreSQL
- **Autenticación**: Supabase Auth
- **Backend**: Supabase Edge Functions
- **Procesamiento de Pagos**: Kushki API

## Formato de Archivo para Carga Masiva

El archivo CSV debe contener las siguientes columnas:

```csv
customer_name,amount,currency,card_number,card_expiry_month,card_expiry_year,cvv,retry_attempts,retry_interval_minutes
```

### Ejemplo:
```csv
customer_name,amount,currency,card_number,card_expiry_month,card_expiry_year,cvv,retry_attempts,retry_interval_minutes
Juan Pérez,100.00,USD,4111111111111111,12,2025,123,3,30
María García,250.50,USD,5555555555554444,06,2026,456,2,60
```

### Descripción de Campos:
- **customer_name**: Nombre completo del cliente
- **amount**: Monto a cobrar
- **currency**: Moneda (USD, MXN, etc.)
- **card_number**: Número de tarjeta completo
- **card_expiry_month**: Mes de expiración (01-12)
- **card_expiry_year**: Año de expiración (YYYY)
- **cvv**: Código de seguridad
- **retry_attempts**: Número de reintentos si falla
- **retry_interval_minutes**: Minutos entre cada reintento

## Códigos ISO Implementados

El sistema traduce automáticamente los códigos ISO a mensajes descriptivos:

- **00**: Transacción Aprobada
- **05**: Tarjeta sin Fondos
- **51**: Fondos Insuficientes
- **54**: Tarjeta Expirada
- **Y muchos más...**

## Configuración de Kushki

Para configurar las credenciales de Kushki, debe establecer las siguientes variables de entorno en Supabase:

1. Ir a Project Settings > Edge Functions
2. Agregar las siguientes secrets:
   - `KUSHKI_PUBLIC_KEY`: Tu Public Merchant ID de Kushki
   - `KUSHKI_PRIVATE_KEY`: Tu Private Merchant ID de Kushki

## Flujo de Trabajo

1. **Carga de datos**: El usuario carga un archivo Excel con la información de los clientes
2. **Programación**: Los cobros se almacenan como cargos programados
3. **Ejecución**: Se pueden ejecutar manualmente o automáticamente
4. **Procesamiento**: El sistema se conecta con Kushki para tokenizar y cobrar
5. **Registro**: Cada transacción se registra con su estado y detalles
6. **Reintentos**: Si falla por fondos insuficientes, se reintenta automáticamente
7. **Reportes**: Todo se visualiza en el dashboard y lista de transacciones

## Ventajas sobre Bluemon

1. **Costo**: Eliminación del intermediario reduce costos
2. **Control**: Acceso directo a la información de transacciones
3. **Personalización**: Interfaz adaptada específicamente para TOBB
4. **Flexibilidad**: Fácil agregar nuevas funcionalidades
5. **Transparencia**: Visibilidad completa del proceso de cobro

## Seguridad

- Autenticación con Supabase Auth
- Row Level Security (RLS) en todas las tablas
- Conexión segura con Kushki mediante Edge Functions
- Las credenciales nunca se exponen en el frontend
- Almacenamiento seguro de datos sensibles
