import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Pager from '../../components/ui/Pager.jsx';
import MorphLoader from '../../components/motion/MorphLoader.jsx';
import SlideSwitcher from '../../components/motion/SlideSwitcher.jsx';
import useElementSize from '../../hooks/useElementSize.js';
import usePages from '../../hooks/usePages.js';
import { get, post } from '../../lib/api.js';
import { useApp } from '../../context/AppContext.jsx';
import { useUI } from '../../context/UIContext.jsx';

const ROW_H = 58;

export default function AdminSection() {
  const { user } = useApp();
  const { notify, notifyError, confirm } = useUI();
  const [data, setData] = useState(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ref, size] = useElementSize();

  const load = useCallback(() => {
    get('/admin/admins')
      .then(setData)
      .catch((e) => notifyError(e, 'Could not load admins'));
  }, [notifyError]);
  useEffect(load, [load]);

  const rows = data ? [...data.admins, ...data.pending.map((p) => ({ ...p, pending: true, id: `p-${p.email}` }))] : [];
  const paging = usePages(rows, Math.max(ROW_H, size.height - 40), () => ROW_H);

  const promote = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a full email address, like priya.nair@example.com');
      return;
    }
    setBusy(true);
    try {
      const res = await post('/admin/promote', { email: email.trim() });
      notify({ tone: 'success', title: res.status === 'pending' ? 'Invitation saved' : 'Admin added', message: res.message });
      setEmail('');
      load();
    } catch (err) {
      setError(err.fields?.email || err.message);
    } finally {
      setBusy(false);
    }
  };

  const demote = async (row) => {
    const ok = await confirm({
      title: `Remove admin rights from ${row.name || row.email}?`,
      message: 'They will no longer be able to edit the public calendar or manage admins.',
      confirmLabel: 'Remove admin',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const res = await post('/admin/demote', { email: row.email });
      notify({ tone: 'success', title: 'Admin removed', message: res.message });
      load();
    } catch (err) {
      notifyError(err, 'Could not remove admin');
    }
  };

  return (
    <div className="settings__fill">
      <form className="admin-form" onSubmit={promote} noValidate>
        <Field label="Promote someone by email" error={error} hint="If they have not signed in yet, they become an admin on first sign-in.">
          {(p) => (
            <input
              {...p}
              className="input"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="priya.nair@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>
        <Button type="submit" variant="primary" icon="shield" disabled={busy}>
          Make admin
        </Button>
      </form>
      <div className="settings__listbox" ref={ref}>
        {!data ? (
          <MorphLoader size="sm" label="Loading admins" />
        ) : (
          <>
            <SlideSwitcher id={paging.index} direction={paging.dir}>
              <ul className="cal-rows" role="list">
                {paging.page.map((a) => (
                  <li key={a.id} className="cal-row">
                    <Avatar name={a.name || a.email} src={a.picture} size={34} />
                    <span className="cal-row__text">
                      <span className="truncate">{a.pending ? a.email : a.name}</span>
                      <span className="tiny truncate">
                        {a.pending ? 'Invited · not signed in yet' : a.fromEnv ? `${a.email} · from ADMIN_EMAILS` : a.email}
                      </span>
                    </span>
                    <span className="cal-row__actions">
                      {!a.fromEnv && a.email !== user.email && (
                        <Button variant="ghost" size="sm" onClick={() => demote(a)}>
                          Remove
                        </Button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </SlideSwitcher>
            <Pager index={paging.index} count={paging.count} onPrev={paging.prev} onNext={paging.next} onGo={paging.goTo} label="Admins page" />
          </>
        )}
      </div>
    </div>
  );
}
