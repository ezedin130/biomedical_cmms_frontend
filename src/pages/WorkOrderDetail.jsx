import { useNavigate, useParams } from 'react-router-dom';
import { workOrderApi, faultCategoryApi } from '../api/endpoints.js';
import { useApi } from '../lib/useApi.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PriorityChip, StatusChip, RailFull, Loading, ErrorBox } from '../components/ui.jsx';
import ActionPanel from '../components/ActionPanel.jsx';
import Icon from '../components/Icon.jsx';
import { DEVICE_STATE, IMPACT, RISK, ACTION } from '../lib/constants.js';
import { stamp, timeAgo, money, isBreached, dueIn } from '../lib/format.js';

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: wo, loading, error, reload, setData } = useApi(() => workOrderApi.get(id), [id]);
  const { data: cats } = useApi(() => faultCategoryApi.list({ includeInactive: 'true' }), []);
  const categoryLabel = (code) =>
    (cats || []).find((c) => c.code === code)?.label || code;

  if (loading) return <Loading label="Loading job…" />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const eq = wo.equipment;
  const partsCost = (wo.repair?.partsUsed || [])
    .reduce((a, p) => a + p.quantity * p.unitPrice, 0);

  return (
    <>
      <button className="btn ghost sm" onClick={() => navigate(-1)} style={{ marginBottom: 14 }}>
        <Icon name="back" className="ico sm" /> Back
      </button>

      <header className="head">
        <div>
          <h2>{wo.code} · {eq?.name}</h2>
          <p>{wo.department?.name} / {wo.location} · raised {timeAgo(wo.reportedAt)}</p>
        </div>
        <div className="row"><PriorityChip value={wo.priority} /><StatusChip value={wo.status} /></div>
      </header>

      {isBreached(wo) && <div className="note red">Response target missed — {dueIn(wo)}</div>}
      {['on_hold', 'vendor'].includes(wo.status) && wo.holdReason &&
        <div className="note"><b>{wo.status === 'vendor' ? 'With vendor' : 'On hold'}:</b> {wo.holdReason}</div>}
      {wo.verification?.accepted &&
        <div className="note green">Signed off by the ward: {wo.verification.note} — rated {wo.verification.rating}/5</div>}

      <div className="two">
        <div>
          <div className="card pad">
            <dl>
              <dt>Device</dt><dd><b>{eq?.name}</b> — {eq?.manufacturer} {eq?.model}</dd>
              <dt>Asset tag</dt><dd><span className="tag">{eq?.assetTag}</span> serial {eq?.serialNumber}</dd>
              <dt>Risk class</dt><dd>{RISK[eq?.riskClass]}</dd>
              <dt>Reported by</dt><dd>{wo.reportedBy?.name}, {stamp(wo.reportedAt)}</dd>
              <dt>Category</dt><dd>{categoryLabel(wo.faultCategory)}{wo.errorCode && <> · code <span className="mono">{wo.errorCode}</span></>}</dd>
              <dt>Condition</dt><dd>{DEVICE_STATE[wo.deviceState]}</dd>
              <dt>Patient impact</dt>
              <dd>{wo.patientImpact === 'no' ? IMPACT.no : <b className="danger">{IMPACT[wo.patientImpact]}</b>}</dd>
              <dt>Isolated</dt><dd>{wo.isolated ? 'Yes, tagged out of service' : 'No — still on the floor'}</dd>
              <dt>Technician</dt><dd>{wo.assignedTo?.name || 'Not assigned'}</dd>
            </dl>
            <p className="quote">{wo.description}</p>

            {wo.repair && (
              <>
                <h4 className="sub">Repair record</h4>
                <dl>
                  <dt>Root cause</dt><dd>{wo.repair.rootCause}</dd>
                  <dt>Action</dt><dd>{ACTION[wo.repair.action]}</dd>
                  <dt>Parts used</dt>
                  <dd>{wo.repair.partsUsed?.length
                    ? `${wo.repair.partsUsed.map((p) => `${p.name} ×${p.quantity}`).join(', ')} (${money(partsCost)})`
                    : 'None'}</dd>
                  <dt>Labour</dt><dd>{wo.repair.labourHours} h</dd>
                  <dt>Functional test</dt><dd><TestChip v={wo.repair.functionalTest} /></dd>
                  <dt>Electrical safety</dt><dd><TestChip v={wo.repair.electricalSafetyTest} /></dd>
                  <dt>Recommendation</dt>
                  <dd>{{ return: 'Return to service', vendor: 'Refer to vendor', condemn: 'Recommend condemnation' }[wo.repair.recommendation]}</dd>
                </dl>
              </>
            )}
          </div>

          <ActionPanel wo={wo} user={user} onUpdated={setData} />
        </div>

        <div>
          <div className="card pad">
            <RailFull wo={wo} />
            <h4 className="sub">Audit trail</h4>
            <ul className="hist">
              {[...(wo.history || [])].reverse().map((h, i) => (
                <li key={i}>
                  <b>{h.action}</b>{h.note && ` — ${h.note}`}
                  <small>{h.by?.name || 'system'} · {stamp(h.at)}</small>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

const TestChip = ({ v }) => (
  <span className={`chip ${v === 'pass' ? 'c-green' : v === 'fail' ? 'c-red' : 'c-gray'}`}>
    {v === 'pass' ? 'Pass' : v === 'fail' ? 'Fail' : 'Not applicable'}
  </span>
);
