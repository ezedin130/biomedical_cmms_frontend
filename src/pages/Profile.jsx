import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/endpoints.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Field } from '../components/ui.jsx';
import { initials, stamp } from '../lib/format.js';

export default function Profile() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    setErrors({});
    if (f.newPassword !== f.confirm) return setErrors({ confirm: 'The two passwords do not match.' });
    try {
      await authApi.changePassword({ currentPassword: f.currentPassword, newPassword: f.newPassword });
      // Changing the password bumps tokenVersion server-side, so every session
      // including this one is now invalid. Sign the user out cleanly.
      toast.show('Password changed. Please sign in again.');
      await logout();
      navigate('/login');
    } catch (err) {
      setErrors(err.details
        ? Object.fromEntries(err.details.map((d) => [d.field, d.message]))
        : { form: err.message });
    }
  };

  return (
    <>
      <header className="head"><div><h2>My profile</h2><p>Your account details.</p></div></header>

      <div className="card pad" style={{ maxWidth: 620 }}>
        <div className="row" style={{ gap: 16, marginBottom: 20, flexWrap: 'nowrap' }}>
          <span className="av lg">{initials(user.name)}</span>
          <div><h3>{user.name}</h3><p className="muted">{user.title}</p></div>
        </div>
        <dl>
          <dt>Username</dt><dd className="mono">{user.username}</dd>
          <dt>Role</dt>
          <dd>{{ admin: 'Administrator', head: 'Department head', tech: 'Technician' }[user.role]}</dd>
          <dt>Department</dt><dd>{user.department?.name || 'All departments'}</dd>
          <dt>Phone</dt><dd className="mono">{user.phone || '—'}</dd>
          <dt>Last sign-in</dt><dd>{user.previousLogin ? stamp(user.previousLogin) : 'first session'}</dd>
        </dl>
      </div>

      <div className="card pad" style={{ maxWidth: 620, marginTop: 16 }}>
        <h3 className="sub" style={{ marginTop: 0 }}>Change password</h3>
        {errors.form && <div className="note red">{errors.form}</div>}
        <Field label="Current password *" error={errors.currentPassword}>
          <input type="password" value={f.currentPassword} onChange={set('currentPassword')} /></Field>
        <Field label="New password *" error={errors.newPassword}>
          <input type="password" value={f.newPassword} onChange={set('newPassword')}
            placeholder="At least 8 characters, with a number" /></Field>
        <Field label="Confirm new password *" error={errors.confirm}>
          <input type="password" value={f.confirm} onChange={set('confirm')} /></Field>
        <button className="btn" onClick={submit}
          disabled={!f.currentPassword || f.newPassword.length < 8}>Update password</button>
      </div>
    </>
  );
}
