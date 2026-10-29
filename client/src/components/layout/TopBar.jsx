import { useEffect, useState } from 'react';
import Logo from '../ui/Logo.jsx';
import Icon from '../ui/Icon.jsx';
import Avatar from '../ui/Avatar.jsx';
import { Button, IconButton } from '../ui/Button.jsx';
import MorphLoader from '../motion/MorphLoader.jsx';
import { TABS } from '../../lib/constants.js';
import { subscribeLoading } from '../../lib/api.js';
import { useApp } from '../../context/AppContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import useMediaQuery from '../../hooks/useMediaQuery.js';

/** Shows the small morph loader whenever any request is in flight. */
function ActivityIndicator() {
  const [busy, setBusy] = useState(false);
  useEffect(() => subscribeLoading((n) => setBusy(n > 0)), []);
  return <MorphLoader size="sm" inline visible={busy} label="Loading data" />;
}

export function ThemeButton() {
  const { user, themePref, setThemePref, updateSettings } = useApp();
  const { notifyError } = useUI();
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const isDark = themePref === 'dark' || (themePref === 'system' && systemDark);
  const next = isDark ? 'light' : 'dark';
  const onClick = () => {
    if (user) updateSettings({ theme: next }).catch((e) => notifyError(e, 'Could not change the theme'));
    else setThemePref(next);
  };
  return (
    <IconButton
      icon={isDark ? 'sun' : 'moon'}
      label={`Switch to ${next} mode`}
      onClick={onClick}
      data-theme-pref={themePref}
    />
  );
}

export default function TopBar({ tab, onNavigate, onNewTask }) {
  const { user } = useApp();
  return (
    <header className="topbar">
      <div className="topbar__left">
        <Logo />
      </div>

      <nav className="topnav" aria-label="Main">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`topnav__item ${tab === t.id ? 'is-active' : ''}`}
            aria-current={tab === t.id ? 'page' : undefined}
            onClick={() => onNavigate(t.id)}
          >
            <Icon name={t.icon} size={18} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <div className="topbar__right">
        <ActivityIndicator />
        <Button variant="outline" size="sm" icon="plus" onClick={onNewTask} className="topbar__new">
          New task
        </Button>
        <IconButton icon="plus" label="New task" variant="soft" onClick={onNewTask} className="topbar__new-icon" />
        <ThemeButton />
        <button type="button" className="topbar__avatar" onClick={() => onNavigate('settings')} aria-label="Account settings">
          <Avatar name={user?.name} src={user?.picture} size={34} />
        </button>
      </div>
    </header>
  );
}
