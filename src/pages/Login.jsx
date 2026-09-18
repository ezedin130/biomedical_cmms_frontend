import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from '../components/Icon.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) return setError('Enter both your username and password.');
    setBusy(true);
    try {
      await login(form.username.trim().toLowerCase(), form.password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <div className="lcard">
        <div className="lbrand">
          <div>
            <div className="eyebrow">Clinical engineering department</div>
            <h1>Equipment<br />maintenance<br />portal</h1>
            <p>Every device, every failure, every repair — tracked from the ward that
              reported it to the technician who signed it off.</p>
          </div>
          <div className="live"><i /> SYSTEM OPERATIONAL</div>
        </div>

        <div className="lform">
          <h2>Sign in</h2>
          <p>Use your hospital staff credentials.</p>

          {error && <div className="lerr"><Icon name="alert" className="ico sm" />{error}</div>}

          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="u">Username</label>
              <input id="u" autoComplete="username" autoCapitalize="off" spellCheck="false"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="p">Password</label>
              <div className="pw">
                <input id="p" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPw((s) => !s)} aria-label="Show password">
                  <Icon name="lock" className="ico sm" />
                </button>
              </div>
            </div>
            <button className="btn block" type="submit" disabled={busy}>
              {busy ? <><span className="spinner" /> Signing in…</> : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
