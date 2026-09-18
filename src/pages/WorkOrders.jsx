import { useState } from 'react';
import { workOrderApi } from '../api/endpoints.js';
import { useApi } from '../lib/useApi.js';
import WorkOrderTable from '../components/WorkOrderTable.jsx';
import { Loading, ErrorBox, Empty } from '../components/ui.jsx';

const TABS = [['true', 'Open'], ['false', 'Closed'], ['', 'All']];

export default function WorkOrders() {
  const [tab, setTab] = useState('true');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi(
    () => workOrderApi.list({ ...(tab ? { open: tab } : {}), page, limit: 25 }),
    [tab, page]
  );

  return (
    <>
      <header className="head">
        <div><h2>Work orders</h2><p>Scoped to what your account is allowed to see.</p></div>
      </header>

      <div className="tabs">
        {TABS.map(([v, label]) => (
          <button key={label} className={tab === v ? 'sel' : ''}
            onClick={() => { setTab(v); setPage(1); }}>{label}</button>
        ))}
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}
      <div className="card">
        {loading ? <Loading />
          : data?.items?.length ? <WorkOrderTable items={data.items} />
          : <Empty text="No work orders in this tab." />}
      </div>

      {data?.pages > 1 && (
        <div className="row" style={{ marginTop: 14, justifyContent: 'center' }}>
          <button className="btn ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="muted">Page {data.page} of {data.pages}</span>
          <button className="btn ghost" disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </>
  );
}
