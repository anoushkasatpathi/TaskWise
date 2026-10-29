import { useCallback } from 'react';
import { useUI } from '../context/UIContext.jsx';
import { useTasksStore } from '../context/TaskContext.jsx';
import { useApp } from '../context/AppContext.jsx';

/** Shared click handlers for anything that shows a task. */
export default function useTaskActions() {
  const { openModal, notifyError, notify } = useUI();
  const { toggleDone } = useTasksStore();
  const { writableCalendars } = useApp();

  const openTask = useCallback((occ) => openModal('task', { task: occ.task, date: occ.date }), [openModal]);

  const newTask = useCallback(
    (defaults = {}) => {
      if (!writableCalendars.length) {
        notify({ tone: 'error', title: 'No calendar to add to', hint: 'Create a calendar in Settings first.' });
        return;
      }
      openModal('task', { defaults });
    },
    [openModal, writableCalendars.length, notify]
  );

  const openDay = useCallback((date, opts = {}) => openModal('day', { date, ...opts }), [openModal]);

  const toggle = useCallback(
    async (occ) => {
      try {
        await toggleDone(occ.task, occ.date, !occ.done);
      } catch (err) {
        notifyError(err, 'Could not update the task');
      }
    },
    [toggleDone, notifyError]
  );

  return { openTask, newTask, openDay, toggle };
}
