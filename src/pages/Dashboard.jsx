import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { miscApi, workOrderApi } from '../api/endpoints.js';
import { useApi } from '../lib/useApi.js';
import { Kpi, Loading, ErrorBox, Empty } from '../components/ui.jsx';
import WorkOrderTable from '../components/WorkOrderTable.jsx';

export default function Dashboard() {
  const { user, isAdmin, isHead, isTech } = useAuth();
  const stats = useApi(() => miscApi.dashboard(), []);
  const jobs = useApi(() => workOrderApi.list({ open: 'true', limit: 50 }), []);

  if (stats.loading || jobs.loading) return <Loading label="Loading your dashboard…" />;
  if (stats.error) return <ErrorBox message={stats.error} onRetry={stats.reload} />;

  const s = stats.data;
  const open = jobs.data?.items || [];
  const byStatus = s.byStatus || {};
  const waiting = (byStatus.reported || 0) + (byStatus.triaged || 0);

  return (
    <>
      <header className="head">
        <div>
          <h2>{isTech ? 'My jobs' : isHead ? 'Department dashboard' : 'Operations dashboard'}</h2>
          <p>{isHead ? `${user.department?.name} — equipment status at a glance`
            : isTech ? 'Everything currently on your bench'
            : 'Hospital-wide clinical engineering activity'}</p>
        </div>
        {isHead && <Link className="btn" to="/report">Report a fault</Link>}
      </header>

      <div className="grid kpis">
        <Kpi label="Open work orders" value={open.length} sub={`${s.finishedJobs} finished all time`} />
        {isAdmin && <Kpi label="Waiting for assignment" value={waiting}
          sub="needs your action" tone={waiting ? 'red' : 'green'} />}
        <Kpi label="Past response target" value={s.slaBreaches.length}
          sub="SLA breached" tone={s.slaBreaches.length ? 'amber' : 'green'} />
        <Kpi label="Average repair time" value={`${s.mttrHours} h`} sub="mean time to repair" />
        <Kpi label="Devices out of service" value={s.equipmentByStatus?.under_repair || 0}
          sub="unavailable to wards" />
      </div>

      {s.slaBreaches.length > 0 && (
        <div className="note red" style={{ marginTop: 18 }}>
          {s.slaBreaches.length} job(s) are past the response target for their priority.
        </div>
      )}

      <h3 className="sect">Open jobs<span className="n">{open.length}</span></h3>
      <div className="card">
        {open.length ? <WorkOrderTable items={open} />
          : <Empty title="Nothing open" text="Every reported fault has been closed." />}
      </div>

      {isAdmin && s.byDepartment?.length > 0 && (
        <>
          <h3 className="sect">Failures by department</h3>
          <div className="card pad bars">
            {s.byDepartment.map((d) => {
              const max = Math.max(...s.byDepartment.map((x) => x.count));
              return (
                <div className="b" key={d.department}>
                  <span>{d.department}</span>
                  <span className="track"><span className="fill" style={{ width: `${(d.count / max) * 100}%` }} /></span>
                  <span className="v">{d.count}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
