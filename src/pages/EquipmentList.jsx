import { useState } from 'react';
import { equipmentApi, miscApi } from '../api/endpoints.js';
import { useApi } from '../lib/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Field, Loading, ErrorBox, Empty } from '../components/ui.jsx';
import { RISK } from '../lib/constants.js';

export default function EquipmentList() {
  const { isAdmin, isHead, isTech } = useAuth();
  const canPropose = isAdmin || isTech;
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { data, loading, error, reload } = useApi(
    () => equipmentApi.list({ limit: 100, ...(query ? { search: query } : {}) }),
    [query]
  );
  const { data: depts } = useApi(() => miscApi.departments(), []);

  const approve = async (e) => {
    await equipmentApi.approve(e.id);
    toast.show(`Approved ${e.assetTag} — ${e.name}`);
    reload();
  };
  const reject = async (e) => {
    if (!window.confirm(`Reject the proposal for ${e.name}?`)) return;
    await equipmentApi.reject(e.id);
    toast.show(`Rejected proposal`);
    reload();
  };

  const items = data?.items || [];
  const pending = items.filter((e) => e.approval === 'pending');
  const approved = items.filter((e) => e.approval !== 'pending');
  const addLabel = isAdmin ? 'Add device' : 'Propose device';

  return (
    <>
      <header className="head">
        <div><h2>Equipment register</h2>
          <p>{approved.length} devices visible to your account.</p></div>
        <div className="row" style={{ gap: 8 }}>
          <form className="row" onSubmit={(e) => { e.preventDefault(); setQuery(search); }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, model or serial" style={{ width: 240 }} />
            <button className="btn ghost" type="submit">Search</button>
          </form>
          {canPropose && (
            <button className="btn" onClick={() => setShowForm((s) => !s)}>
              {showForm ? 'Cancel' : addLabel}
            </button>
          )}
        </div>
      </header>

      {showForm && canPropose && (
        <CreateEquipment
          isAdmin={isAdmin}
          depts={depts || []}
          onDone={() => { setShowForm(false); reload(); }}
        />
      )}

      {error && <ErrorBox message={error} onRetry={reload} />}

      {pending.length > 0 && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="pad" style={{ paddingBottom: 0 }}>
            <b>{isAdmin ? 'Awaiting your approval' : 'Your pending proposals'}</b>
            <p className="muted">
              {isAdmin
                ? 'A technician or head proposed these devices. Approve to add them to the register, or reject.'
                : 'These proposals are with admin for review. Once approved, they will appear in the register.'}
            </p>
          </div>
          <table>
            <thead><tr><th>Device</th><th>Department</th><th>Serial</th>
              <th>Risk</th><th>Proposed by</th>{isAdmin && <th />}</tr></thead>
            <tbody>
              {pending.map((e) => (
                <tr key={e.id}>
                  <td><b>{e.name}</b><br /><small className="muted">{e.manufacturer} {e.model}</small></td>
                  <td>{e.department?.name || <span className="muted">—</span>}</td>
                  <td className="mono">{e.serialNumber}</td>
                  <td>{RISK[e.riskClass]}</td>
                  <td>{e.proposedBy?.name || <span className="muted">—</span>}</td>
                  {isAdmin && (
                    <td className="row" style={{ gap: 6 }}>
                      <button className="btn sm" onClick={() => approve(e)}>Approve</button>
                      <button className="btn ghost sm" onClick={() => reject(e)}>Reject</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        {loading ? <Loading /> : !approved.length ? <Empty text="No devices matched." /> : (
          <table>
            <thead>
              <tr><th>Asset tag</th><th>Device</th><th>Location</th><th>Risk class</th>
                <th>Status</th><th>Cover</th></tr>
            </thead>
            <tbody>
              {approved.map((e) => (
                <tr key={e.id}>
                  <td><span className="tag">{e.assetTag}</span></td>
                  <td><b>{e.name}</b><br /><small className="muted">{e.manufacturer} {e.model}</small></td>
                  <td>{e.department?.name}<br /><small className="muted">{e.location}</small></td>
                  <td><span className={`chip ${e.riskClass === 'life_support' ? 'c-red'
                    : e.riskClass === 'high' ? 'c-amber' : 'c-gray'}`}>{RISK[e.riskClass]}</span></td>
                  <td><span className={`chip ${{ in_use: 'c-green', under_repair: 'c-amber', condemned: 'c-gray' }[e.status]}`}>
                    {{ in_use: 'In use', under_repair: 'Under repair', condemned: 'Condemned' }[e.status]}</span></td>
                  <td>{e.underWarranty ? <span className="chip c-green">Warranty</span>
                    : e.underContract ? <span className="chip c-blue">Contract</span>
                    : <span className="chip c-gray">Expired</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function CreateEquipment({ isAdmin, depts, onDone }) {
  const toast = useToast();
  const [f, setF] = useState({
    name: '', model: '', manufacturer: '', serialNumber: '',
    department: '', location: '', riskClass: 'medium',
    purchaseDate: '', warrantyExpiry: '', serviceContractExpiry: '',
    pmIntervalMonths: 6,
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    setErrors({});
    const body = { ...f };
    ['purchaseDate', 'warrantyExpiry', 'serviceContractExpiry'].forEach((k) => {
      if (!body[k]) delete body[k];
    });

    setBusy(true);
    try {
      const item = await equipmentApi.create(body);
      toast.show(isAdmin
        ? `Registered ${item.assetTag} — ${item.name}`
        : `Proposed ${item.name} — awaiting admin approval`);
      onDone();
    } catch (err) {
      setErrors(err.details
        ? Object.fromEntries(err.details.map((d) => [d.field, d.message]))
        : { form: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card pad" style={{ marginBottom: 18 }}>
      {errors.form && <div className="note red">{errors.form}</div>}
      {!isAdmin && (
        <div className="note">
          Your proposal will go to admin for review. Once approved, the device gets
          an asset tag and appears in the register.
        </div>
      )}
      <div className="f2">
        <Field label="Device name *" error={errors.name}>
          <input value={f.name} onChange={set('name')} placeholder="e.g. Patient monitor" />
        </Field>
        <Field label="Serial number *" error={errors.serialNumber}>
          <input value={f.serialNumber} onChange={set('serialNumber')} />
        </Field>
      </div>
      <div className="f2">
        <Field label="Manufacturer" error={errors.manufacturer}>
          <input value={f.manufacturer} onChange={set('manufacturer')} placeholder="e.g. Philips" />
        </Field>
        <Field label="Model" error={errors.model}>
          <input value={f.model} onChange={set('model')} placeholder="e.g. IntelliVue MX450" />
        </Field>
      </div>
      <div className="f2">
        {isAdmin ? (
          <Field label="Department *" error={errors.department}>
            <select value={f.department} onChange={set('department')}>
              <option value="">Select…</option>
              {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
        ) : (
          <Field label="Department *" error={errors.department}>
            <select value={f.department} onChange={set('department')}>
              <option value="">Select…</option>
              {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Location" error={errors.location}>
          <input value={f.location} onChange={set('location')} placeholder="Ward, room, bed" />
        </Field>
      </div>
      <div className="f2">
        <Field label="Risk class *" error={errors.riskClass}>
          <select value={f.riskClass} onChange={set('riskClass')}>
            {Object.entries(RISK).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="PM interval (months)" error={errors.pmIntervalMonths}>
          <input type="number" min="1" max="60" value={f.pmIntervalMonths}
            onChange={set('pmIntervalMonths')} />
        </Field>
      </div>
      <div className="f2">
        <Field label="Purchase date" error={errors.purchaseDate}>
          <input type="date" value={f.purchaseDate} onChange={set('purchaseDate')} />
        </Field>
        <Field label="Warranty expiry" error={errors.warrantyExpiry}>
          <input type="date" value={f.warrantyExpiry} onChange={set('warrantyExpiry')} />
        </Field>
      </div>
      <div className="f2">
        <Field label="Service contract expiry" error={errors.serviceContractExpiry}>
          <input type="date" value={f.serviceContractExpiry} onChange={set('serviceContractExpiry')} />
        </Field>
        <div />
      </div>
      <button className="btn" onClick={submit} disabled={busy}>
        {busy ? 'Saving…' : (isAdmin ? 'Register device' : 'Send for approval')}
      </button>
    </div>
  );
}
