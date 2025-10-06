# TOBB_PAYFLOW

**TOBB_PAYFLOW** is a payment collection management platform built to replace Bluemon’s electronic collection system.  
It streamlines the bulk collection process between **TOBB** and **Kushki**, offering automated transactions, real-time status tracking, and visual analytics through a clean and modern web interface.

---

## Tech Stack

**Frontend**

- [Vite](https://vitejs.dev/)
- [React (TypeScript)](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

**Backend / Database**

- [Supabase](https://supabase.com/)

---

## Integrated APIs (KUSHKI)

The following **Kushki APIs** are integrated to handle transactions and status verification:

1. **Get Recurring Charge Token API**  
   → Request a recurring charge token that can later be used to create a recurring charge of a customer using the /subscriptions/v1/card endpoint.
   `GET https://api-uat.kushkipagos.com/subscriptions/v1/card/tokens`

2. **Create a recurring charge**
   → Create a recurring charge with a token provided by Kushki which represents the customer's credit card.
   `POST https://api-uat.kushkipagos.com/subscriptions/v1/card`

3. **Cancel a recurring charge**
   → Cancel a recurring charge identified by its subscriptionId.
   `DELETE https://api-uat.kushkipagos.com/subscriptions/v1/card/{subscriptionId}`

4. **Get Transactions List v2 API**  
   → Retrieve a paginated list of transactions for a specific merchant using the Get Transaction List v2 API. This version supports both card-present and card-not-present transactions, as well as filtering by pay-ins and pay-outs. Transactions are returned in descending order, with the most recent ones appearing first.  
   `GET https://api-uat.kushkipagos.com/analytics/v2/transactions-list`

---

## Project Overview

### Purpose

The purpose of this project is to **replace Bluemon's existing electronic collection system**, which currently acts as a middleware between **TOBB** and **Kushki** for payment collection.

Currently, TOBB uploads customer banking information via an Excel spreadsheet to the Bluemon platform. The platform then connects to Kushki to process payments, displaying the results (approved, pending, rejected, etc.) along with each person’s banking details.

The new TOBB_PAYFLOW platform replicates and enhances this process — adding automation, analytics, and scheduling functionalities.

---

## Key Features

### 1. Bulk Upload

- Upload Excel spreadsheets containing customer banking data.
- Each record can define custom recharge frequencies.

### 2. Bulk Collections

- Execute mass payment collections directly via Kushki.

### 3. Status Screen

- View all transactions in real-time with details such as:
  - **Approved**, **Rejected**, or **Insufficient Funds**.

### 4. Dashboard & Reports

- Approved transactions that day
- Daily approved transactions and total sales amount.
- Comparative monthly sales graph.
- Pie chart showing acceptance vs rejection percentage.

### 5. Reports & Downloads

- Download reports in **PDF** or **XLSX** format.

### 6. Smart Tools

- **Search** and **filter** transactions by status.
- **Update** and **refresh** transactions in real time.

### 7. Scheduled Charges

- Upload Excel files containing **pre-scheduled** charge data.
- Automate the recurring collection process.

---

## Installation & Setup Guide

1. Install Dependencies
   npm install

2. Run the Development Server

npm run dev

This will start the app in development mode using Vite.

3. Build for Production

npm run build

4. Preview Production Build
   npm run preview

5. Lint the Code
   npm run lint

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Run the project in development mode  |
| `npm run build`     | Build the project for production     |
| `npm run build:dev` | Build with development configuration |
| `npm run preview`   | Preview the production build locally |
| `npm run lint`      | Run ESLint for code quality checks   |
