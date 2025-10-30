# NTG-Ticket System

## Executive Summary

The system is designed as a centralized platform for managing IT support requests, tracking ticket progress, facilitating communication between users and support staff, and providing reporting capabilities.

**Document Details:**
- **System Name:** NTG-Ticket (IT Ticket Management System)
- **Version:** 1.0
- **Created:** January 20, 2025
- **Author:** Zeeshan Hasnain

---

## Feature Set Requirement

### 1. User Management & Authentication

| Feature | Description | Status | Requirements |
|---------|-------------|--------|--------------|
| **User Roles** | Four distinct user roles with specific permissions | ✅ Defined | End Users, IT Support Staff, IT Support Managers, System Administrators |
| **Authentication Methods** | Email  | ✅ Defined | AR1: Email |
| **Sign-up Process** | New user registration with prompts | ✅ Defined | AR2: Default prompt for new users |
| **Custom Login UI** | Branded login interface with grouped fields | ✅ Defined | AR3-AR4: Custom look and feel |
| **Role-Based Permissions** | Granular permissions per user role | ✅ Defined | View, create, update, assign, escalate, report |

### 2. Ticket Lifecycle Management

| Feature | Description | Status | Requirements |
|---------|-------------|--------|--------------|
| **Ticket Statuses** | Seven defined ticket states | ✅ Defined | New, Open, In Progress, On Hold, Resolved, Closed, Reopened |
| **Status Transitions** | Defined workflow between statuses | ✅ Defined | Submission → Review → Assignment → Resolution → Closure |
| **Auto-Status Updates** | System-managed status changes | ✅ Defined | Auto-close after inactivity, auto-population |
| **Reopening Capability** | Ability to reopen closed tickets | ✅ Defined | When issues persist after resolution |

### 3. Ticket Fields & Data Management

| Field Name | Data Type | Required | Auto-Generated | Usage |
|------------|-----------|----------|----------------|-------|
| **Ticket ID** | Alphanumeric | Yes | Yes | Unique identifier, tracking, auditing |
| **Title** | Text (Max chars) | Yes | No | Brief issue summary |
| **Description** | Text Block | Yes | No | Detailed issue explanation |
| **Category** | Enum | Yes | No | Hardware, Software, Network, Access, Other |
| **Subcategory** | Enum (Dependent) | Yes | No | Specific classification within category |
| **Priority** | Enum | Yes | Defaulted | Low, Medium, High, Critical |
| **Status** | Enum | Yes | Yes | Current lifecycle state |
| **Assigned To** | User ID | No | No | Responsible support staff |
| **Requester** | User ID | Yes | Yes | Ticket submitter |
| **Creation Date** | DateTime | Yes | Yes | Submission timestamp |
| **Last Updated** | DateTime | Yes | Yes | Most recent activity |
| **Due Date** | DateTime | No | Calculated | Based on SLA and priority |
| **Attachments** | File Upload | No | No | Supporting documents/screenshots |
| **Comments** | Text Blocks | No | No | Communication thread |
| **Resolution** | Text Block | Yes* | No | Solution details (*required before closing) |
| **SLA Level** | Enum | Yes | Defaulted | Standard, Premium, Critical Support |
| **Related Tickets** | Ticket ID List | No | No | Dependencies/duplicates |
| **Impact** | Enum | Yes | Defaulted | Minor, Moderate, Major, Critical |
| **Urgency** | Enum | Yes | Defaulted | Low, Normal, High, Immediate |
| **Custom Fields** | Various | Configurable | No | Organization-specific data |

### 4. Workflow Management

| Workflow Phase | Features | Requirements |
|----------------|----------|--------------|
| **Submission** | Form validation, auto-population, file uploads | FR1-FR6 |
| **Review & Assignment** | Triage, categorization, assignment, SLA calculation | Field updates, notifications |
| **Processing** | Status updates, communication, progress tracking | FR7-FR10 |
| **Resolution** | Solution documentation, status change to resolved | Resolution field completion |
| **Closure** | User confirmation, auto-closure, final documentation | Notification, timeout handling |

### 5. Communication & Notifications

| Feature | Description | Requirements |
|---------|-------------|--------------|
| **Status Change Notifications** | Alerts for key field updates | FR11: Status, Assigned To, Due Date |
| **Due Date Reminders** | Proactive alerts before deadline | FR12: Pre-due date notifications |
| **Comment Notifications** | Alerts for new communications | FR13: Comment thread updates |
| **Direct Response** | Reply through system interface | FR14: In-system communication |

### 6. Reporting & Analytics

| Feature | Description | Requirements |
|---------|-------------|--------------|
| **Field-Based Reports** | Reports on all ticket fields | FR15: Category, Priority, Status, etc. |
| **Analytical Insights** | Trend analysis and performance metrics | FR16: Common issues, response times |
| **Filtering & Sorting** | Advanced ticket search capabilities | FR17: Multi-field filtering |

### 7. System Administration

| Feature | Description | Requirements |
|---------|-------------|--------------|
| **Field Configuration** | Admin control over field options | FR18: Category, Priority, Impact, etc. |
| **Custom Fields** | Organization-specific field creation | FR19: Additional data capture |
| **Permission Management** | Role-based field access control | FR20: Visibility and edit permissions |
| **Data Integrity** | Validation rules enforcement | FR21: Data validation and integrity |

### 8. Non-Functional Requirements

| Category | Features | Requirements |
|----------|----------|--------------|
| **Usability** | Web-based interface, multi-language support, help system | NFR1-NFR3 |
| **Performance** | Concurrent access, 2-second response time | NFR4-NFR5 |
| **Security** | Authentication, encryption, access control | NFR6-NFR8 |
| **Scalability** | Growth accommodation, integration support | NFR9-NFR10 |
| **Compliance** | Data protection, audit logging | NFR11-NFR12 |

### 9. User Interface Requirements

| Feature | Description | Requirements |
|---------|-------------|--------------|
| **Dashboard** | User ticket overview | UIR1: Open and resolved tickets |
| **Dynamic Forms** | Category-based field updates | UIR2: Dynamic field behavior |
| **Search Functionality** | Multi-criteria ticket search | UIR3: Various search criteria |
| **Responsive Design** | Multi-device compatibility | UIR4: Desktop, tablet, mobile |
| **Support Interface** | Staff ticket management | UIR5: Efficient ticket handling |
| **Form Validation** | Real-time input validation | UIR7: Immediate error feedback |
| **Structured Display** | Organized ticket detail view | UIR9: Readable format |

### 10. SLA Management

| SLA Level | Response Time | Resolution Time | Usage |
|-----------|---------------|-----------------|-------|
| **Standard** | 8 business hours | 5 business days | General inquiries, non-urgent |
| **Premium** | 4 business hours | 2 business days | Higher urgency/impact |
| **Critical Support** | Immediate (24/7) | 4 business hours | Critical system failures |

---

