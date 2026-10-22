import React, { useState } from 'react';
import { playXboxSound, SiteTasksPanel, type SiteTask, type SiteTaskStatus } from '@egen-civitas/esm-framework';
import { INITIAL_SITE_TASKS } from '../data/sites-data';
import { notify } from '../utils/notify';
import { useSiteOutlet } from './site-context';

const NEXT_STATUS: Record<SiteTaskStatus, SiteTaskStatus> = { todo: 'in_progress', in_progress: 'done', done: 'todo' };

/** `/sites/:siteId/taches` */
const SiteTasksPage: React.FC = () => {
  const { site } = useSiteOutlet();
  const [tasks, setTasks] = useState<SiteTask[]>(INITIAL_SITE_TASKS);

  return (
    <SiteTasksPanel
      siteName={site.name}
      tasks={tasks}
      onToggleStatus={(task) => {
        playXboxSound('toggle');
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: NEXT_STATUS[t.status] } : t)));
      }}
      onCreate={(draft) => {
        playXboxSound('achievement');
        setTasks((prev) => [
          {
            id: `tsk-${Date.now()}`,
            title: draft.title,
            description: draft.description || `Tâche créée sur le site ${site.name}`,
            priority: draft.priority,
            status: 'todo',
            dueDate: draft.dueDate || 'À planifier',
            assignedBy: 'Moi',
            assignedTo: 'Équipe du site',
            tags: ['Site', site.shortName],
          },
          ...prev,
        ]);
        notify('Tâche créée', 'success');
      }}
    />
  );
};

export default SiteTasksPage;
