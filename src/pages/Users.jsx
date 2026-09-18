import { useState } from 'react';
import { userApi, miscApi } from '../api/endpoints.js';
import { useApi } from '../lib/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Field, Loading, ErrorBox } from '../components/ui.jsx';
import { timeAgo } from '../lib/format.js';

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => userApi.list(), []);
  const { data: depts } = useApi(() => miscApi.departments(), []);
  const [showForm, setShowForm] = useState(false);

  const toggleActive = async (u) => {
    await userApi.update(u.id, { isActive: !u.isActive });
    toast.show(`${u.name} ${u.isActive ? 'disabled' : 'enabled'}`);
    reload();
  };
  const reset = async (u) => {
    const { temporaryPassword } = await userApi.resetPassword(u.id);
    toast.show(`Temporary password for ${u.username}: ${temporaryPassword}`);
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <>
      <header className="head">
        <div><h2>User accounts</h2><p>Who can sign in, and what they are allowed to do.</p></div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : 'Add user'}
        </button>
      </header>

      {showForm && <CreateUser depts={depts || []} onDone={() => { setShowForm(false); reload(); }} />}

      <div className="card">
        <table>
          <thead><tr><th>User</th><th>Role</th><th>Department</th><th>Phone</th>
            <th>Last sign-in</th><th>Status</th><th /></tr></thead>
          <tbody>
            {data.map((u) => (
              <tr key={u.id}>
                <td><b>{u.name}</b><br /><small className="mono muted">{u.username}</small></td>
                <td><span className={`chip ${{ admin: 'c-violet', head: 'c-blue', tech: 'c-green' }[u.role]}`}>
                  {{ admin: 'Administrator', head: 'Department head', tech: 'Technician' }[u.role]}</span></td>
                <td>{u.department?.name || <span className="muted">All departments</span>}</td>
                <td className="mono">{u.phone || '—'}</td>
                <td><small>{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'never'}</small></td>
                <td><span className={`chip ${u.isActive ? 'c-green' : 'c-gray'}`}>
                  {u.isActive ? 'Active' : 'Disabled'}</span></td>
                <td className="row" style={{ gap: 6 }}>
                  <button className="btn ghost sm" onClick={() => reset(u)}>Reset password</button>
                  {u.id !== me.id && (
                    <button className="btn ghost sm" onClick={() => toggleActive(u)}>
                      {u.isActive ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CreateUser({ depts, onDone }) {
  const toast = useToast();
  const [f, setF] = useState({
    username: '', password: '', name: '', title: '', role: 'head',
    department: '', skills: '', phone: '',
  });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    setErrors({});
    try {
      await userApi.create({ ...f, department: f.role === 'head' ? f.department : null });
      toast.show(`Account created for ${f.username}`);
      onDone();
    } catch (err) {
      setErrors(err.details
        ? Object.fromEntries(err.details.map((d) => [d.field, d.message]))
        : { form: err.message });
    }
  };

  return (
    <div className="card pad" style={{ marginBottom: 18 }}>
      {errors.form && <div className="note red">{errors.form}</div>}
      <div className="f2">
        <Field label="Full name *" error={errors.name}>
          <input value={f.name} onChange={set('name')} /></Field>
        <Field label="Job title"><input value={f.title} onChange={set('title')} /></Field>
      </div>
      <div className="f2">
        <Field label="Username *" error={errors.username}>
          <input value={f.username} onChange={set('username')} autoCapitalize="off" /></Field>
        <Field label="Temporary password *" error={errors.password}>
          <input value={f.password} onChange={set('password')} placeholder="At least 8 characters" /></Field>
      </div>
      <div className="f2">
        <Field label="Role">
          <select value={f.role} onChange={set('role')}>
            <option value="head">Department head</option>
            <option value="tech">Technician</option>
            <option value="admin">Administrator</option>
          </select>
        </Field>
        {f.role === 'head' && (
          <Field label="Department *" error={errors.department}>
            <select value={f.department} onChange={set('department')}>
              <option value="">Select…</option>
              {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
        )}
      </div>
      <button className="btn" onClick={submit}>Create account</button>
    </div>
  );
}
