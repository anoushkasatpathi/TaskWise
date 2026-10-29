import Avatar from '../../components/ui/Avatar.jsx';
import { Button } from '../../components/ui/Button.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { useUI } from '../../context/UIContext.jsx';

export default function AccountSection() {
  const { user, signOut, privateCalendars } = useApp();
  const { confirm } = useUI();

  const onSignOut = async () => {
    if (await confirm({ title: 'Sign out of TaskWise?', message: 'Reminders stop on this device until you sign in again.', confirmLabel: 'Sign out' })) {
      signOut();
    }
  };

  return (
    <div className="settings__stack">
      <div className="account-card">
        <Avatar name={user.name} src={user.picture} size={64} />
        <div className="account-card__text">
          <p className="account-card__name">{user.name}</p>
          <p className="muted truncate">{user.email}</p>
          <div className="chips-row">
            <span className="badge">{user.role === 'admin' ? 'Admin' : 'Member'}</span>
            <span className="badge badge--sun">
              {privateCalendars.length} private calendar{privateCalendars.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>
      <p className="notice">
        <Icon name="shield" size={16} />
        <span>
          You sign in with Google. TaskWise never sees your Google password, and your session is kept in a secure
          cookie that page scripts cannot read.
        </span>
      </p>
      <Button variant="danger" icon="logout" onClick={onSignOut} className="account-signout">
        Sign out
      </Button>
    </div>
  );
}
