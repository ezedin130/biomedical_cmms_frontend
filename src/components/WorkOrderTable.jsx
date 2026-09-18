import { useNavigate } from 'react-router-dom';
import { PriorityChip, StatusChip, RailMini } from './ui.jsx';
import { timeAgo, isBreached, dueIn } from '../lib/format.js';

export default function WorkOrderTable({ items }) {
  const navigate = useNavigate();
  return (
    <table>
      <thead>
        <tr>
          <th>Job</th><th>Equipment</th><th>Location</th><th>Priority</th>
          <th>Status</th><th>Progress</th><th>Age</th>
        </tr>
      </thead>
      <tbody>
        {items.map((wo) => (
          <tr key={wo.id} className="clickable" onClick={() => navigate(`/work-orders/${wo.id}`)}>
            <td><span className="tag">{wo.code}</span></td>
            <td><b>{wo.equipment?.name}</b><br />
              <small className="mono muted">{wo.equipment?.assetTag}</small></td>
            <td>{wo.department?.name}<br /><small className="muted">{wo.location}</small></td>
            <td><PriorityChip value={wo.priority} />
              {isBreached(wo) && <><br /><small className="danger">{dueIn(wo)}</small></>}</td>
            <td><StatusChip value={wo.status} />
              {wo.assignedTo && <><br /><small className="muted">{wo.assignedTo.name}</small></>}</td>
            <td><RailMini wo={wo} /></td>
            <td><small>{timeAgo(wo.reportedAt)}</small></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
