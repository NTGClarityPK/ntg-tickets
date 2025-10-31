# Migration Examples: Prisma to Supabase

This document provides examples of how to convert Prisma queries to Supabase queries.

## Basic Operations

### 1. Find Many (with filters)

**Prisma:**
```typescript
const users = await prisma.user.findMany({
  where: {
    isActive: true,
    roles: { has: 'ADMIN' },
  },
  include: {
    requestedTickets: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 10,
  skip: 0,
});
```

**Supabase:**
```typescript
const { data: users, error } = await supabase
  .from('users')
  .select(`
    *,
    requested_tickets:tickets!requester_id (*)
  `)
  .eq('is_active', true)
  .contains('roles', ['ADMIN'])
  .order('created_at', { ascending: false })
  .range(0, 9);

if (error) throw error;
```

### 2. Find Unique

**Prisma:**
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    requestedTickets: {
      where: { status: 'OPEN' },
    },
  },
});
```

**Supabase:**
```typescript
const { data: user, error } = await supabase
  .from('users')
  .select(`
    *,
    requested_tickets:tickets!requester_id (*)
  `)
  .eq('id', userId)
  .eq('requested_tickets.status', 'OPEN')
  .single();

if (error) throw error;
```

### 3. Create

**Prisma:**
```typescript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    password: hashedPassword,
    roles: ['END_USER'],
    isActive: true,
  },
});
```

**Supabase:**
```typescript
const { data: user, error } = await supabase
  .from('users')
  .insert({
    email: 'user@example.com',
    name: 'John Doe',
    password: null, // Handled by Supabase Auth
    roles: ['END_USER'],
    is_active: true,
  })
  .select()
  .single();

if (error) throw error;
```

### 4. Update

**Prisma:**
```typescript
const user = await prisma.user.update({
  where: { id: userId },
  data: {
    name: 'Updated Name',
    isActive: false,
  },
});
```

**Supabase:**
```typescript
const { data: user, error } = await supabase
  .from('users')
  .update({
    name: 'Updated Name',
    is_active: false,
    updated_at: new Date().toISOString(),
  })
  .eq('id', userId)
  .select()
  .single();

if (error) throw error;
```

### 5. Delete

**Prisma:**
```typescript
await prisma.user.delete({
  where: { id: userId },
});
```

**Supabase:**
```typescript
const { error } = await supabase
  .from('users')
  .delete()
  .eq('id', userId);

if (error) throw error;
```

### 6. Upsert

**Prisma:**
```typescript
const user = await prisma.user.upsert({
  where: { email: 'user@example.com' },
  update: { name: 'Updated' },
  create: {
    email: 'user@example.com',
    name: 'New User',
    password: hashedPassword,
  },
});
```

**Supabase:**
```typescript
// Supabase doesn't have native upsert, so we check and insert/update
const { data: existing } = await supabase
  .from('users')
  .select('id')
  .eq('email', 'user@example.com')
  .single();

if (existing) {
  const { data: user, error } = await supabase
    .from('users')
    .update({ name: 'Updated' })
    .eq('email', 'user@example.com')
    .select()
    .single();
  if (error) throw error;
} else {
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: 'user@example.com',
      name: 'New User',
    })
    .select()
    .single();
  if (error) throw error;
}
```

## Complex Queries

### 7. Relations and Joins

**Prisma:**
```typescript
const tickets = await prisma.ticket.findMany({
  where: {
    status: 'OPEN',
    requester: {
      roles: { has: 'END_USER' },
    },
  },
  include: {
    requester: true,
    assignedTo: true,
    category: true,
    subcategory: true,
    comments: {
      orderBy: { createdAt: 'desc' },
      take: 5,
    },
  },
});
```

**Supabase:**
```typescript
const { data: tickets, error } = await supabase
  .from('tickets')
  .select(`
    *,
    requester:users!requester_id (*),
    assigned_to:users!assigned_to_id (*),
    category:categories (*),
    subcategory:subcategories (*),
    comments (
      *
    )
  `)
  .eq('status', 'OPEN')
  .eq('requester.roles', 'END_USER') // Note: array filtering might need RPC
  .order('created_at', { ascending: false });

if (error) throw error;

// Filter comments after (Supabase doesn't support nested limits easily)
tickets.forEach(ticket => {
  ticket.comments = ticket.comments?.slice(0, 5).reverse() || [];
});
```

### 8. Aggregations

**Prisma:**
```typescript
const stats = await prisma.ticket.aggregate({
  _count: { id: true },
  _avg: { priority: true }, // If priority is numeric
  where: {
    status: 'OPEN',
  },
});
```

**Supabase:**
```typescript
// Supabase doesn't have native aggregation, use RPC or do it client-side
const { count, error } = await supabase
  .from('tickets')
  .select('*', { count: 'exact', head: true })
  .eq('status', 'OPEN');

if (error) throw error;

// For more complex aggregations, create a PostgreSQL function and call via RPC
const { data: avgData, error: avgError } = await supabase.rpc('get_ticket_stats', {
  status_filter: 'OPEN',
});
```

### 9. Transactions

**Prisma:**
```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: {...} });
  await tx.ticket.create({
    data: {
      requesterId: user.id,
      ...
    },
  });
});
```

**Supabase:**
```typescript
// Create a PostgreSQL function for complex transactions
// Then call it via RPC:
const { data, error } = await supabase.rpc('create_user_and_ticket', {
  user_data: {...},
  ticket_data: {...},
});

// Or use multiple calls (not atomic):
const { data: user, error: userError } = await supabase
  .from('users')
  .insert({...})
  .select()
  .single();

if (userError) throw userError;

const { data: ticket, error: ticketError } = await supabase
  .from('tickets')
  .insert({
    requester_id: user.id,
    ...
  })
  .select()
  .single();

if (ticketError) {
  // Rollback - delete user
  await supabase.from('users').delete().eq('id', user.id);
  throw ticketError;
}
```

## Column Name Mapping

Supabase uses snake_case by default, while Prisma typically uses camelCase:

| Prisma (camelCase) | Supabase (snake_case) |
|-------------------|----------------------|
| `userId` | `user_id` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |
| `isActive` | `is_active` |
| `ticketNumber` | `ticket_number` |
| `requesterId` | `requester_id` |
| `assignedToId` | `assigned_to_id` |
| `categoryId` | `category_id` |
| `subcategoryId` | `subcategory_id` |
| `dueDate` | `due_date` |
| `closedAt` | `closed_at` |
| `uploadedBy` | `uploaded_by` |
| `fileUrl` | `file_url` |
| `fileSize` | `file_size` |
| `fileType` | `file_type` |

## Tips

1. **Use TypeScript types**: Generate types from Supabase for type safety
2. **Handle errors**: Always check for `error` in Supabase responses
3. **Use `.single()`**: For queries that should return one result
4. **Relations**: Use Supabase's foreign table syntax for joins
5. **Pagination**: Use `.range(from, to)` instead of `.skip()` and `.take()`
6. **RLS Policies**: Set up Row Level Security policies in Supabase for access control
7. **RPC Functions**: For complex queries, create PostgreSQL functions and call via `.rpc()`

## Migration Checklist per Service

For each service file:
- [ ] Replace `PrismaService` with `SupabaseService`
- [ ] Convert all `prisma.model.*` calls to `supabase.from('table')`
- [ ] Update column names from camelCase to snake_case
- [ ] Update include/select statements for relations
- [ ] Add error handling for Supabase responses
- [ ] Test all endpoints
- [ ] Update TypeScript types

