/*
 * Yugantra 2026 — site content.
 *
 * Every piece of copy that changes between editions lives here, so the
 * organising team can update the site without touching layout or logic.
 * The dial, symbols, stats, schedule ribbon and headings are all generated
 * from this file.
 *
 * Tags:
 *   PLACEHOLDER  invented for the prototype — confirm before launch
 *   TBA          not decided yet — shown on the site as "To be announced"
 */
window.YUGANTRA = {
  site: {
    name: "Yugantra",
    edition: "2026",
    kind: "Tech fest",
    startsAt: "2026-11-20T09:00:00+05:30",       // PLACEHOLDER — drives the countdown
    endsAt: "2026-11-22T21:00:00+05:30",         // PLACEHOLDER
    dateLabel: "20—22 November 2026",            // PLACEHOLDER
    kollamEra: 1202,                              // Malayalam (Kollam) Era year for Aug 2026 – Jul 2027
    venue: "Main Campus, Kerala",                // PLACEHOLDER
    registerUrl: "",                              // PLACEHOLDER — leave empty to show "Registration opens …"
    registrationOpens: "soon",                    // PLACEHOLDER — e.g. "01 Oct"
    email: "team@yugantra.fest",                  // PLACEHOLDER
    partnerDeckUrl: "",                           // PLACEHOLDER
    scheduleIsProvisional: true,                  // shows a "provisional" note on the schedule
    socials: [                                    // PLACEHOLDER
      { label: "Instagram", url: "#" },
      { label: "LinkedIn", url: "#" },
      { label: "YouTube", url: "#" },
      { label: "X", url: "#" }
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
      text: "Treta is the age when trade and statecraft took shape. Pitch to investors and face a CEO live, or crack a business case against the clock."
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
   *   duration how the duration is written on the site
   *   team     "3" | "1–2" | "4–5" | "TBA"  → dots on its symbol
   *   prize    total prize pool in ₹ (null = TBA); split = 1st/2nd/3rd
   *   status   "tbc" for events not yet confirmed
   *   day/time where it sits in the (provisional) schedule; day 0 = online
   */
  events: [
    // ── Code
    {
      id: "hackathon", short: "Hackathon", era: "krita", kind: "competition", icon: "braces",
      name: "24-Hour Hackathon", format: "24-hour hackathon",
      blurb: "Twenty-four hours, three people, one working build. It starts at 1:30 pm and runs through the night, with every meal on us.",
      hours: 24, duration: "24 hours, from 1:30 pm",
      day: 1, time: "13:30", venue: "Colab",
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
      day: 1, time: "10:00", venue: "TBA",                         // PLACEHOLDER slot
      team: "TBA", teamLabel: "TBA", fee: "₹150 per person",
      prize: 10000, split: [5000, 3000, 2000], goodies: "₹1,000 in goodies",
      food: "Lunch and snacks"
    },

    // ── Business & Startups
    {
      id: "pitchathon", short: "Pitchathon", era: "treta", kind: "competition", icon: "chart",
      name: "Pitchathon", format: "8-hour pitch sprint + CEO Face-off",
      blurb: "Eight hours to build a startup pitch, then a one-hour CEO Face-off, live, in front of three judges and three investors.",
      hours: 9, duration: "8 hours + 1-hour CEO Face-off, live",
      day: 2, time: "09:00", venue: "TBA",                         // PLACEHOLDER slot
      team: "3", teamLabel: "3 per team", fee: "₹350 per person",
      prize: 30000, goodies: "₹1,000 in goodies",
      food: "Lunch and 2 snacks",
      extras: ["Judging panel: 3 judges", "Investing panel: 3 investors"]
    },
    {
      id: "case-study", short: "Case Study", era: "treta", kind: "competition", icon: "briefcase",
      name: "Business Case Study", format: "Case competition",
      blurb: "A real business problem and three to four hours to analyse it, decide, and defend the decision.",
      hours: 4, duration: "3–4 hours",
      day: 2, time: "10:00", venue: "TBA",                         // PLACEHOLDER slot
      team: "TBA", teamLabel: "TBA", fee: "₹150 per person",
      prize: 9000, split: [4000, 3000, 2000], goodies: "₹1,000 in goodies"
    },

    // ── Culture & Play
    {
      id: "art-ai", short: "Art × AI", era: "dvapara", kind: "competition", icon: "kolam", status: "tbc",
      name: "AI × Traditional Art", format: "AI + traditional art fusion",
      blurb: "One piece of work that holds both a traditional art form and generative AI. Solo or as a pair.",
      hours: 3, duration: "2–3 hours",
      day: 2, time: "15:00", venue: "TBA",                         // PLACEHOLDER slot
      team: "1–2", teamLabel: "Solo or pair", fee: "₹100 per person",
      prize: 5000, goodies: "₹1,000 in goodies"
    },
    {
      id: "reels", short: "Reels", era: "dvapara", kind: "competition", icon: "reel",
      name: "Reel Competition", format: "Short-form video",
      blurb: "Short-form video, judged on story and craft.",
      hours: null, duration: "Submission details TBA",
      day: 0, time: "Online", venue: "Online",
      team: "TBA", teamLabel: "TBA", fee: "TBA",
      prize: 5000, split: [3000, 2000]
    },
    {
      id: "band", short: "Bands", era: "dvapara", kind: "competition", icon: "wave",
      name: "Band Competition", format: "Online qualifiers → live finale",
      blurb: "Qualify online, then play live. The winners get a performance slot, and first place gets travel expenses covered.",
      hours: null, duration: "Online qualifiers, then live",
      day: 3, time: "17:00", venue: "TBA",                         // PLACEHOLDER slot for the finale
      team: "TBA", teamLabel: "TBA", fee: "₹599 per team",
      prize: 10000, split: [6000, 4000],
      extras: ["Winners get a live performance opportunity", "First-place winners get travel expenses"]
    },
    {
      id: "gaming", short: "Gaming", era: "dvapara", kind: "competition", icon: "gamepad", status: "tbc",
      name: "Gaming", format: "Esports tournament",
      blurb: "Competitive gaming across a line-up of titles, to be announced.",
      hours: null, duration: "TBA",
      day: 3, time: "10:00", venue: "TBA",                         // PLACEHOLDER slot
      team: "TBA", teamLabel: "Depends on the game", fee: "₹100–200 per person, by game",
      prize: 25000
    },
    {
      id: "treasure-hunt", short: "Treasure Hunt", era: "dvapara", kind: "competition", icon: "map",
      name: "Treasure Hunt", format: "Team hunt",
      blurb: "Two to three hours of clues, in teams of four or five.",
      hours: 3, duration: "2–3 hours",
      day: 1, time: "16:00", venue: "TBA",                         // PLACEHOLDER slot
      team: "4–5", teamLabel: "4–5 per team", fee: "₹100 per person",
      prize: 5000, goodies: "₹1,000 in goodies"
    },

    // ── Cyber Security
    {
      id: "ctf", short: "CTF", era: "kali", kind: "competition", icon: "fort",
      name: "Capture the Flag", format: "CTF with CSAI",
      blurb: "Capture the Flag, run with CSAI, the Cyber Security Association of India. Format and prizes to be announced.",
      hours: null, duration: "TBA",
      day: 2, time: "10:00", venue: "TBA",                         // PLACEHOLDER slot
      team: "TBA", teamLabel: "TBA", fee: "TBA",
      prize: null, partner: "CSAI · Cyber Security Association of India"
    },
    {
      id: "cybercrime", short: "Cybercrime", era: "kali", kind: "competition", icon: "magnifier",
      name: "Cybercrime Investigation", format: "Digital forensics challenge",
      blurb: "Two hours, two investigators, one cybercrime to solve.",
      hours: 2, duration: "2 hours",
      day: 2, time: "14:00", venue: "TBA",                         // PLACEHOLDER slot
      team: "2", teamLabel: "2 per team", fee: "₹150 per team",
      prize: 3000
    },
    {
      id: "password-war", short: "Password War", era: "kali", kind: "competition", icon: "lock",
      name: "Password War", format: "For school students, classes 8–12",
      blurb: "A password battle for school students in classes 8 to 12.",
      hours: null, duration: "TBA",
      day: 1, time: "14:30", venue: "TBA",                         // PLACEHOLDER slot
      team: "TBA", teamLabel: "TBA", fee: "₹50",
      prize: 1000, eligibility: "School students, classes 8–12"
    },

    // ── Learn & Showcase
    {
      id: "masterclass", short: "Masterclass", era: "yugantra", kind: "workshop", icon: "screen",
      name: "Masterclass", format: "Masterclass",
      blurb: "A masterclass session. The topic and speaker will be announced.",
      hours: null, duration: "TBA",
      day: 1, time: "11:00", venue: "TBA",                         // PLACEHOLDER slot
      team: "TBA", teamLabel: "Individual", fee: "TBA",
      prize: null
    },
    {
      id: "exhibition", short: "Exhibition", era: "yugantra", kind: "showcase", icon: "pedestal",
      name: "Student Exhibition", format: "Student project exhibition",
      blurb: "Student projects on show. Details to be announced.",
      hours: null, duration: "TBA",
      day: 1, time: "10:00", venue: "TBA",                         // PLACEHOLDER slot
      team: "TBA", teamLabel: "TBA", fee: "TBA",
      prize: null
    }
  ],

  /* PLACEHOLDER — provisional running order, built around the real
     constraint that the hackathon starts at 13:30 and runs 24 hours.
     [time, title, venue, track, eventId?, hours?] */
  schedule: [
    {
      day: 1, date: "2026-11-20",
      slots: [
        ["09:00", "Inauguration", "Main Stage", "yugantra", null, 1],
        ["10:00", "Student Exhibition opens", "TBA", "yugantra", "exhibition", 7],
        ["10:00", "Junior Hackathon", "TBA", "krita", "junior-hackathon", 6],
        ["11:00", "Masterclass", "TBA", "yugantra", "masterclass", 2],
        ["13:30", "24-Hour Hackathon begins", "Colab", "krita", "hackathon", 24],
        ["14:30", "Password War", "TBA", "kali", "password-war", 2],
        ["16:00", "Treasure Hunt", "TBA", "dvapara", "treasure-hunt", 3]
      ]
    },
    {
      day: 2, date: "2026-11-21",
      slots: [
        ["09:00", "Pitchathon", "TBA", "treta", "pitchathon", 8],
        ["10:00", "Capture the Flag", "TBA", "kali", "ctf", 4],
        ["10:00", "Business Case Study", "TBA", "treta", "case-study", 4],
        ["13:30", "Hackathon demos", "Colab", "krita", "hackathon", 1.5],
        ["14:00", "Cybercrime Investigation", "TBA", "kali", "cybercrime", 2],
        ["15:00", "AI × Traditional Art", "TBA", "dvapara", "art-ai", 3],
        ["17:00", "CEO Face-off, live", "TBA", "treta", "pitchathon", 1]
      ]
    },
    {
      day: 3, date: "2026-11-22",
      slots: [
        ["10:00", "Gaming", "TBA", "dvapara", "gaming", 6],
        ["12:00", "Reel Competition results", "Main Stage", "dvapara", "reels", 1],
        ["17:00", "Band Competition finale", "Main Stage", "dvapara", "band", 2.5],
        ["19:30", "Prize ceremony", "Main Stage", "yugantra", null, 1]
      ]
    }
  ],

  partners: [
    { tier: "Title patron", slots: 1, note: "Name on the fest, the dial and every stage." },
    { tier: "Track partners", slots: 4, note: "Own one track (Code, Business, Culture & Play or Cyber Security) and every event in it." },
    { tier: "Event partners", slots: 6, note: "Back a single event, from the brief to the prize." }
  ],
  associations: [
    { name: "CSAI", full: "Cyber Security Association of India", role: "Capture the Flag" }
  ],

  faq: [
    ["Who can take part?", "Each event lists who it is for. Password War is only for school students in classes 8 to 12."],
    ["How much does it cost?", "Every event has its own fee, shown on the event: from ₹50 for Password War to ₹599 per team for the Band Competition. Some fees are still to be announced."],
    ["Is food provided?", "For the long events, yes. The 24-Hour Hackathon includes lunch, dinner, breakfast and three snacks. The Junior Hackathon includes lunch and snacks, and the Pitchathon includes lunch and two snacks."],
    ["How do I register?", "Open an event and choose Register. Registration links go live when registration opens."],
    ["What is the dial on the home page?", "It is the whole fest on one instrument. From the centre out: the tracks, every event, the days of sessions and the prizes. The marker at the top holds the next event (or the one live now), and the centre shows its track's symbol. Point at anything on the page and the dial turns to it; hover or tap an event on the dial to open it."],
    ["What do the event symbols mean?", "Every symbol reads the same way. The frame is the track: a diamond for Code, a triangle for Business, twin circles for Culture & Play, a point in a circle for Cyber Security and the power sign for Learn & Showcase. The ring has one tick per hour the event runs; a dashed ring means the duration is still to be announced. The dots are the team size, and the centre shows what you will do."],
    ["What do the ghati numbers mean?", "A traditional Indian day has 60 ghatis of 24 minutes each, counted from sunrise. We count from 06:00 IST, so 10:00 is ghati 10."]
  ]
};
