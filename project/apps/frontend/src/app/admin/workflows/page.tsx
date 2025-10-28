'use client';

import { WorkflowList } from '../../../components/workflow/WorkflowList';
import { useWorkflows } from '../../../hooks/useWorkflows';

export default function WorkflowsPage() {
  const {
    workflows,
    fetchWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    setDefaultWorkflow,
    activateWorkflow,
    deactivateWorkflow,
  } = useWorkflows();

  return (
    <WorkflowList
      workflows={workflows}
      onRefresh={fetchWorkflows}
      onCreateWorkflow={createWorkflow}
      onUpdateWorkflow={updateWorkflow}
      onDeleteWorkflow={deleteWorkflow}
      onSetDefault={setDefaultWorkflow}
      onActivate={activateWorkflow}
      onDeactivate={deactivateWorkflow}
    />
  );
}
