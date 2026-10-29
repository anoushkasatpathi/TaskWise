import { useUI } from '../../context/UIContext.jsx';
import Modal, { ModalFrameContext } from '../ui/Modal.jsx';
import CalendarFilter from '../calendar/CalendarFilter.jsx';
import TaskEditor from './TaskEditor.jsx';
import DayPanel from './DayPanel.jsx';
import CalendarEditor from './CalendarEditor.jsx';
import CopyPublicDialog from './CopyPublicDialog.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import Onboarding from './Onboarding.jsx';
import './modals.css';

function CalendarsSheet({ onClose }) {
  return (
    <Modal open onClose={onClose} title="Calendars" subtitle="Choose which calendars to show." size="sm">
      <div className="calsheet">
        <CalendarFilter />
      </div>
    </Modal>
  );
}

const REGISTRY = {
  task: TaskEditor,
  day: DayPanel,
  calendar: CalendarEditor,
  copyPublic: CopyPublicDialog,
  confirm: ConfirmDialog,
  onboarding: Onboarding,
  calendars: CalendarsSheet,
};

/**
 * Renders every open dialog. Open one from anywhere with
 * openModal('task', { defaults }) from the UI context.
 * Closed dialogs stay mounted briefly so their exit animation can play.
 */
export default function ModalHost() {
  const { modals, closeModal } = useUI();
  return modals.map((m) => {
    const Component = REGISTRY[m.type];
    if (!Component) return null;
    return (
      <ModalFrameContext.Provider key={m.id} value={m.open}>
        <Component {...m.props} onClose={() => closeModal(m.id)} />
      </ModalFrameContext.Provider>
    );
  });
}
