export const SECTIONS = [
  {
    id: 'vision',
    number: 'I',
    title: 'Vision & Product',
    intro: "Let\u2019s start with the big picture. I want to understand your dream for Stand \u2014 in your words.",
    questions: [
      { id: 'elevator_pitch', label: 'What is the one sentence you\u2019d use to describe Stand to a parent?', type: 'textarea', placeholder: 'Stand is...' },
      { id: 'success_6mo', label: 'What does success look like 6 months from now?', type: 'textarea' },
      { id: 'success_12mo', label: 'And 12 months from now?', type: 'textarea' },
      { id: 'primary_user', label: 'Who is the primary user?', type: 'radio', options: ['The parent', 'The kid', 'Both equally'] },
      { id: 'age_range', label: 'What age range are you targeting?', type: 'text', placeholder: 'e.g., 8\u201314' },
      { id: 'first_win', label: 'What does a kid\u2019s \u201cfirst win\u201d look like in the app?', hint: 'The moment they feel like an entrepreneur.', type: 'textarea' },
    ],
  },
  {
    id: 'current',
    number: 'II',
    title: 'Where Things Are Today',
    intro: 'Help me understand where things stand right now. No wrong answers \u2014 just a snapshot.',
    questions: [
      { id: 'built_today', label: 'What do you have built today?', hint: 'Prototype, designs, branding assets, pitch deck, etc.', type: 'textarea' },
      { id: 'technical_decisions', label: 'Are there any technical decisions already made?', hint: 'Platform, framework, hosting, database, etc.', type: 'textarea' },
      { id: 'working_not_working', label: 'What\u2019s working well in the current prototype? What isn\u2019t?', type: 'textarea' },
    ],
  },
  {
    id: 'business',
    number: 'III',
    title: 'Business & Compliance',
    intro: 'A few questions about the business side. These help me design with the right constraints from day one.',
    questions: [
      { id: 'revenue_model', label: 'Are you planning to charge parents, kids, or both? What\u2019s the revenue model?', type: 'textarea' },
      { id: 'real_money', label: 'For the pilot, will kids be handling real money? Or will transactions be simulated at first?', type: 'textarea' },
    ],
  },
  {
    id: 'design',
    number: 'IV',
    title: 'Design & Brand',
    intro: 'This is where it gets fun. I want to build something you\u2019re genuinely proud to show people.',
    questions: [
      { id: 'personality_words', label: 'How would you describe Stand\u2019s personality in 3 words?', type: 'text', placeholder: 'e.g., bold, playful, empowering' },
      { id: 'design_admire', label: 'Are there apps or products you admire for their design?', hint: 'Doesn\u2019t have to be in education.', type: 'textarea' },
      { id: 'brand_guidelines', label: 'Do you have brand guidelines, a style guide, or a mood board?', hint: 'If so, share a link or describe what exists.', type: 'textarea' },
      { id: 'mobile_desktop', label: 'How important is mobile vs desktop for your users?', type: 'radio', options: ['Mobile-first', 'Desktop-first', 'Equal priority'] },
    ],
  },
  {
    id: 'rhythm',
    number: 'V',
    title: 'Working Together',
    intro: 'Last one. Let\u2019s figure out how we work best together.',
    questions: [
      { id: 'timeline', label: 'What\u2019s your ideal timeline for having something live that users can touch?', type: 'textarea' },
    ],
  },
];

export const INITIAL_FORM_DATA = {
  // Pre-filled from our calls — Lauren can refine or rewrite any of these
  elevator_pitch: 'Stand is an operating system where kids can build actual businesses \u2014 like an old-school lemonade stand, modernized for today\'s kids and today\'s age. Schools teach theory, but kids are creative and want a sense of purpose and doing.',
  success_6mo: 'Test with 100+ families through a closed pilot by mid-March. Gather live feedback on onboarding, product marketplace, and business types. Then launch the MVP to a few hundred founding Stand CEOs in LA for the summer.',
  success_12mo: 'Prove product-market fit. Reach first 1,000 customers. Seasonal product drops, partnerships, and a community that makes kids want to keep coming back \u2014 not just a one-time thing.',
  primary_user: 'Both equally',
  age_range: '8-15 (two cohorts: 8-11 younger, 12-15 older)',
  first_win: 'Seeing their brand come to life visually \u2014 the business card, the storefront preview, their name on products. The moment they realize "wow, I can actually do this." It needs to feel like magic, not like filling out a form.',
  built_today: 'Functional prototype built by Chris on Claude Code \u2014 Next.js/React on Supabase, deployed on Vercel. Has onboarding flow (interests \u2192 business idea \u2192 brand creation \u2192 parent approval via QR/email). Voice input was attempted. Some Figma work from Dennis on brand evolution. Original Stand brand/logo exists. Summer beta tested physical elements.',
  technical_decisions: 'React for web (eventual React Native for app store). Supabase for backend. Vercel for deployment. COPPA compliance baked in from the start. Printify integration for product fulfillment. Stripe for parent payment processing.',
  working_not_working: 'What\'s working: The basic flow logic (interests \u2192 narrow \u2192 product \u2192 brand \u2192 pitch \u2192 launch). QR code for parent approval. The physical beta validated demand.\n\nWhat\'s not working: Looks "vibe coded" \u2014 not branded or polished. Category selection is overwhelming (too many options). The reveal moment doesn\'t deliver excitement. Missing the magic/animation kids expect. Onboarding feels too long. Logo AI generation has quality/spelling issues. Design from Dennis feels AI-generated, missing soul.',
  revenue_model: '',
  real_money: '',
  personality_words: 'Nostalgic, elevated, cool',
  design_admire: 'Uncommon (unc.mn) \u2014 simplicity, clarity, Apple-esque. Tin Can (tincan.kids) \u2014 nostalgia modernized beautifully. Double Good \u2014 gamification, leaderboards, pop-up selling concept. Girl Scouts as a structural inspiration. Gaming aesthetics married with soul. Wes Anderson, 80s vibes, vintage tennis posters, badges made cool again, streetwear/hype.',
  brand_guidelines: 'Original Stand brand (logo + elements) being evolved. Dennis working in Figma on new colors, fonts, icons \u2014 but current direction feels too AI-generated/Canva-like, missing soul. Mood board exists: Wes Anderson, 80s, vintage badges, old tennis posters. Pinterest board. Need a proper illustrator for custom icons.',
  mobile_desktop: 'Mobile-first',
  timeline: '',
};
