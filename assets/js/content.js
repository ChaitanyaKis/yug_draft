/*
 * Yugantra 2026 — site content.
 *
 * Every piece of copy that changes between editions lives here, so the
 * organising team can update the site without touching layout or logic.
 * The dial, symbols, stats, schedule and headings are all generated from it.
 *
 * Anything left empty ("" or null) is shown on the site as "to be announced",
 * and the features that need it switch on by themselves once it is filled in:
 *   startsAt + endsAt  → the countdown
 *   schedule           → the day-by-day schedule, the ribbon, "Hear the fest",
 *                        clash warnings and calendar export in My Yuga
 *   email              → the contact form and every "write to us" link
 * After any change: bump VERSION in sw.js and redeploy.
 */
window.YUGANTRA = {
  site: {
    name: "Yugantra",
    edition: "2026",
    kind: "Tech fest",
    startsAt: "",            // first session, IST, e.g. "2026-11-20T09:00:00+05:30"
    endsAt: "",              // last session ends, e.g. "2026-11-22T21:00:00+05:30"
    dateLabel: "",           // as printed on the site, e.g. "20–22 November 2026"
    kollamEra: 1202,         // Malayalam (Kollam) Era year for Aug 2026 – Aug 2027
    venue: "",               // e.g. "XYZ College of Engineering, Kochi"
    registerUrl: "",         // registration link; empty shows "Registration opens soon"
    registrationOpens: "soon",
    email: "",               // contact inbox, e.g. "yugantra@college.edu"
    partnerDeckUrl: "",      // optional link to a sponsorship deck
    scheduleIsProvisional: false, // true adds a "provisional" note to every time shown
    socials: [               // add a url to show a link; "" hides it
      { label: "Instagram", url: "" },
      { label: "LinkedIn", url: "" },
      { label: "YouTube", url: "" },
      { label: "X", url: "" }
    ]
  },

  /* Tracks. Each takes an age; the ages are named after dice throws
     (4, 3, 2, 1), which gives every track its figure. */
  ages: [
    {
      id: "krita", count: "4", name: "Krita", alt: "Krita Yuga", ml: "കൃതയുഗം", track: "CODE", slug: "code",
      years: 1728000, domain: "Code",
      text: "Krita is the age of truth, when every statement can be checked. Here that means code that compiles and demos that work: a 24-hour hackathon, and a six-hour one."
    },
    {
      id: "treta", count: "3", name: "Treta", alt: "Treta Yuga", ml: "ത്രേതായുഗം", track: "BUSINESS", slug: "business",
      years: 1296000, domain: "Business & Startups",
      text: "Treta is the age when trade and statecraft took shape. Pitch to three judges and three investors in a live CEO Face-off, or crack a business case against the clock."
    },
    {
      id: "dvapara", count: "2", name: "Dvapara", alt: "Dvapara Yuga", ml: "ദ്വാപരയുഗം", track: "CULTURE & PLAY", slug: "culture",
      years: 864000, domain: "Culture & Play",
      text: "Dvapara is the age of two sides, and every event here has two: traditional art and AI, sound and stage, strategy and play."
    },
    {
      id: "kali", count: "1", name: "Kali", alt: "Kali Yuga", ml: "കലിയുഗം", track: "CYBER SECURITY", slug: "cyber",
      years: 432000, domain: "Cyber Security",
      text: "Kali is the shortest age, and the age of the machine. Capture the flag with CSAI, investigate a cybercrime, or, for school students, win the Password War."
    },
    {
      id: "yugantra", count: "0|1", name: "Yugantra", alt: "The next count", ml: "യുഗാന്ത്ര", track: "SHOWCASE", slug: "learn",
      years: 0, domain: "Learn & Showcase",
      text: "The count ran 4, 3, 2, 1, and the next one starts in binary: a masterclass, and a student exhibition of what is already being built."
    }
  ],

  /*
   * Events.
   *   kind     competition | workshop | showcase
   *   short    label on the dial
   *   hours    how long it runs (one tick per hour on its symbol); null = TBA
   *   duration how the duration is written on the site (durationShort: on cards)
   *   team     "3" | "1–2" | "4–5" | "TBA"  → dots on its symbol
   *   prize    total prize pool in ₹ (null = TBA); split = 1st/2nd/3rd
   *   status   "tbc" for optional events, shown as "To be confirmed"
   *   day      fest day (1, 2, 3 …), 0 = online, null = not announced
   *   time     start time "HH:MM" in IST, null = not announced
   *   venue    room or hall, "TBA" = not announced
   */
  events: [
    // ── Code
    {
      id: "hackathon", short: "Hackathon", era: "krita", kind: "competition", icon: "braces",
      name: "24-Hour Hackathon", format: "24-hour hackathon",
      blurb: "Twenty-four hours, three people, one working build. It starts at 1:30 pm and runs through the night, with lunch, dinner, breakfast and three snacks included.",
      hours: 24, duration: "24 hours, from 1:30 pm",
      day: null, time: "13:30", venue: "Colab",
      team: "3", teamLabel: "3 per team", fee: "₹350 per person",
      prize: 30000, goodies: "₹3,000 in goodies: ID card, certificate and stickers",
      food: "Lunch, dinner, breakfast and 3 snacks",
      extras: ["Mentors: to be announced"]
    },
    {
      id: "junior-hackathon", short: "Jr Hackathon", era: "krita", kind: "competition", icon: "code-tag",
      name: "Junior Hackathon", format: "6-hour hackathon",
      blurb: "The same idea, compressed: six hours from blank screen to demo.",
      hours: 6, duration: "6 hours",
      day: null, time: null, venue: "TBA",
      team: "TBA", teamLabel: "TBA", fee: "₹150 per person",
      prize: 10000, split: [5000, 3000, 2000], goodies: "₹1,000 in goodies",
      food: "Lunch and snacks"
    },

    // ── Business & Startups
    {
      id: "pitchathon", short: "Pitchathon", era: "treta", kind: "competition", icon: "chart",
      name: "Pitchathon", format: "8-hour pitch sprint + CEO Face-off",
      blurb: "Eight hours to build a startup pitch, then a one-hour CEO Face-off, live, in front of three judges and three investors.",
      hours: 9, duration: "8 hours + 1-hour CEO Face-off, live", durationShort: "8 + 1 hours",
      day: null, time: null, venue: "TBA",
      team: "3", teamLabel: "3 per team", fee: "₹350 per person",
      prize: 30000, goodies: "₹1,000 in goodies",
      food: "Lunch and 2 snacks",
      extras: ["Judging panel: 3 judges", "Investing panel: 3 investors"]
    },
    {
      id: "case-study", short: "Case Study", era: "treta", kind: "competition", icon: "briefcase",
      name: "Business Case Study", format: "Case competition",
      blurb: "One business case, three to four hours, and a decision to make.",
      hours: 4, duration: "3–4 hours",
      day: null, time: null, venue: "TBA",
      team: "TBA", teamLabel: "TBA", fee: "₹150 per person",
      prize: 9000, split: [4000, 3000, 2000], goodies: "₹1,000 in goodies"
    },

    // ── Culture & Play
    {
      id: "art-ai", short: "Art × AI", era: "dvapara", kind: "competition", icon: "kolam", status: "tbc",
      name: "AI × Traditional Art", format: "AI + traditional art fusion",
      blurb: "A fusion of AI and traditional art, made in two to three hours. Enter solo or as a pair.",
      hours: 3, duration: "2–3 hours",
      day: null, time: null, venue: "TBA",
      team: "1–2", teamLabel: "Solo or pair", fee: "₹100 per person",
      prize: 5000, goodies: "₹1,000 in goodies"
    },
    {
      id: "reels", short: "Reels", era: "dvapara", kind: "competition", icon: "reel",
      name: "Reel Competition", format: "Short-form video",
      blurb: "Short-form video. Submission details will be announced.",
      hours: null, duration: "Submission details TBA",
      day: null, time: null, venue: "TBA",
      team: "TBA", teamLabel: "TBA", fee: "TBA",
      prize: 5000, split: [3000, 2000]
    },
    {
      id: "band", short: "Bands", era: "dvapara", kind: "competition", icon: "wave",
      name: "Band Competition", format: "Online qualifiers → live finale",
      blurb: "Qualify online, then play live. The winners get a performance slot, and first place gets travel expenses covered.",
      hours: null, duration: "Online qualifiers, then live", durationShort: "2 rounds",
      day: null, time: null, venue: "TBA",
      team: "TBA", teamLabel: "TBA", fee: "₹599 per team",
      prize: 10000, split: [6000, 4000],
      extras: ["Winners get a live performance opportunity", "First-place winners get travel expenses"]
    },
    {
      id: "gaming", short: "Gaming", era: "dvapara", kind: "competition", icon: "gamepad", status: "tbc",
      name: "Gaming", format: "Gaming tournament",
      blurb: "Competitive gaming across a line-up of titles, to be announced.",
      hours: null, duration: "TBA",
      day: null, time: null, venue: "TBA",
      team: "TBA", teamLabel: "Depends on the game", fee: "₹100–200 per person, by game",
      prize: 25000
    },
    {
      id: "treasure-hunt", short: "Treasure Hunt", era: "dvapara", kind: "competition", icon: "map",
      name: "Treasure Hunt", format: "Team hunt",
      blurb: "Two to three hours of clues, in teams of four or five.",
      hours: 3, duration: "2–3 hours",
      day: null, time: null, venue: "TBA",
      team: "4–5", teamLabel: "4–5 per team", fee: "₹100 per person",
      prize: 5000, goodies: "₹1,000 in goodies"
    },

    // ── Cyber Security
    {
      id: "ctf", short: "CTF", era: "kali", kind: "competition", icon: "fort",
      name: "Capture the Flag", format: "CTF with CSAI",
      blurb: "Capture the Flag, run with CSAI, the Cyber Security Association of India. Format and prizes to be announced.",
      hours: null, duration: "TBA",
      day: null, time: null, venue: "TBA",
      team: "TBA", teamLabel: "TBA", fee: "TBA",
      prize: null, partner: "CSAI · Cyber Security Association of India"
    },
    {
      id: "cybercrime", short: "Cybercrime", era: "kali", kind: "competition", icon: "magnifier",
      name: "Cybercrime Investigation", format: "Investigation challenge",
      blurb: "Two hours, two investigators, one cybercrime to solve.",
      hours: 2, duration: "2 hours",
      day: null, time: null, venue: "TBA",
      team: "2", teamLabel: "2 per team", fee: "₹150 per team",
      prize: 3000
    },
    {
      id: "password-war", short: "Password War", era: "kali", kind: "competition", icon: "lock",
      name: "Password War", format: "For school students, classes 8–12",
      blurb: "A password battle for school students in classes 8 to 12.",
      hours: null, duration: "TBA",
      day: null, time: null, venue: "TBA",
      team: "TBA", teamLabel: "TBA", fee: "₹50",
      prize: 1000, eligibility: "School students, classes 8–12"
    },

    // ── Learn & Showcase
    {
      id: "masterclass", short: "Masterclass", era: "yugantra", kind: "workshop", icon: "screen",
      name: "Masterclass", format: "Masterclass",
      blurb: "A masterclass session. The topic and speaker will be announced.",
      hours: null, duration: "TBA",
      day: null, time: null, venue: "TBA",
      team: "TBA", teamLabel: "Individual", fee: "TBA",
      prize: null
    },
    {
      id: "exhibition", short: "Exhibition", era: "yugantra", kind: "showcase", icon: "pedestal",
      name: "Student Exhibition", format: "Student project exhibition",
      blurb: "Student projects on show. Details to be announced.",
      hours: null, duration: "TBA",
      day: null, time: null, venue: "TBA",
      team: "TBA", teamLabel: "TBA", fee: "TBA",
      prize: null
    }
  ],

  /* The running order, once it is announced. Leave empty until then.
     One entry per fest day; each slot is [time, title, venue, track, eventId?, hours?]:
       { day: 1, date: "2026-11-20", slots: [
           ["09:00", "Inauguration", "Main Stage", "yugantra", null, 1],
           ["13:30", "24-Hour Hackathon begins", "Colab", "krita", "hackathon", 24]
       ] }
     Also set each event's day and time above to match. */
  schedule: [],

  /* Sponsorship tiers: add { tier, slots, note } entries once they are decided. */
  partners: [],
  associations: [
    { name: "CSAI", full: "Cyber Security Association of India", role: "Capture the Flag" }
  ],

  faq: [
    ["Who can take part?", "Each event lists who it is for. Password War is only for school students in classes 8 to 12."],
    ["How much does it cost?", "Every event has its own fee, shown on the event: from ₹50 for Password War to ₹599 per team for the Band Competition. Some fees are still to be announced."],
    ["Is food provided?", "For the long events, yes. The 24-Hour Hackathon includes lunch, dinner, breakfast and three snacks. The Junior Hackathon includes lunch and snacks, and the Pitchathon includes lunch and two snacks."],
    ["How do I register?", "Open an event and choose Register. Registration links go live when registration opens."],
    ["What is the dial on the home page?", "It is the whole fest on one instrument. From the centre out: the tracks, every event, the days of sessions and the prizes. The marker at the top holds the next event (or the one live now), and the centre shows its track's symbol. Point at anything on the page and the dial turns to it; hover or tap an event on the dial to open it."],
    ["What do the ghati numbers mean?", "A traditional Indian day has 60 ghatis of 24 minutes each, counted from sunrise. We count from 06:00 IST, so 10:00 is ghati 10."]
  ]
};
