import { useState } from 'react';
import { faultCategoryApi } from '../api/endpoints.js';
import { useApi } from '../lib/useApi.js';
import { useToast } from '../context/ToastContext.jsx';
import { Field, Loading, ErrorBox } from '../components/ui.jsx';

export default function FaultCategories() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi(
    () => faultCategoryApi.list({ includeInactive: 'true' }),
    []
  );
  const [showForm, setShowForm] = useState(false);

  const toggleActive = async (c) => {
    await faultCategoryApi.update(c.id, { isActive: !c.isActive });
    toast.show(`${c.label} ${c.isActive ? 'deactivated' : 'reactivated'}`);
    reload();
  };
  const rename = async (c) => {
    const label = window.prompt(`Rename "${c.label}" to:`, c.label);
    if (!label || label.trim() === c.label) return;
    await faultCategoryApi.update(c.id, { label: label.trim() });
    toast.show('Renamed');
    reload();
  };
  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.label}"? This only works if no work order uses it.`)) return;
    try {
      await faultCategoryApi.remove(c.id);
      toast.show('Deleted');
      reload();
    } catch (err) {
      toast.show(err.message);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const active = data.filter((c) => c.isActive);
  const inactive = data.filter((c) => !c.isActive);

  return (
    <>
      <header className="head">
        <div><h2>Fault categories</h2>
          <p>The types staff can choose when reporting a fault. New ones become
            available immediately in the Report a fault form.</p></div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : 'Add category'}
        </button>
      </header>

      {showForm && (
        <AddCategory onDone={() => { setShowForm(false); reload(); }} />
      )}

      <div className="card">
        <table>
          <thead><tr><th>Code</th><th>Label</th><th>Status</th><th /></tr></thead>
          <tbody>
            {active.map((c) => (
              <tr key={c.id}>
                <td className="mono">{c.code}</td>
                <td><b>{c.label}</b></td>
                <td><span className="chip c-green">Active</span></td>
                <td className="row" style={{ gap: 6 }}>
                  <button className="btn ghost sm" onClick={() => rename(c)}>Rename</button>
                  <button className="btn ghost sm" onClick={() => toggleActive(c)}>Deactivate</button>
                  <button className="btn ghost sm danger" onClick={() => remove(c)}>Delete</button>
                </td>
              </tr>
            ))}
            {inactive.map((c) => (
              <tr key={c.id}>
                <td className="mono muted">{c.code}</td>
                <td className="muted">{c.label}</td>
                <td><span className="chip c-gray">Inactive</span></td>
                <td className="row" style={{ gap: 6 }}>
                  <button className="btn ghost sm" onClick={() => toggleActive(c)}>Reactivate</button>
                  <button className="btn ghost sm danger" onClick={() => remove(c)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AddCategory({ onDone }) {
  const toast = useToast();
  const [f, setF] = useState({ code: '', label: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    setErrors({});
    setBusy(true);
    try {
      const c = await faultCategoryApi.create(f);
      toast.show(`Added ${c.label}`);
      onDone();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card pad" style={{ marginBottom: 18 }}>
      {errors.form && <div className="note red">{errors.form}</div>}
      <div className="f2">
        <Field label="Code *" error={errors.code}>
          <input value={f.code} onChange={set('code')}
            placeholder="e.g. sensor_drift"
            autoCapitalize="off" />
        </Field>
        <Field label="Display label *" error={errors.label}>
          <input value={f.label} onChange={set('label')}
            placeholder="e.g. Sensor drift" />
        </Field>
      </div>
      <p className="muted" style={{ fontSize: 12 }}>
        Code is the internal identifier (lowercase letters, digits, _ or -).
        Label is what users see in the dropdown.
      </p>
      <button className="btn" onClick={submit} disabled={busy}>
        {busy ? 'Saving…' : 'Add category'}
      </button>
    </div>
  );
}
