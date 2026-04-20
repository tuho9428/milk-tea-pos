# Milk Tea POS

`milk-tea-pos` is a Next.js point-of-sale demo for a milk tea shop. It includes a customer ordering flow and an admin workspace for managing menu items, modifiers, orders, and store settings.

## Overview

This project is built around two sides of the product:

- A customer-facing ordering experience for browsing the menu, customizing drinks, and placing orders
- An admin-facing operations experience for tracking orders, updating statuses, and maintaining store data

## For Users

### Customer Features

- Browse the menu and open item detail pages
- Customize drinks with modifier groups such as size, sugar, ice, and toppings
- Add items to the cart and review selections before checkout
- Submit an order through the checkout flow
- View an order confirmation page after placing an order

### Admin Features

- View a dashboard with order totals, pending/completed counts, revenue, and recent orders
- Review all incoming orders in a dedicated orders list
- Track operational workflow on a board grouped by order status
- Open order details and update order status
- Manage menu items and their availability
- Manage reusable modifier templates and options
- Update store settings such as tax rate

## For Developers

### Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Prisma ORM
- PostgreSQL
- Tailwind CSS 4
- shadcn/ui components

### Current Feature Set

- Customer storefront with menu, cart, checkout, and order confirmation flow
- Admin dashboard with order and revenue summaries
- Orders list with detailed order views
- Kanban-style orders board for kitchen and fulfillment workflow
- Menu management for categories and items
- Modifier template management for reusable drink customization
- Store settings with configurable tax rate
- Intercepted modal routes for menu item and admin order detail views

### Data Model

The Prisma schema currently includes:

- `StoreSettings`
- `Category`
- `MenuItem`
- `ModifierTemplate`
- `ModifierTemplateOption`
- `MenuItemModifierTemplate`
- `ModifierGroup`
- `ModifierOption`
- `Order`
- `OrderItem`
- `OrderItemModifier`

Order status values:

- `PENDING`
- `PAID`
- `MAKING`
- `READY`
- `COMPLETED`
- `CANCELED`

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- A PostgreSQL database

### Environment Variables

Create a local environment file and set:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

The app and Prisma client require `DATABASE_URL` to be present.

### Install Dependencies

```bash
pnpm install
```

### Run the App

```bash
pnpm dev
```

Open `http://localhost:3000`.

### Seed Sample Data

```bash
pnpm db:seed
```

### Production Build

```bash
pnpm build
pnpm start
```

## Scripts

- `pnpm dev` starts the local Next.js development server
- `pnpm build` generates Prisma client output and creates a production build
- `pnpm start` runs the production server
- `pnpm lint` runs ESLint
- `pnpm db:seed` inserts sample menu and order data

## Project Structure

```text
app/
  page.tsx                Home page
  menu/                   Customer menu and product detail flow
  cart/                   Cart experience
  checkout/               Checkout UI and order creation
  order/[id]/             Order confirmation page
  admin/                  Admin dashboard and management tools
prisma/
  schema.prisma           Database schema
  seed.ts                 Seed data script
components/
  ui/                     Reusable UI primitives
lib/
  prisma.ts               Prisma client setup
  store-settings.ts       Store settings helpers
  tax.ts                  Pricing and tax helpers
```

## Notes

- The app uses Prisma client output generated into `app/generated/prisma`
- Some flows are demo-oriented, but the app already uses persisted data for menu, settings, and orders
- The homepage still presents the project as a static demo, even though the admin and order flows are database-backed

## Future Ideas

- Kitchen ticket printing
- Order timing and SLA tracking
- Inventory and stock controls
- Sales analytics by date, item, and category
- Cashier mode for in-store ordering
- Loyalty points and customer profiles
