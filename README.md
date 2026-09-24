# Yugantra 2026

**Where tech defines the യുഗം.** This is the website for Yugantra 2026, a tech fest themed *Ancient Eras × Future Technology*.

The site is static and has no dependencies: plain HTML, CSS and JavaScript, plus one WebGL shader. There is no framework and no build step to deploy. The only external request is Google Fonts.

## The rule

Nothing on the page is decoration. Every figure, tick, dot, ring, sound and motion is generated from `assets/js/content.js`. Change an event there and the dial, its symbol, the ribbon, the stats and the headings all update.

## What's on the page

**Tracks as ages.** The four yugas are named after dice throws of 4, 3, 2 and 1, so each track takes an age and its figure:

| Figure | Track | Events |
|---|---|---|
| ◇ | Code | 24-Hour Hackathon, Junior Hackathon |
| △ | Business & Startups | Pitchathon, Business Case Study |
| ⚭ | Culture & Play | AI × Traditional Art, Reels, Band Competition, Gaming, Treasure Hunt |
| ⊙ | Cyber Security | Capture the Flag (with CSAI), Cybercrime Investigation, Password War |
| ⏻ | Learn & Showcase | Masterclass, Student Exhibition |

**The dial is the fest.**
- The rings, from the centre out: the track figure, the tracks, every event (with dots for its day), the schedule on a 60-ghati clock, and the prize wedges.
- The rim is a 72-tooth cam, one tooth per hour of the fest; a tooth is raised when something is on.
- A marker at 12 o'clock holds the live or next event, and the centre shows its track.
- The dial works across the whole page:
  - Pointing at any card, track, schedule row or ribbon bar turns the wheel to it.
  - Hovering over a sector shows a tooltip, and clicking one opens the event.

**Motion, all of it carrying data:**
- **Boot.** The dial assembles ring by ring while a boot log reads the data: tracks, events, schedule, prizes. The Mahayuga counter runs down from 43,20,000 to 2026.
- **Exploded view.** As you leave the hero, the dial tilts into 3D and its rings separate into layers, then reassemble.
- **Time lens.** The same dial as data: event ids, binary indexes, prizes in hex, and the schedule as a Gantt ring.
- **Self-drawing symbols.** Each event symbol draws itself in order: frame (track), ticks (one per hour; a dashed ring means TBA), dots (team size), then the centre pictogram (the challenge).
- **Opening an event.** The symbol flies out of the card, dial sector or schedule row into the details panel, and flies back when you close it.
- **Rolling digits.** The countdown and all the headline numbers roll like a mechanical counter.
- **Ribbon.** The whole fest on one line, with nights compressed so the 24-hour hackathon visibly runs through the night.
- **The Stage.** The Band Competition section turns the page to night. Its wax seals break when clicked.
- **Cursor.** A custom cursor shows the track symbol of whatever you point at.
- **Phone tilt.** On phones, tilting moves the light on the gold and the lens.
- **Sound (optional, off by default).** A tick sounds as each event passes the marker and as each ring locks; seals crack when broken.

**Every track has an ancestor.** Each gets a live demo from history:
- **Code:** Pingala's binary metres.
- **Business:** the Arthashastra, shown as a live break-even chart.
- **Culture & Play:** Chaturanga, shown as a knight's tour.
- **Cyber Security:** Katapayadi, the Kerala number code, 683 CE.

**Sections, in order:** hero (the dial) → the message → origins → tracks as ages → events → the flagship → passes → schedule → the Stage → partners → FAQ → contact → footer. A rail on the right edge (wide screens) shows where you are.

- **The message.** One paragraph built from the data: the event count, the track names, the number of days. It lights word by word as you scroll, then the യുഗം signature draws itself.
- **The flagship.** The 24-Hour Hackathon on a 24-hour clock that starts at 13:30. Nights are shaded (18:00–06:00, the same sunrise convention as the ghatis). Point at the ring to read any hour.
  - Food is parsed from the event's `food` line. There are no invented meal times.
  - The goodies line (ID card, certificate, stickers) is rendered as tiltable cards, marked illustrative.
  - The Pitchathon's CEO Face-off seats come from its `extras` (3 judges, 3 investors), with an 8 + 1 hour bar.
