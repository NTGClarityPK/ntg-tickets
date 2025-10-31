# Common Migration Patterns: Prisma → Supabase

This document shows common patterns for migrating Prisma queries to Supabase.

## Column Name Mapping Helper

```typescript
// Common mappings
const fieldMappings = {
  // User fields
  userId: 'user_id',
  createdBy: 'created_by',
  updatedAt: 'updated_at',
  createdAt: 'created_at',
  isActive: 'is_active',
  
  // Ticket fields
  ticketId: 'ticket_id',
  ticketNumber: 'ticket_number',
  categoryId: 'category_id',
  subcategoryId: 'subcategory_id',
  requesterId: 'requester_id',
  assignedToId: 'assigned_to_id',
  dueDate: 'due_date',
  closedAt: 'closed_at',
  
  // File fields
  fileUrl: 'file_url',
  fileSize: 'file_size',
  fileType: 'file_type',
  uploadedBy: 'uploaded_by',
  
  // Workflow fields
  workflowId: 'workflow_id',
  workflowVersion: 'workflow_version',
  workflowSnapshot: 'workflow_snapshot',
  fromState: 'from_state',
  toState: 'to_state',
  
  // General
  customName: 'custom_name',
  fieldName: 'field_name',
  oldValue: 'old_value',
  newValue: 'new_value',
  ipAddress: 'ip_address',
  userAgent: 'user_agent',
  resourceId: 'resource_id',
  searchCriteria: 'search_criteria',
  isPublic: 'is_public',
  isRequired: 'is_required',
  fieldType: 'field_type',
  customFieldId: 'custom_field_id',
  isInternal: 'is_internal',
  relationType: 'relation_type',
  relatedTicketId: 'related_ticket_id',
};
```

## Common Patterns

### 1. Simple Find Many
```typescript
// Prisma
const items = await prisma.item.findMany({
  where: { isActive: true },
  orderBy: { createdAt: 'desc' },
});

// Supabase
const { data: items, error } = await supabase
  .from('items')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false });

if (error) throw error;
return items || [];
```

### 2. Find Unique by ID
```typescript
// Prisma
const item = await prisma.item.findUnique({
  where: { id },
});

// Supabase
const { data: item, error } = await supabase
  .from('items')
  .select('*')
  .eq('id', id)
  .single();

if (error || !item) throw new NotFoundException();
return item;
```

### 3. Create with Relations
```typescript
// Prisma
const item = await prisma.item.create({
  data: {
    name: 'Item',
    categoryId: 'cat-id',
  },
  include: { category: true },
});

// Supabase
const { data: item, error } = await supabase
  .from('items')
  .insert({
    name: 'Item',
    category_id: 'cat-id',
  })
  .select(`
    *,
    category:categories (*)
  `)
  .single();
```

### 4. Update
```typescript
// Prisma
const item = await prisma.item.update({
  where: { id },
  data: { name: 'New Name' },
});

// Supabase
const { data: item, error } = await supabase
  .from('items')
  .update({
    name: 'New Name',
    updated_at: new Date().toISOString(),
  })
  .eq('id', id)
  .select()
  .single();
```

### 5. Delete (Soft Delete)
```typescript
// Prisma
const item = await prisma.item.update({
  where: { id },
  data: { isActive: false },
});

// Supabase
const { data: item, error } = await supabase
  .from('items')
  .update({
    is_active: false,
    updated_at: new Date().toISOString(),
  })
  .eq('id', id)
  .select()
  .single();
```

### 6. Find with Multiple Conditions
```typescript
// Prisma
const items = await prisma.item.findMany({
  where: {
    status: 'ACTIVE',
    categoryId: 'cat-id',
    isActive: true,
  },
});

// Supabase
const { data: items, error } = await supabase
  .from('items')
  .select('*')
  .eq('status', 'ACTIVE')
  .eq('category_id', 'cat-id')
  .eq('is_active', true);
```

### 7. Pagination
```typescript
// Prisma
const items = await prisma.item.findMany({
  skip: (page - 1) * limit,
  take: limit,
});

// Supabase
const from = (page - 1) * limit;
const to = from + limit - 1;

const { data: items, error, count } = await supabase
  .from('items')
  .select('*', { count: 'exact' })
  .range(from, to);
```

### 8. Complex Relations
```typescript
// Prisma
const tickets = await prisma.ticket.findMany({
  include: {
    requester: true,
    assignedTo: true,
    category: true,
    comments: true,
  },
});

// Supabase
const { data: tickets, error } = await supabase
  .from('tickets')
  .select(`
    *,
    requester:users!requester_id (*),
    assigned_to:users!assigned_to_id (*),
    category:categories (*),
    comments:comments (*)
  `);
```

### 9. Upsert
```typescript
// Prisma
const item = await prisma.item.upsert({
  where: { email: 'test@example.com' },
  update: { name: 'Updated' },
  create: { email: 'test@example.com', name: 'New' },
});

// Supabase (check first, then insert/update)
const { data: existing } = await supabase
  .from('items')
  .select('id')
  .eq('email', 'test@example.com')
  .single();

if (existing) {
  const { data } = await supabase
    .from('items')
    .update({ name: 'Updated' })
    .eq('email', 'test@example.com')
    .select()
    .single();
} else {
  const { data } = await supabase
    .from('items')
    .insert({ email: 'test@example.com', name: 'New' })
    .select()
    .single();
}
```

### 10. Aggregations
```typescript
// Prisma
const count = await prisma.item.count({
  where: { isActive: true },
});

// Supabase
const { count, error } = await supabase
  .from('items')
  .select('*', { count: 'exact', head: true })
  .eq('is_active', true);
```

## Service Template

```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  constructor(private supabase: SupabaseService) {}

  // Helper to map snake_case to camelCase
  private mapItem(item: any) {
    return {
      id: item.id,
      name: item.name,
      // ... map all fields
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }
}
```

## Module Template

```typescript
import { Module } from '@nestjs/common';
import { MyService } from './my.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [MyService],
  exports: [MyService],
})
export class MyModule {}
```

