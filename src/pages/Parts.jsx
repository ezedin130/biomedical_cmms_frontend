import { useMemo, useState } from 'react';
import { miscApi } from '../api/endpoints.js';
import { useApi } from '../lib/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Field, Loading, ErrorBox } from '../components/ui.jsx';
import { money } from '../lib/format.js';

export default function Parts() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(() => miscApi.parts(), []);
  const [showForm, setShowForm] = useState(false);
  const [receiving, setReceiving] = useState({});

  const setRecvQty = (id, qty) => setReceiving((r) => ({ ...r, [id]: qty }));

  const receive = async (part) => {
    const raw = receiving[part.id];
    const qty = Math.max(1, Math.floor(Number(raw) || 0));
    if (!qty) {
      toast.show('Enter a quantity first');
      return;
    }
    await miscApi.receiveStock(part.id, qty);
    toast.show(`Received ${qty} × ${part.sku}`);
    setRecvQty(part.id, '');
    reload();
  };

  const approve = async (p) => {
    await miscApi.approvePart(p.id);
    toast.show(`Approved ${p.sku} — ${p.name}`);
    reload();
  };

  const reject = async (p) => {
    if (!window.confirm(`Reject the proposal for ${p.sku} — ${p.name}?`)) return;
    await miscApi.rejectPart(p.id);
    toast.show(`Rejected ${p.sku}`);
    reload();
  };

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const pending = data.filter((p) => p.status === 'pending');
  const approved = data.filter((p) => p.status !== 'pending');
  const low = approved.filter((p) => p.quantity <= p.reorderLevel);

  return (
    <>
      <header className="head">
        <div><h2>Spare parts</h2>
          <p>Stock is deducted automatically when a technician records a part on a job.</p></div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : (isAdmin ? 'Add spare part' : 'Propose spare part')}
        </button>
      </header>

      {showForm && (
        <CreatePart
          parts={data}
          isAdmin={isAdmin}
          onDone={() => { setShowForm(false); reload(); }}
        />
      )}

      {pending.length > 0 && (
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="pad" style={{ paddingBottom: 0 }}>
            <b>{isAdmin ? 'Awaiting your approval' : 'Your pending proposals'}</b>
            <p className="muted">
              {isAdmin
                ? 'Technicians proposed these parts. Approve to add them to the catalogue, or reject.'
                : 'These proposals have been sent to admin. They will show up in the catalogue once approved.'}
            </p>
          </div>
          <table>
            <thead><tr><th>SKU</th><th>Part</th><th>Proposed by</th>
              <th>Opening qty</th><th>Reorder</th><th>Unit price</th>
              {isAdmin && <th />}</tr></thead>
            <tbody>
              {pending.map((p) => (
                <tr key={p.id}>
                  <td><span className="tag">{p.sku}</span></td>
                  <td>{p.name}</td>
                  <td>{p.proposedBy?.name || <span className="muted">—</span>}</td>
                  <td className="mono">{p.quantity}</td>
                  <td className="mono muted">{p.reorderLevel}</td>
                  <td className="mono">{money(p.unitPrice)}</td>
                  {isAdmin && (
                    <td className="row" style={{ gap: 6 }}>
                      <button className="btn sm" onClick={() => approve(p)}>Approve</button>
                      <button className="btn ghost sm" onClick={() => reject(p)}>Reject</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {low.length > 0 && <div className="note">{low.length} item(s) at or below reorder level.</div>}
      <div className="card">
        <table>
          <thead><tr><th>SKU</th><th>Part</th><th>On hand</th><th>Reorder at</th>
            <th>Unit price</th><th>Status</th>{isAdmin && <th>Receive stock</th>}</tr></thead>
          <tbody>
            {approved.map((p) => (
              <tr key={p.id}>
                <td><span className="tag">{p.sku}</span></td>
                <td>{p.name}</td>
                <td className="mono">{p.quantity}</td>
                <td className="mono muted">{p.reorderLevel}</td>
                <td className="mono">{money(p.unitPrice)}</td>
                <td>{p.quantity === 0 ? <span className="chip c-red">Out of stock</span>
                  : p.quantity <= p.reorderLevel ? <span className="chip c-amber">Reorder</span>
                  : <span className="chip c-green">In stock</span>}</td>
                {isAdmin && (
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <input type="number" min="1" style={{ width: 80 }}
                        placeholder="Qty"
                        value={receiving[p.id] ?? ''}
                        onChange={(e) => setRecvQty(p.id, e.target.value)} />
                      <button className="btn ghost sm" onClick={() => receive(p)}>Add stock</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function CreatePart({ parts, isAdmin, onDone }) {
  const toast = useToast();
  const [f, setF] = useState({
    sku: '', name: '', quantity: 0, reorderLevel: 1, unitPrice: 0,
  });
  const [topUp, setTopUp] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const skuUpper = f.sku.trim().toUpperCase();
  const duplicate = useMemo(
    () => (skuUpper ? parts.find((p) => p.sku === skuUpper) : null),
    [parts, skuUpper]
  );

  const submit = async () => {
    setErrors({});
    setBusy(true);
    try {
      const part = await miscApi.createPart(f);
      toast.show(isAdmin
        ? `Added ${part.sku} — ${part.name}`
        : `Proposed ${part.sku} — awaiting admin approval`);
      onDone();
    } catch (err) {
      setErrors(err.details
        ? Object.fromEntries(err.details.map((d) => [d.field, d.message]))
        : { form: err.message });
    } finally {
      setBusy(false);
    }
  };

  const addToExisting = async () => {
    const qty = Math.max(1, Math.floor(Number(topUp) || 0));
    if (!qty) {
      setErrors({ topUp: 'Enter how many units to add' });
      return;
    }
    setBusy(true);
    try {
      await miscApi.receiveStock(duplicate.id, qty);
      toast.show(`Added ${qty} × ${duplicate.sku} to stock`);
      onDone();
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setBusy(false);
    }
  };

  const duplicatePending = duplicate?.status === 'pending';

  return (
    <div className="card pad" style={{ marginBottom: 18 }}>
      {errors.form && <div className="note red">{errors.form}</div>}
      {!isAdmin && (
        <div className="note">
          Your proposal will go to admin for review. Once approved, the part
          appears in the catalogue and can be recorded on repairs.
        </div>
      )}
      <div className="f2">
        <Field label="SKU *" error={errors.sku}>
          <input value={f.sku} onChange={set('sku')} placeholder="e.g. FIL-HEPA-01" autoCapitalize="off" />
        </Field>
        <Field label="Part name *" error={errors.name}>
          <input value={f.name} onChange={set('name')} placeholder="e.g. HEPA filter"
            disabled={!!duplicate} />
        </Field>
      </div>

      {duplicate ? (
        duplicatePending ? (
          <div className="note">
            <b>{duplicate.sku}</b> — {duplicate.name} has already been proposed and is
            awaiting admin approval. No new submission is needed.
          </div>
        ) : (
          <div className="note">
            <b>{duplicate.sku}</b> — {duplicate.name} is already in the catalogue
            ({duplicate.quantity} on hand, reorder at {duplicate.reorderLevel},
            {' '}{money(duplicate.unitPrice)} each).
            {isAdmin ? (
              <div className="row" style={{ gap: 8, marginTop: 10 }}>
                <input type="number" min="1" style={{ width: 120 }} placeholder="Units to add"
                  value={topUp} onChange={(e) => setTopUp(e.target.value)} />
                <button className="btn" onClick={addToExisting} disabled={busy}>
                  {busy ? 'Saving…' : 'Add to existing stock'}
                </button>
              </div>
            ) : (
              <div className="muted" style={{ marginTop: 6 }}>
                Only admin can top up stock. Ask admin to receive stock into this SKU.
              </div>
            )}
            {errors.topUp && <div className="err on" style={{ marginTop: 6 }}>{errors.topUp}</div>}
          </div>
        )
      ) : (
        <>
          <div className="f2">
            <Field label={isAdmin ? 'Opening quantity' : 'Suggested opening quantity'} error={errors.quantity}>
              <input type="number" min="0" value={f.quantity} onChange={set('quantity')} />
            </Field>
            <Field label="Reorder level *" error={errors.reorderLevel}>
              <input type="number" min="0" value={f.reorderLevel} onChange={set('reorderLevel')} />
            </Field>
          </div>
          <div className="f2">
            <Field label="Unit price" error={errors.unitPrice}>
              <input type="number" min="0" step="0.01" value={f.unitPrice} onChange={set('unitPrice')} />
            </Field>
            <div />
          </div>
          <button className="btn" onClick={submit} disabled={busy}>
            {busy ? 'Saving…' : (isAdmin ? 'Add to catalogue' : 'Send for approval')}
          </button>
        </>
      )}
    </div>
  );
}
