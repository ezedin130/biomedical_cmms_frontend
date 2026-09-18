// Display labels only. Every rule that matters is enforced on the server;
// duplicating labels here is fine, duplicating logic is not.
export const CATEGORY = {
  electrical: 'Electrical', mechanical: 'Mechanical', software: 'Software / display',
  calibration: 'Calibration / accuracy', accessory: 'Accessory or consumable',
  damage: 'Physical damage', no_power: 'No power', unknown: 'Unknown',
};
export const DEVICE_STATE = {
  down: 'Completely down', partial: 'Working partially', intermittent: 'Intermittent fault',
};
export const IMPACT = {
  no: 'No patient involved', near_miss: 'Near-miss during use', injury: 'Patient harm occurred',
};
export const RISK = {
  life_support: 'Life support', high: 'High', medium: 'Medium', low: 'Low',
};
export const ACTION = {
  repaired: 'Repaired in place', part_replaced: 'Part replaced', recalibrated: 'Recalibrated',
  cleaned: 'Cleaned / serviced', training: 'User training given', none: 'No repair possible',
};
export const STAGES = ['reported', 'triaged', 'assigned', 'in_progress', 'completed', 'closed'];
export const STAGE_LABEL = {
  reported: 'Reported', triaged: 'Triaged', assigned: 'Assigned',
  in_progress: 'In progress', completed: 'Repair completed', closed: 'Verified and closed',
};
export const STATUS_LABEL = {
  ...STAGE_LABEL, on_hold: 'On hold', vendor: 'With vendor', completed: 'Awaiting sign-off',
};
export const SLA_HOURS = { critical: 0.5, high: 2, medium: 8, low: 24 };
