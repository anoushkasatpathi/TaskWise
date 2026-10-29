import { useCallback, useState } from 'react';
import Logo from '../components/ui/Logo.jsx';
import Icon from '../components/ui/Icon.jsx';
import NeonBorder from '../components/motion/NeonBorder.jsx';
import MorphLoader, { MorphBlob } from '../components/motion/MorphLoader.jsx';
import GoogleButton from '../components/auth/GoogleButton.jsx';
import { ThemeButton } from '../components/layout/TopBar.jsx';
import useMediaQuery from '../hooks/useMediaQuery.js';
import { useApp } from '../context/AppContext.jsx';
import './SignInScreen.css';

const FEATURES = [
  { icon: 'calendar', text: 'Private calendars' },
  { icon: 'globe', text: 'A shared public calendar' },
  { icon: 'bell', text: 'Reminders on time' },
];

export default function SignInScreen() {
  const { config, signIn, themePref } = useApp();
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const dark = themePref === 'dark' || (themePref === 'system' && systemDark);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const onCredential = useCallback(
    async (credential) => {
      setError(null);
      setBusy(true);
      try {
        await signIn(credential);
      } catch (err) {
        setError({ message: err.message, hint: err.hint });
        setBusy(false);
      }
    },
    [signIn]
  );
  const onButtonError = useCallback((e) => setError(e), []);

  return (
    <div className="signin">
      <div className="signin__art" aria-hidden="true">
        <span className="signin__ribbon signin__ribbon--a" />
        <span className="signin__ribbon signin__ribbon--b" />
        <span className="signin__word">TASKWISE</span>
        <MorphBlob className="signin__blob" />
      </div>

      <header className="signin__top">
        <Logo />
        <ThemeButton />
      </header>

      <span className="signin__year" aria-hidden="true">
        {new Date().getFullYear()}
      </span>

      <section className="signin__intro">
        <p className="eyebrow">To-do &amp; reminders</p>
        <h1 className="signin__headline display">
          Plan every <em>moment</em>,
          <br />
          calmly.
        </h1>
        <ul className="signin__features" role="list">
          {FEATURES.map((f) => (
            <li key={f.text}>
              <Icon name={f.icon} size={16} /> {f.text}
            </li>
          ))}
        </ul>
      </section>

      <main className="signin__card" aria-labelledby="signin-title">
        <Logo compact />
        <h2 id="signin-title" className="signin__title">
          Welcome to TaskWise
        </h2>
        <p className="signin__sub">Sign in to see your calendars and reminders.</p>

        <div className="signin__button">
          {busy ? (
            <MorphLoader size="sm" label="Signing you in" />
          ) : (
            <NeonBorder radius={999} thickness={2}>
              <GoogleButton clientId={config.googleClientId} dark={dark} onCredential={onCredential} onError={onButtonError} />
            </NeonBorder>
          )}
        </div>

        <div className="signin__error" role="alert" aria-live="assertive">
          {error && (
            <p className="notice notice--error">
              <Icon name="alert" size={16} />
              <span>
                <strong>{error.message}</strong> {error.hint}
              </span>
            </p>
          )}
        </div>

        <p className="signin__fine">Google sign-in only. TaskWise never sees your password.</p>
      </main>

      <footer className="signin__about">
        <p className="eyebrow">
          <span className="signin__dot" /> About TaskWise
        </p>
        <p className="signin__aboutline">Calm planning for busy days.</p>
      </footer>
    </div>
  );
}
