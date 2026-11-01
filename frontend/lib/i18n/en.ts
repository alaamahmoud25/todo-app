import type { Dictionary } from './ar';

// : Dictionary makes TypeScript fail if any key from the Arabic dictionary is missing
export const en: Dictionary = {
  appTitle: 'My Tasks',
  switchLang: 'العربية',
  loading: 'Loading...',
  serverError: "Can't reach the server, make sure Django is running",
  noTasks: 'No tasks here 🎉',
  noDueDate: 'No due date',
  allCategories: 'All categories',
  allPriorities: 'All priorities',
  overdueBadge: 'Overdue',
  darkMode: 'Dark mode',
  lightMode: 'Light mode',
  search: 'Search tasks...',

  auth: {
    login: 'Log in',
    register: 'Sign up',
    username: 'Username',
    password: 'Password',
    confirmPassword: 'Confirm password',
    submitLogin: 'Log in',
    submitRegister: 'Create account',
    logout: 'Log out',
    welcome: 'Welcome 👋',
    subtitle: 'Organize your day and never miss a task',
    passwordHint: 'At least 8 characters, not only numbers',
    errors: {
      invalid_credentials: 'Wrong username or password',
      username_short: 'Username must be at least 3 characters',
      username_taken: 'That username is taken, pick another one',
      weak_password: 'Weak password: at least 8 characters, not only numbers, and not too common',
      password_mismatch: "Passwords don't match",
      required: 'Enter your username and password',
    },
  },

  nav: {
    tasks: 'Tasks',
    stats: 'Stats',
  },

  summary: {
    today: 'Today',
    overdue: 'Overdue',
    pending: 'Pending',
    doneToday: 'Done today',
  },

  views: {
    all: 'All',
    today: 'Today',
    overdue: 'Overdue',
    upcoming: 'Upcoming',
    done: 'Done',
  },

  priority: {
    high: 'High 🔴',
    medium: 'Medium 🟡',
    low: 'Low 🟢',
  },

  repeat: {
    none: 'Once',
    daily: 'Daily',
    weekly: 'Weekly',
  },

  form: {
    addTask: 'New task',
    editTask: 'Edit task',
    title: 'Title',
    titlePlaceholder: 'e.g. Pay the internet bill',
    description: 'Details',
    descriptionPlaceholder: 'Optional',
    category: 'Category',
    noCategory: 'No category',
    priority: 'Priority',
    dueAt: 'Due (date & time)',
    clearDate: 'Clear date',
    quickInHour: 'In 1 hour',
    quickTonight: 'Tonight 9 PM',
    quickTomorrow: 'Tomorrow 9 AM',
    remind: 'Reminder',
    repeat: 'Repeat',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this task?',
    saving: 'Saving...',
    repeatNeedsDate: 'A repeating task needs a due date',
    titleRequired: 'Title is required',
  },

  remindOptions: {
    none: 'No reminder',
    m0: 'At due time',
    m5: '5 minutes before',
    m15: '15 minutes before',
    m30: '30 minutes before',
    m60: '1 hour before',
    m1440: '1 day before',
  },

  notifications: {
    enable: 'Enable notifications',
    enabled: 'Notifications are on',
    blocked: 'Notifications are blocked in browser settings',
    reminderTitle: '🔔 Reminder',
    dueAt: 'Due',
    dismiss: 'OK',
  },

  stats: {
    title: 'Statistics',
    last7Days: 'Last 7 days',
    done: 'Done',
    due: 'Due',
    byCategory: 'Remaining tasks by category',
    byPriority: 'Remaining tasks by priority',
    completionRate: 'Completion rate',
    completionHint: 'of all tasks you added',
    uncategorized: 'Uncategorized',
    empty: 'Not enough data yet',
  },
};
