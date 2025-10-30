# Workflow Management System

This directory contains the workflow management components for the NTG Ticket system. The workflow system allows administrators to create, edit, and manage custom ticket processing workflows using a visual editor.

## Components

### WorkflowEditor.tsx
A React Flow-based visual workflow editor that allows administrators to:
- Create and edit workflow states (nodes)
- Define transitions between states (edges)
- Configure transition conditions, actions, and permissions
- Save workflow definitions as JSON

### WorkflowList.tsx
A comprehensive list view for managing workflows that includes:
- Display of all workflows with status, version, and usage information
- Search and filtering capabilities
- Actions for creating, editing, deleting, and managing workflows
- Status management (activate/deactivate)
- Default workflow setting

## Features

### Visual Workflow Editor
- **Drag-and-drop interface** using React Flow
- **State management** with customizable colors and labels
- **Transition configuration** with roles, conditions, and actions
- **Real-time validation** of workflow structure
- **Auto-save functionality** for workflow definitions

### Workflow States
- **New**: Initial state when ticket is created
- **Open**: After initial review and validation
- **In Progress**: When support staff begins work
- **On Hold**: When waiting for external input/resources
- **Resolved**: When solution is implemented
- **Closed**: After user confirmation or auto-closure
- **Reopened**: When closed ticket needs additional work

### Transition Configuration
- **Allowed Roles**: Define which user roles can execute transitions
- **Conditions**: Set requirements for transitions (e.g., requires comment, resolution)
- **Actions**: Define side effects (e.g., send notification, assign user, calculate time)

### Workflow Management
- **Version Control**: Track workflow changes and versions
- **Default Workflow**: Set a default workflow for new tickets
- **Status Management**: Activate/deactivate workflows
- **Usage Tracking**: Monitor how many tickets use each workflow

## Usage

### Creating a Workflow
1. Navigate to Admin Panel → Workflows
2. Click "Create Workflow"
3. Enter workflow name and description
4. Use the visual editor to define states and transitions
5. Configure transition details (roles, conditions, actions)
6. Save the workflow

### Editing a Workflow
1. Find the workflow in the list
2. Click the edit button
3. Modify states, transitions, or configuration
4. Save changes

### Setting Default Workflow
1. Find the workflow you want to set as default
2. Click the menu button (three dots)
3. Select "Set as Default"

## Technical Details

### Data Structure
Workflows are stored as JSON in the database with the following structure:
```json
{
  "name": "Workflow Name",
  "description": "Workflow Description",
  "isDefault": false,
  "definition": {
    "nodes": [
      {
        "id": "new",
        "type": "statusNode",
        "position": { "x": 100, "y": 100 },
        "data": { "label": "New", "color": "#ff9800" }
      }
    ],
    "edges": [
      {
        "id": "e1",
        "source": "new",
        "target": "open",
        "label": "Start Work",
        "data": {
          "roles": ["SUPPORT_STAFF"],
          "conditions": ["REQUIRES_COMMENT"],
          "actions": ["SEND_NOTIFICATION"]
        }
      }
    ]
  }
}
```

### Integration
- **Backend**: Workflow execution service integrates with existing ticket system
- **Database**: Workflow definitions stored in PostgreSQL with Prisma ORM
- **API**: RESTful API endpoints for CRUD operations
- **GraphQL**: GraphQL schema for advanced queries and mutations

### Workflow Execution
When a ticket status is updated:
1. System checks if ticket has an assigned workflow
2. If workflow exists, validates transition against workflow rules
3. Checks user permissions and transition conditions
4. Executes transition actions (notifications, assignments, etc.)
5. Updates ticket status and logs execution

## Dependencies

- **React Flow**: Visual workflow editor
- **Mantine**: UI components and styling
- **Prisma**: Database ORM
- **NestJS**: Backend framework
- **GraphQL**: API layer

## Future Enhancements

- **Conditional Logic**: More complex condition evaluation
- **Custom Actions**: User-defined action types
- **Workflow Templates**: Pre-built workflow templates
- **Analytics**: Workflow performance metrics
- **Approval Workflows**: Multi-step approval processes
- **Integration**: External system integrations
