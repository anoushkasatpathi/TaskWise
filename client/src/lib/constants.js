export const CALENDAR_COLORS = [
  { value: '#8E93D9', name: 'Periwinkle' },
  { value: '#A774FF', name: 'Violet' },
  { value: '#3D7BFF', name: 'Electric blue' },
  { value: '#5FC9B0', name: 'Teal' },
  { value: '#F2C94C', name: 'Sunshine' },
  { value: '#F27BA8', name: 'Rose' },
  { value: '#F2994A', name: 'Apricot' },
  { value: '#7C8495', name: 'Slate' },
];

export const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export const RECURRENCES = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
];

export const CATEGORY_SUGGESTIONS = ['Work', 'Personal', 'Study', 'Health', 'Errands', 'Home', 'Events'];

export const REMINDER_LEADS = [5, 15, 30, 60, 180, 1440];

export const VIEWS = [
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
  { value: 'day', label: 'Day' },
  { value: 'list', label: 'List' },
];

// Order matters: it decides which way screens slide.
export const TABS = [
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'public', label: 'Public', icon: 'globe' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];
