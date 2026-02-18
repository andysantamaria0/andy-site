export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    tab: null,
    message: "Welcome to {tripName}! I'm your concierge — I'll show you around so you feel right at home.",
    audio: null, // Dynamic: fetched from /api/onboarding/welcome-audio
  },
  {
    id: 'overview',
    tab: 'overview',
    message: 'This is your trip overview — dates, destination, and who\'s going at a glance.',
    audio: '/audio/onboarding-overview.mp3',
    spotlight: '.v-overview-grid',
  },
  {
    id: 'calendar',
    tab: 'calendar',
    message: 'The calendar shows your day-by-day plan. Tap any day to see what\'s happening.',
    audio: '/audio/onboarding-calendar.mp3',
    spotlight: '.v-calendar-days',
  },
  {
    id: 'members',
    tab: 'members',
    message: "Here's everyone on the trip — you can see when they're arriving and departing.",
    audio: '/audio/onboarding-members.mp3',
    spotlight: '.v-members-list',
  },
  {
    id: 'concierge',
    tab: null,
    message: "Text or call me anytime to add flights, restaurants, or anything else to the trip.",
    audio: '/audio/onboarding-concierge.mp3',
  },
  {
    id: 'done',
    tab: null,
    message: "You're all set! Enjoy the trip.",
    audio: '/audio/onboarding-done.mp3',
  },
];
