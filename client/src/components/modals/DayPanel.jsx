import Modal from '../ui/Modal.jsx';
import { Button } from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import MorphLoader from '../motion/MorphLoader.jsx';
import TaskList from '../tasks/TaskList.jsx';
import useOccurrences from '../../hooks/useOccurrences.js';
import useTaskActions from '../../hooks/useTaskActions.js';
import { formatFull, fromISO } from '../../lib/dates.js';

/** Everything on one day. Opened from "+N more" and by tapping a calendar cell. */
export default function DayPanel({ date, onlyCalendarIds = null, canCreate = true, createDefaults = {}, onClose }) {
  const { occurrences, loading } = useOccurrences(date, date, { onlyCalendarIds });
  const { openTask, toggle, newTask } = useTaskActions();
  const done = occurrences.filter((o) => o.done).length;

  return (
    <Modal
      open
      onClose={onClose}
      title={formatFull(fromISO(date))}
      subtitle={occurrences.length ? `${done} of ${occurrences.length} done` : 'Nothing planned'}
      footer={
        canCreate && (
          <Button variant="primary" icon="plus" onClick={() => newTask({ ...createDefaults, date })}>
            Add task
          </Button>
        )
      }
    >
      <div className="daypanel">
        {loading ? (
          <MorphLoader label="Loading the day" />
        ) : (
          <TaskList
            occurrences={occurrences}
            onOpen={openTask}
            onToggle={toggle}
            resetKey={date}
            empty={<EmptyState compact title="A free day" message="Nothing is planned here yet." />}
          />
        )}
      </div>
    </Modal>
  );
}
