/**
 * Default Shift Configuration
 * This is a global default shift that applies to all organizations
 * when a user doesn't have a custom shift assigned.
 * 
 * This shift cannot be modified, deleted, or updated.
 */
export const DEFAULT_SHIFT = {
  name: 'Default',
  startTime: '09:00', // 9:00 AM
  endTime: '17:00', // 5:00 PM
  lateTime: '09:30', // 9:30 AM
  days: [0, 1, 1, 1, 1, 1, 0], // [Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday]
  // 0 = off day, 1 = working day
  isDefault: true,
  organizationId: null, // Global shift, not tied to any organization
};

