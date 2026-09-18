import { STAGES, STATUS_LABEL } from '../lib/constants.js';
import { stageIndex } from '../lib/format.js';
import Icon from './Icon.jsx';

export const PriorityChip = ({ value }) => (
  <span className={`chip ${{ critical: 'c-red', high: 'c-amber', medium: 'c-blue', low: 'c-gray' }[value]}`}>
    {value[0].toUpperCase() + value.slice(1)}
  </span>
);

export const StatusChip = ({ value }) => {
  const tone = {
    reported: 'c-red', triaged: 'c-amber', assigned: 'c-blue', in_progress: 'c-violet',
    on_hold: 'c-amber', vendor: 'c-amber', completed: 'c-green', closed: 'c-gray',
  }[value];
  return <span className={`chip ${tone}`}>{STATUS_LABEL[value]}</span>;
};

/** The signature progress rail: six segments, one per lifecycle stage. */
export const RailMini = ({ wo }) => {
  const i = stageIndex(wo);
  const stalled = ['on_hold', 'vendor'].includes(wo.status);
  return (
    <span className="rail" title={STATUS_LABEL[wo.status]}>
      {STAGES.map((_, k) => (
        <i key={k} className={
          wo.status === 'closed' || k < i ? 'done' : k === i ? (stalled ? 'stall' : 'now') : ''
        } />
      ))}
    </span>
  );
};

export const RailFull = ({ wo }) => {
  const i = stageIndex(wo);
  const find = (stage) => [...(wo.history || [])].reverse().find((h) => h.toStatus === stage);
  return (
    <ul className="railbig">
      {STAGES.map((stage, k) => {
        const done = wo.status === 'closed' || k < i;
        const nowHere = k === i && wo.status !== 'closed';
        const ev = find(stage);
        return (
          <li key={stage} className={`${done ? 'done' : ''} ${nowHere ? 'now' : ''}`}>
            <span className="dot">{done ? '✓' : k + 1}</span>
            <span>
              <b>{STATUS_LABEL[stage]}</b>
              <small>{ev ? new Date(ev.at).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</small>
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export const Kpi = ({ label, value, sub, tone }) => (
  <div className="card kpi">
    <small>{label}</small>
    <span className={tone ? `tone-${tone}` : ''}>{value}</span>
    {sub && <em>{sub}</em>}
  </div>
);

export const Loading = ({ label = 'Loading…' }) => (
  <div className="empty"><span className="spinner" /> {label}</div>
);

export const ErrorBox = ({ message, onRetry }) => (
  <div className="note red">
    <Icon name="alert" className="ico sm" /> {message}
    {onRetry && <button className="btn ghost sm" onClick={onRetry} style={{ marginLeft: 10 }}>Retry</button>}
  </div>
);

export const Empty = ({ title = 'Nothing here', text }) => (
  <div className="empty"><b>{title}</b>{text}</div>
);

export const Field = ({ label, error, children }) => (
  <div className="field">
    {label && <label>{label}</label>}
    {children}
    {error && <div className="err on">{error}</div>}
  </div>
);