- **Passes.** Four steps to register, a sample pass for any event (point at a row in the fee table), and every event's team, fee, prize pool and slot in one table.
- **Partners.** The three tiers with their slot counts, plus the CSAI association. "Request the deck" opens the contact form with the Partnerships topic selected.
- **Contact.** The form checks the fields and composes an email to `site.email` in the visitor's mail app. If no mail app opens, it offers to copy the message. No data is sent anywhere.

## Structure

```
index.html              markup
assets/css/main.css     styles (palette tokens at the top)
assets/js/content.js    ALL editable content
assets/js/dial.js       WebGL dial: data-driven ring textures + shader
assets/js/main.js       behaviour
scripts/build.py        inlines everything into dist/
dist/yugantra.html      self-contained single file (generated)
```

## Edit content

Everything lives in `assets/js/content.js`. Each event has these fields:

- `name` and `short` (the label on the dial)
- `era` (its track) and `kind`
- `hours` (ticks on its symbol) and `duration` (text shown on the site)
- `team` (`"3"`, `"1–2"`, `"4–5"` or `"TBA"`; this sets the dots)
- `fee`, `prize` and `split`
- `food`, `goodies` and `extras`
- `status: "tbc"` for events not yet confirmed
- `day`/`time` (its slot in the schedule)

Set `site.registerUrl`, or a per-event `registerUrl`, to open registration.

Run `python3 scripts/build.py` to regenerate `dist/`.

## Deploy

The site is a static folder:

- **Vercel / Netlify:** framework "Other", no build command, root as the output directory.
- **GitHub Pages:** deploy from the branch root.

## Launch checklist

**Still placeholders (tagged `PLACEHOLDER` or `TBA` in `content.js`):**
- [ ] Fest dates, venue, contact email, social links and registration URLs
- [ ] The whole schedule (it's provisional; only "the hackathon starts at 13:30 and runs 24 hours" is real), and venues other than Colab
- [ ] Team sizes for the Junior Hackathon, Case Study, Reels, Band Competition, Gaming, CTF and Password War
- [ ] Fees for Reels, CTF and Masterclass; the CTF format and prizes; the Masterclass topic and speaker; the hackathon mentors
- [ ] Gaming and AI × Traditional Art are marked "To be confirmed"; remove `status: "tbc"` once confirmed
- [ ] Wording of the CSAI association (shown on the CTF and in Partners)

**Given in the brief but deliberately not shown publicly** (internal planning notes):
- Volunteer counts
- The AWS Committee arranging food for the Masterclass
- CSAI's requirements for the Masterclass
- The venue committee for the Student Exhibition
- Event-management collaboration for the Treasure Hunt

**Checked facts:**
- Yuga names and durations
- Pingala
- Chaturanga (Gupta era, uncheckered 8×8 board)
- The Arthashastra (1st–3rd century CE)
- Katapayadi (Haridatta, Kerala, 683 CE; the ragas 29 and 65)
- Kollam Era 1202

## Engineering notes

- **Performance.**
  - One full-screen shader, with ring artwork painted once into mipmapped textures.
  - The exploded 3D path only runs while it's visible.
  - Resolution drops automatically when frames are slow, and textures are 1024² on small screens.
- **Accessibility.**
  - Skip link, visible focus, and a real `<dialog>` that closes with Escape.
  - Keyboard tabs in the schedule, plus hidden text behind the rolling digits for screen readers.
  - `prefers-reduced-motion` turns off the boot, drift, explode, custom cursor and symbol drawing.
- **Resilience.**
  - Without WebGL the site falls back to a CSS background, and every section still works.
  - Failsafes clear the boot overlay and the dialog animations if anything stalls.
