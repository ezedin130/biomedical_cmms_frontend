import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { equipmentApi, workOrderApi, faultCategoryApi } from '../api/endpoints.js';
import { useApi } from '../lib/useApi.js';
import { useToast } from '../context/ToastContext.jsx';
import { Field, Loading } from '../components/ui.jsx';
import { DEVICE_STATE, IMPACT, RISK, SLA_HOURS } from '../lib/constants.js';

// Mirrors the server's scoring rule so the reporter can see the consequence of
// their answers before submitting. The server recomputes it and wins.
const RISK_SCORE = { life_support: 3, high: 2, medium: 1, low: 0 };
const STATE_SCORE = { down: 2, partial: 1, intermittent: 0 };
const IMPACT_SCORE = { injury: 3, near_miss: 2, no: 0 };
const previewPriority = (risk, state, impact) => {
  const s = (RISK_SCORE[risk] ?? 0) + STATE_SCORE[state] + IMPACT_SCORE[impact];
  return s >= 6 ? 'critical' : s >= 4 ? 'high' : s >= 2 ? 'medium' : 'low';
};

export default function ReportFault() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading } = useApi(() => equipmentApi.list({ limit: 100 }), []);
  const { data: cats } = useApi(() => faultCategoryApi.list(), []);
  const [f, setF] = useState({
    equipment: '', location: '', contactPhone: '', faultCategory: '',
    description: '', errorCode: '', deviceState: 'partial', patientImpact: 'no', isolated: false,
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const devices = (data?.items || []).filter(
    (e) => e.status !== 'condemned' && e.approval !== 'pending'
  );
  const selected = useMemo(() => devices.find((d) => d.id === f.equipment), [devices, f.equipment]);
  const set = (k) => (e) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const pickDevice = (e) => {
    const dev = devices.find((d) => d.id === e.target.value);
    setF({ ...f, equipment: e.target.value, location: dev?.location || f.location });
  };

  const submit = async () => {
    const next = {};
    if (!f.equipment) next.equipment = 'Select the faulty device.';
    if (!f.location.trim()) next.location = 'Tell the technician where the device is.';
    if (!f.faultCategory) next.faultCategory = 'Pick a fault category.';
    if (f.description.trim().length < 10) next.description = 'Describe the fault in a sentence.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const wo = await workOrderApi.create(f);
      toast.show(`Reported as ${wo.code} — biomedical has been notified`);
      navigate(`/work-orders/${wo.id}`);
    } catch (err) {
      // Field-level errors from Zod come back in err.details.
      if (err.details) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      } else {
        setErrors({ form: err.message });
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;
  const priority = selected ? previewPriority(selected.riskClass, f.deviceState, f.patientImpact) : null;

  return (
    <>
      <header className="head">
        <div><h2>Report a fault</h2>
          <p>Scan the asset tag on the device, or pick it from the list below.</p></div>
      </header>

      <div className="card pad" style={{ maxWidth: 760 }}>
        {errors.form && <div className="note red">{errors.form}</div>}

        <Field label="Equipment *" error={errors.equipment}>
          <select value={f.equipment} onChange={pickDevice}>
            <option value="">Select a device…</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>{d.assetTag} — {d.name} ({d.location})</option>
            ))}
          </select>
        </Field>

        {selected && (
          <div className="note blue">
            <b>{selected.manufacturer} {selected.model}</b> · serial {selected.serialNumber} ·
            risk class {RISK[selected.riskClass]}
            {selected.warrantyExpiry && new Date(selected.warrantyExpiry) > new Date() &&
              <> · <b>under manufacturer warranty until {new Date(selected.warrantyExpiry).toLocaleDateString()}</b></>}
          </div>
        )}

        <div className="f2">
          <Field label="Exact location *" error={errors.location}>
            <input value={f.location} onChange={set('location')} placeholder="Ward, room, bed number" />
          </Field>
          <Field label="Contact phone">
            <input value={f.contactPhone} onChange={set('contactPhone')} placeholder="09.." />
          </Field>
        </div>

        <div className="f2">
          <Field label="Fault category *">
            <select value={f.faultCategory} onChange={set('faultCategory')}>
              <option value="">Select…</option>
              {(cats || []).map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="Error code shown on screen">
            <input value={f.errorCode} onChange={set('errorCode')} placeholder="e.g. E-014" />
          </Field>
        </div>

        <Field label="What is happening? *" error={errors.description}>
          <textarea value={f.description} onChange={set('description')}
            placeholder="Describe the symptom, when it started, and what you were doing at the time." />
        </Field>

        <div className="f2">
          <Field label="Device condition *">
            <select value={f.deviceState} onChange={set('deviceState')}>
              {Object.entries(DEVICE_STATE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Patient safety impact *">
            <select value={f.patientImpact} onChange={set('patientImpact')}>
              {Object.entries(IMPACT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
        </div>

        <label className="checkline">
          <input type="checkbox" checked={f.isolated} onChange={set('isolated')} />
          I have placed an “out of service” tag on the device
        </label>

        {priority && (
          <div className="note">
            The system will raise this as <b>{priority}</b> based on risk class, device condition
            and patient impact. A technician must respond within{' '}
            {SLA_HOURS[priority] < 1 ? `${SLA_HOURS[priority] * 60} minutes` : `${SLA_HOURS[priority]} hours`}.
          </div>
        )}

        <div className="row">
          <button className="btn" onClick={submit} disabled={busy}>
            {busy ? 'Sending…' : 'Send to biomedical'}
          </button>
          <button className="btn ghost" onClick={() => navigate('/')}>Cancel</button>
        </div>
      </div>
    </>
  );
}
