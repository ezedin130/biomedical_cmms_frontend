import { useState } from 'react';
import { workOrderApi, userApi, miscApi } from '../api/endpoints.js';
import { useApi } from '../lib/useApi.js';
import { useToast } from '../context/ToastContext.jsx';
import { Field } from './ui.jsx';
import Icon from './Icon.jsx';
import { ACTION } from '../lib/constants.js';

/**
 * Renders the actions this user may take on this job, right now.
 *
 * The rules mirror the server's state machine. They are duplicated here for the
 * user's benefit — showing a button that would 403 is bad UX — but the server
 * remains the authority. Nothing here can grant a permission.
 */
export default function ActionPanel({ wo, user, onUpdated }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn) => {
    setBusy(true); setError('');
    try {
      const updated = await fn();
      onUpdated(updated);
      toast.show('Job updated');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const wrap = (title, icon, children) => (
    <div className="act">
      <h4><Icon name={icon} className="ico sm" />{title}</h4>
      {error && <div className="note red">{error}</div>}
      <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}>{children}</fieldset>
    </div>
  );

  const isMine = wo.assignedTo?.id === user.id;
  const isMyDept = wo.department?.id === user.department?.id;

  if (user.role === 'admin' && wo.status === 'reported')
    return wrap('Triage this fault', 'clip', <TriageForm wo={wo} run={run} />);

  if (user.role === 'admin' && ['triaged', 'vendor'].includes(wo.status))
    return wrap('Assign a technician', 'wrench', <AssignForm wo={wo} run={run} />);

  if (user.role === 'tech' && isMine && wo.status === 'assigned')
    return wrap('Start this job', 'wrench', (
      <>
        <p className="muted">Starting records your arrival time and marks the device as under repair.</p>
        <button className="btn" onClick={() => run(() => workOrderApi.start(wo.id))}>Start work</button>
      </>
    ));

  if (user.role === 'tech' && isMine && ['in_progress', 'on_hold'].includes(wo.status))
    return wrap('Record the repair', 'clip', <CompleteForm wo={wo} run={run} />);

  if ((user.role === 'head' && isMyDept || user.role === 'admin') && wo.status === 'completed')
    return wrap('Verify the repair', 'check', <VerifyForm wo={wo} run={run} />);

  return null;
}

