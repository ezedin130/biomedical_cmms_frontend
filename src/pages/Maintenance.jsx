import { useMemo, useState } from 'react';
import { equipmentApi, maintenanceApi, userApi } from '../api/endpoints.js';
import { useApi } from '../lib/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Field, Loading, ErrorBox, Empty } from '../components/ui.jsx';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const daysUntil = (d) => Math.round((new Date(d) - Date.now()) / 864e5);

export default function Maintenance() {
  const { isAdmin, isTech } = useAuth();
  const toast = useToast();
  const { data: dueList, loading: loadingDue, error: dueError, reload: reloadDue } =
    useApi(() => equipmentApi.maintenanceDue(), []);
  const { data: tasks, loading: loadingTasks, error: tasksError, reload: reloadTasks } =
    useApi(() => maintenanceApi.list(), []);
  const { data: techs } = useApi(() => userApi.technicians(), []);
  const [showForm, setShowForm] = useState(false);

  if (loadingDue || loadingTasks) return <Loading />;
  if (dueError) return <ErrorBox message={dueError} onRetry={reloadDue} />;
  if (tasksError) return <ErrorBox message={tasksError} onRetry={reloadTasks} />;

  const scheduled = (tasks || []).filter((t) => t.status === 'scheduled');
  const completed = (tasks || []).filter((t) => t.status === 'completed');
  const approved = (tasks || []).filter((t) => t.status === 'approved');

  const equipmentWithoutTask = (dueList || []).filter(
    (e) => !scheduled.some((t) => t.equipment?.id === e.id)
  );

  const reloadAll = () => { reloadDue(); reloadTasks(); };

  const approveTask = async (t) => {
    const note = window.prompt('Approval note (optional)') || '';
    await maintenanceApi.approve(t.id, { approvalNote: note });
    toast.show(`Approved ${t.equipment?.assetTag} PM`);
    reloadAll();
  };

  const cancelTask = async (t) => {
    if (!window.confirm(`Cancel the scheduled PM for ${t.equipment?.assetTag}?`)) return;
    await maintenanceApi.cancel(t.id);
    toast.show('Task cancelled');
    reloadAll();
  };

  const completeTask = async (t) => {
    const note = window.prompt('Describe what was done:');
    if (!note || note.trim().length < 3) return;
    await maintenanceApi.complete(t.id, { completionNote: note });
    toast.show('Marked complete — waiting for admin approval');
    reloadAll();
  };

  return (
    <>
      <header className="head">
        <div><h2>Maintenance plan</h2>
          <p>Scheduled servicing, soonest first. Admin schedules and approves; technicians perform the work.</p></div>
        {isAdmin && (
          <button className="btn" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : 'Schedule maintenance'}
          </button>
        )}
      </header>

      {showForm && isAdmin && (
        <ScheduleForm
          dueList={dueList || []}
          techs={techs || []}
          onDone={() => { setShowForm(false); reloadAll(); }}
        />
      )}

      {isAdmin && completed.length > 0 && (
        <Section title="Awaiting your approval"
                 hint="Technicians finished these PMs. Approve to record the service in the asset log and schedule the next cycle.">
          <table>
            <thead><tr><th>Device</th><th>Department</th><th>Technician</th>
              <th>Completed</th><th>What was done</th><th /></tr></thead>
            <tbody>
              {completed.map((t) => (
                <tr key={t.id}>
                  <td><span className="tag">{t.equipment?.assetTag}</span> {t.equipment?.name}</td>
                  <td>{t.department?.name}</td>
                  <td>{t.completedBy?.name || t.assignedTo?.name || '—'}</td>
                  <td className="mono">{fmtDate(t.completedAt)}</td>
                  <td><small>{t.completionNote}</small></td>
                  <td className="row" style={{ gap: 6 }}>
                    <button className="btn sm" onClick={() => approveTask(t)}>Approve</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      <Section title={isTech ? 'Your assigned maintenance' : 'Scheduled maintenance'}
               hint="These are formal PM tasks with a technician and a date."
               empty={!scheduled.length && 'No scheduled maintenance tasks.'}>
        {scheduled.length > 0 && (
          <table>
            <thead><tr><th>Device</th><th>Department</th><th>Technician</th>
              <th>Scheduled</th><th>Every</th><th>Status</th>
              {(isAdmin || isTech) && <th />}</tr></thead>
            <tbody>
              {scheduled.map((t) => {
                const dLeft = daysUntil(t.scheduledFor);
                return (
                  <tr key={t.id}>
                    <td><span className="tag">{t.equipment?.assetTag}</span> {t.equipment?.name}</td>
                    <td>{t.department?.name}</td>
                    <td>{t.assignedTo?.name || <span className="muted">Unassigned</span>}</td>
                    <td className="mono">{fmtDate(t.scheduledFor)}</td>
                    <td className="mono muted">{t.intervalMonths > 0 ? `${t.intervalMonths} mo` : 'one-off'}</td>
                    <td>{dLeft < 0
                      ? <span className="chip c-red">{Math.abs(dLeft)} d overdue</span>
                      : dLeft <= 7
                        ? <span className="chip c-amber">due in {dLeft} d</span>
                        : <span className="chip c-gray">in {dLeft} d</span>}</td>
                    {(isAdmin || isTech) && (
                      <td className="row" style={{ gap: 6 }}>
                        {isTech && (
                          <button className="btn sm" onClick={() => completeTask(t)}>Mark done</button>
                        )}
                        {isAdmin && (
                          <button className="btn ghost sm" onClick={() => cancelTask(t)}>Cancel</button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>

      {isAdmin && (
        <Section title="Devices due for service"
                 hint="Suggestions based on each device's PM interval. Use the button above to turn one into a scheduled task."
                 empty={!equipmentWithoutTask.length && 'Every due device already has a scheduled task.'}>
          {equipmentWithoutTask.length > 0 && (
            <table>
              <thead><tr><th>Asset tag</th><th>Device</th><th>Department</th>
                <th>Interval</th><th>Next service</th><th>Status</th></tr></thead>
              <tbody>
                {equipmentWithoutTask.map((e) => (
                  <tr key={e._id || e.id}>
                    <td><span className="tag">{e.assetTag}</span></td>
                    <td><b>{e.name}</b></td>
                    <td>{e.department?.name}</td>
                    <td className="mono">every {e.pmIntervalMonths} mo</td>
                    <td className="mono">{fmtDate(e.nextPmDue)}</td>
                    <td>{e.daysUntilDue < 0
                      ? <span className="chip c-red">{Math.abs(e.daysUntilDue)} d overdue</span>
                      : e.daysUntilDue < 30
                        ? <span className="chip c-amber">due in {e.daysUntilDue} d</span>
                        : <span className="chip c-gray">in {e.daysUntilDue} d</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      )}

      {approved.length > 0 && (
        <Section title="Recently approved"
                 hint="Completed and signed off. The next cycle (if recurring) has been scheduled automatically.">
          <table>
            <thead><tr><th>Device</th><th>Technician</th>
              <th>Completed</th><th>Approved</th></tr></thead>
            <tbody>
              {approved.slice(0, 10).map((t) => (
                <tr key={t.id}>
                  <td><span className="tag">{t.equipment?.assetTag}</span> {t.equipment?.name}</td>
                  <td>{t.completedBy?.name || '—'}</td>
                  <td className="mono">{fmtDate(t.completedAt)}</td>
                  <td className="mono muted">{fmtDate(t.approvedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}
    </>
  );
}

function Section({ title, hint, empty, children }) {
  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="pad" style={{ paddingBottom: 0 }}>
        <b>{title}</b>
        {hint && <p className="muted">{hint}</p>}
      </div>
      {empty ? <div className="pad"><Empty text={empty} /></div> : children}
    </div>
  );
}

function ScheduleForm({ dueList, techs, onDone }) {
  const toast = useToast();
  const [f, setF] = useState({
    equipment: '', scheduledFor: '', intervalMonths: 6, assignedTo: '', notes: '',
  });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const selected = useMemo(
    () => dueList.find((d) => d.id === f.equipment),
    [dueList, f.equipment]
  );

  const pickDevice = (e) => {
    const dev = dueList.find((d) => d.id === e.target.value);
    setF({
      ...f,
      equipment: e.target.value,
      intervalMonths: dev?.pmIntervalMonths ?? f.intervalMonths,
      scheduledFor: dev?.nextPmDue
        ? new Date(dev.nextPmDue).toISOString().slice(0, 10)
        : f.scheduledFor,
    });
  };

  const submit = async () => {
    setErrors({});
    const body = { ...f };
    if (!body.assignedTo) delete body.assignedTo;
    setBusy(true);
    try {
      const t = await maintenanceApi.create(body);
      toast.show(`Scheduled PM for ${t.equipment?.assetTag}`);
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
      <Field label="Device *" error={errors.equipment}>
        <select value={f.equipment} onChange={pickDevice}>
          <option value="">Select a device…</option>
          {dueList.map((d) => (
            <option key={d.id} value={d.id}>
              {d.assetTag} — {d.name} ({d.department?.name})
            </option>
          ))}
        </select>
      </Field>

      {selected && (
        <div className="note blue">
          Last PM: {fmtDate(selected.lastPmAt)} · Interval: every {selected.pmIntervalMonths} mo ·
          {' '}Next due: {fmtDate(selected.nextPmDue)}
        </div>
      )}

      <div className="f2">
        <Field label="Scheduled date *" error={errors.scheduledFor}>
          <input type="date" value={f.scheduledFor} onChange={set('scheduledFor')} />
        </Field>
        <Field label="Repeat every (months, 0 = one-off)" error={errors.intervalMonths}>
          <input type="number" min="0" max="60" value={f.intervalMonths}
            onChange={set('intervalMonths')} />
        </Field>
      </div>

      <Field label="Assign technician (optional)" error={errors.assignedTo}>
        <select value={f.assignedTo} onChange={set('assignedTo')}>
          <option value="">Assign later</option>
          {techs.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.activeJobs} active jobs)
            </option>
          ))}
        </select>
      </Field>

      <Field label="Notes for the technician" error={errors.notes}>
        <textarea value={f.notes} onChange={set('notes')}
          placeholder="Anything specific to check?" />
      </Field>

      <button className="btn" onClick={submit} disabled={busy}>
        {busy ? 'Saving…' : 'Schedule maintenance'}
      </button>
    </div>
  );
}
