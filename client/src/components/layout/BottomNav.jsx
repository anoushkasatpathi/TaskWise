import Icon from '../ui/Icon.jsx';
import { TABS } from '../../lib/constants.js';

/** Phone tab bar, styled after the design's Today / Explore / Journal / You bar. */
export default function BottomNav({ tab, onNavigate }) {
  return (
    <nav className="bottomnav" aria-label="Main">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`bottomnav__item ${tab === t.id ? 'is-active' : ''}`}
          aria-current={tab === t.id ? 'page' : undefined}
          onClick={() => onNavigate(t.id)}
        >
          <span className="bottomnav__icon">
            <Icon name={t.icon} size={22} />
          </span>
          <span className="bottomnav__label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