function TriageForm({ wo, run }) {
  const [priority, setPriority] = useState(wo.priority);
  const [note, setNote] = useState('');
  return (
    <>
      <p className="muted">Confirm the priority the system calculated, then assign.</p>
      <div className="f2">
        <Field label="Priority">
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {['critical', 'high', 'medium', 'low'].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Triage note">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
        </Field>
      </div>
      <button className="btn" onClick={() => run(() => workOrderApi.triage(wo.id, { priority, note }))}>
        Confirm triage
      </button>
    </>
  );
}

function AssignForm({ wo, run }) {
  const { data: techs } = useApi(() => userApi.technicians(), []);
  const [technician, setTechnician] = useState('');
  const [note, setNote] = useState('');
  const eq = wo.equipment;
  const underWarranty = eq?.warrantyExpiry && new Date(eq.warrantyExpiry) > new Date();

  return (
    <>
      {underWarranty && (
        <div className="note red">
          This device is under manufacturer warranty until{' '}
          {new Date(eq.warrantyExpiry).toLocaleDateString()}. Opening it in-house may void
          the warranty — route it to the vendor instead.
        </div>
      )}
      <div className="f2">
        <Field label="Technician">
          <select value={technician} onChange={(e) => setTechnician(e.target.value)}>
            <option value="">Select…</option>
            {(techs || []).map((t) => (
              <option key={t.id} value={t.id}>{t.name} — {t.activeJobs} active · {t.skills}</option>
            ))}
          </select>
        </Field>
        <Field label="Instruction">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
        </Field>
      </div>
      <div className="row">
        <button className="btn" disabled={!technician}
          onClick={() => run(() => workOrderApi.assign(wo.id, { technician, note }))}>Assign job</button>
        <button className="btn ghost"
          onClick={() => run(() => workOrderApi.vendor(wo.id, { note: note || 'Routed to the vendor.' }))}>
          Route to vendor
        </button>
      </div>
    </>
  );
}

function CompleteForm({ wo, run }) {
  const { data: parts } = useApi(() => miscApi.parts(), []);
  // Pending proposals must not be selectable — they haven't been approved yet.
  const usableParts = (parts || []).filter((p) => p.status !== 'pending');
  const [f, setF] = useState({
    rootCause: '', action: 'repaired', labourHours: 1,
    functionalTest: 'pass', electricalSafetyTest: 'pass', recommendation: 'return',
    part: '', quantity: 1,
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = () => run(() => workOrderApi.complete(wo.id, {
    rootCause: f.rootCause,
    action: f.action,
    labourHours: Number(f.labourHours),
    functionalTest: f.functionalTest,
    electricalSafetyTest: f.electricalSafetyTest,
    recommendation: f.recommendation,
    partsUsed: f.part ? [{ part: f.part, quantity: Number(f.quantity) }] : [],
  }));

  return (
    <>
      <Field label="Root cause found *">
        <textarea value={f.rootCause} onChange={set('rootCause')} placeholder="What was actually wrong?" />
      </Field>
      <div className="f2">
        <Field label="Action taken">
          <select value={f.action} onChange={set('action')}>
            {Object.entries(ACTION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Labour hours *">
          <input type="number" min="0" step="0.5" value={f.labourHours} onChange={set('labourHours')} />
        </Field>
      </div>
      <div className="f2">
        <Field label="Part used">
          <select value={f.part} onChange={set('part')}>
            <option value="">None</option>
            {usableParts.map((p) => (
              <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                {p.name} ({p.quantity} in stock){p.quantity === 0 ? ' — out of stock' : ''}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Quantity">
          <input type="number" min="1" value={f.quantity} onChange={set('quantity')} />
        </Field>
      </div>
      <div className="f3">
        <Field label="Functional test">
          <select value={f.functionalTest} onChange={set('functionalTest')}>
            <option value="pass">Pass</option><option value="fail">Fail</option><option value="na">N/A</option>
          </select>
        </Field>
        <Field label="Electrical safety">
          <select value={f.electricalSafetyTest} onChange={set('electricalSafetyTest')}>
            <option value="pass">Pass</option><option value="fail">Fail</option><option value="na">N/A</option>
          </select>
        </Field>
        <Field label="Recommendation">
          <select value={f.recommendation} onChange={set('recommendation')}>
            <option value="return">Return to service</option>
            <option value="vendor">Refer to vendor</option>
            <option value="condemn">Recommend condemnation</option>
          </select>
        </Field>
      </div>
      <div className="row">
        <button className="btn" onClick={submit}>Mark repair complete</button>
        {wo.status === 'in_progress' ? (
          <button className="btn ghost" onClick={() => {
            const reason = window.prompt('Why is this job on hold?');
            if (reason) run(() => workOrderApi.hold(wo.id, { reason }));
          }}>Put on hold</button>
        ) : (
          <button className="btn ghost" onClick={() => run(() => workOrderApi.resume(wo.id))}>Resume work</button>
        )}
      </div>
    </>
  );
}

function VerifyForm({ wo, run }) {
  const [note, setNote] = useState('');
  const [rating, setRating] = useState(5);
  return (
    <>
      <p className="muted">
        Test the device on the ward before signing off. If it is still faulty, send it back —
        the same job reopens so the history stays together.
      </p>
      <div className="f2">
        <Field label="Your comment *">
          <input value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. tested on two patients, working normally" />
        </Field>
        <Field label="Rate the service">
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} / 5</option>)}
          </select>
        </Field>
      </div>
      <div className="row">
        <button className="btn" disabled={note.length < 3}
          onClick={() => run(() => workOrderApi.verify(wo.id, { accepted: true, note, rating }))}>
          Accept and close
        </button>
        <button className="btn danger" disabled={note.length < 3}
          onClick={() => run(() => workOrderApi.verify(wo.id, { accepted: false, note }))}>
          Still faulty — reopen
        </button>
      </div>
    </>
  );
}
