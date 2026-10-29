import { useState } from 'react';
import Icon from '../components/ui/Icon.jsx';
import Segmented from '../components/ui/Segmented.jsx';
import SlideSwitcher from '../components/motion/SlideSwitcher.jsx';
import useMediaQuery from '../hooks/useMediaQuery.js';
import { useApp } from '../context/AppContext.jsx';
import RemindersSection from './settings/RemindersSection.jsx';
import CalendarsSection from './settings/CalendarsSection.jsx';
import AppearanceSection from './settings/AppearanceSection.jsx';
import AdminSection from './settings/AdminSection.jsx';
import AccountSection from './settings/AccountSection.jsx';
import './SettingsScreen.css';

const SECTIONS = [
  { id: 'reminders', label: 'Reminders', sub: 'Gentle nudges, on time', icon: 'bell', Component: RemindersSection },
  { id: 'calendars', label: 'Calendars', sub: 'Create, rename, recolor', icon: 'calendar', Component: CalendarsSection },
  { id: 'appearance', label: 'Appearance', sub: 'Theme and layout', icon: 'palette', Component: AppearanceSection },
  { id: 'admin', label: 'Admins', sub: 'Manage who can edit public', icon: 'shield', Component: AdminSection, adminOnly: true },
  { id: 'account', label: 'Account', sub: 'Profile and sign out', icon: 'users', Component: AccountSection },
];

export default function SettingsScreen() {
  const { isAdmin } = useApp();
  const desktop = useMediaQuery('(min-width: 900px)');
  const sections = SECTIONS.filter((s) => !s.adminOnly || isAdmin);
  const [state, setState] = useState({ id: 'reminders', dir: 1 });
  const current = sections.find((s) => s.id === state.id) || sections[0];
  const order = sections.map((s) => s.id);
  const choose = (id) => setState({ id, dir: order.indexOf(id) > order.indexOf(current.id) ? 1 : -1 });
  const { Component } = current;

  return (
    <div className={`screen settings ${desktop ? 'settings--split' : ''}`}>
      {desktop ? (
        <nav className="card settings__nav" aria-label="Settings sections">
          <div className="settings__navhead">
            <h1>Settings</h1>
            <p className="muted">Make TaskWise work for your rhythm.</p>
          </div>
          <ul role="list">
            {sections.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={`settings__navitem ${s.id === current.id ? 'is-active' : ''}`}
                  aria-current={s.id === current.id ? 'page' : undefined}
                  onClick={() => choose(s.id)}
                >
                  <span className="settings__navicon">
                    <Icon name={s.icon} size={19} />
                  </span>
                  <span className="settings__navtext">
                    <span>{s.label}</span>
                    <span className="tiny">{s.sub}</span>
                  </span>
                  <Icon name="chevronRight" size={16} className="settings__chev" />
                </button>
              </li>
            ))}
          </ul>
        </nav>
      ) : (
        <Segmented
          label="Settings sections"
          className="settings__tabs"
          value={current.id}
          onChange={choose}
          options={sections.map((s) => ({ value: s.id, label: s.label, icon: s.icon }))}
          iconsOnlyOnPhone
        />
      )}
      <div className="card settings__panel">
        <SlideSwitcher id={current.id} direction={state.dir} mode={desktop ? 'rise' : 'slide'}>
          <section className="settings__section" aria-labelledby={`sec-${current.id}`}>
            <header className="settings__sectionhead">
              <h2 id={`sec-${current.id}`}>{current.label}</h2>
              <p className="muted">{current.sub}</p>
            </header>
            <Component />
          </section>
        </SlideSwitcher>
      </div>
    </div>
  );
}
