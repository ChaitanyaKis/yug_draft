# Yugantra 2026

**Where tech defines the യുഗം.** This is the website for Yugantra 2026, a tech fest themed *Ancient Eras × Future Technology*.

The site is static and has no dependencies: plain HTML, CSS and JavaScript, plus one WebGL shader. There is no framework and no build step to deploy. The only external request is Google Fonts. Deployed as a folder, it installs as an app and works offline.

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
- **Boot, poured.** The grooves start cut but empty. Molten gold runs into each ring clockwise from 12 o'clock, centre first, with a liquid front, and cools from white-hot through amber to brass. Meanwhile a boot log reads the data (tracks, events, schedule, prizes) and the Mahayuga counter runs down from 43,20,000 to 2026.
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

**Sections, in order:** hero (the dial) → origins → tracks as ages → events → the flagship → passes → schedule → the Stage → partners → FAQ → contact → footer. A rail on the right edge (wide screens) shows where you are.

- **The flagship.** The 24-Hour Hackathon on a 24-hour clock that starts at 13:30. Nights are shaded (18:00–06:00, the same sunrise convention as the ghatis). Point at the ring to read any hour.
  - Food is parsed from the event's `food` line. There are no invented meal times.
  - The goodies line (ID card, certificate, stickers) is rendered as tiltable cards, marked illustrative.
  - The Pitchathon's CEO Face-off seats come from its `extras` (3 judges, 3 investors), with an 8 + 1 hour bar.
- **Passes.** Four steps to register, a sample pass for any event (point at a row in the fee table), and every event's team, fee, prize pool and slot in one table.
- **Partners.** The three tiers with their slot counts, plus the CSAI association. "Request the deck" opens the contact form with the Partnerships topic selected.
- **Contact.** The form checks the fields and composes an email to `site.email` in the visitor's mail app. If no mail app opens, it offers to copy the message. No data is sent anywhere.

**For the visitor:**
- **My Yuga.** Star any event: on its card, in the fee table, or in its details. The star in the nav opens your plan:
  - It lists your events in time order.
  - It flags clashes on the provisional schedule (for example, the 24-hour hackathon against anything on Day 1 afternoon).
  - **Add to calendar** downloads an `.ics` with every session of every picked event.
  - **Make my story card** draws a 1080 × 1920 image: your events lit on the fest wheel, the list, and the dates. Content stays clear of the top and bottom bands that story apps cover. It's marked "My plan · not a ticket". On phones that support it, **Share** sends it straight to Instagram or WhatsApp.
  - Your plan is kept in the browser. Nothing is sent anywhere.
- **The terminal.** Press `/` (or Ctrl/⌘+K, the `>_` button, or Terminal in the menu). It has tab completion, history, and clickable suggestions. Commands:
  - `events [track]`, `tracks`, `open <event>`, `schedule [day]`, `prizes`, `fees`
  - `next`, `time` (IST, ghatis, Kollam Era), `go <section>`, `register`, `contact`
  - `pick <event>`, `mine`, `ics`
  - `play`, `sound on|off`, `binary <text>`, `clear`, `help`
- **Hear the fest.** A button on the schedule plays the whole fest as music in about 20 seconds:
  - Time runs along the ribbon (nights compressed). Every session is a plucked note in raga Mechakalyani (melakarta 65: S R2 G3 M2 P D2 N3). Its track sets the pitch: Code Sa', Business Pa, Culture Ga upward, Cyber Ri, Showcase Sa.
  - A soft drum marks every hour something is on (the rim's cam, made audible), over a synthesised tanpura (Pa–Sa–Sa–Sa, Karplus–Strong).
  - A playhead crosses the ribbon, the sounding sessions light up, the dial turns to each event, its hand follows the time of day, and the caption names the note.
- **Engraved brass.** The dial is lit like relief metal. Normals come from the engraving masks, and the pointer is a lamp held over the plate. On phones the lamp follows the tilt, or slowly orbits.
- **Glow and depth.** Bloom on the gold highlights. In the exploded 3D view there is depth of field: the middle plates stay sharp and the near and far ones soften.
- **The page's light follows the track.** While the tracks are read, a horizon light shifts from Krita's golden dawn through Treta bronze and Dvapara emerald to Kali's burgundy dusk.
- **Night by the fest's clock.** From ghati 30 (18:00 IST) to 06:00 the site turns to night: the plate falls dark and the pointer's lamp becomes the light. Override with `?night=1`, `?night=0` or the terminal's `night` command.
- **Kolam dividers.** Four sikku kolams, each one unbroken line looped around a dot grid. They're generated as mirror curves (mirror layouts are tried until the line closes as a single loop) and draw themselves as you reach them. The dot counts are data:
  - 24 points for the hackathon's hours;
  - 18 for the sessions, in 3 rows for 3 days;
  - 11 for the partner slots;
  - 14 for the events.
- **Foil cards.** Event cards tilt toward the pointer with a gold-foil sheen, and their symbol shifts in parallax.
- **Malayalam numerals.** Sections, the rail and the watermarks are numbered ൧–൧൦. The traditional countdown units (divasa, ghati, pala, vipala) roll in Malayalam digits, and the footer gives the Kollam Era as ൧൨൦൨.
- **Feel.** Wheel scrolling glides while keeping the native scroll position, so sticky elements, anchors and the keyboard behave normally. Section headings rise out of a mask word by word, buttons lean toward the pointer, and nav labels decode from binary.

## Structure

```
index.html              markup
assets/css/main.css     styles (palette tokens at the top)
assets/js/content.js    ALL editable content
assets/js/dial.js       WebGL dial: data-driven ring textures + shader
assets/js/main.js       behaviour
assets/img/             app icons (from the brand mark) and og.jpg share image
manifest.webmanifest    install metadata
sw.js                   offline cache (bump VERSION on every deploy)
scripts/build.py        inlines everything into dist/
dist/yugantra.html      self-contained single file (generated; no app install or offline mode)
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
- Deploy the **folder** (not `dist/yugantra.html`) to get the installable app, offline mode, icons and share image.
- After each deploy, bump `VERSION` in `sw.js` so returning visitors get the new files.

## Launch checklist

**Still placeholders (tagged `PLACEHOLDER` or `TBA` in `content.js`):**
- [ ] Fest dates, venue, contact email, social links and registration URLs
- [ ] The whole schedule (it's provisional; only "the hackathon starts at 13:30 and runs 24 hours" is real), and venues other than Colab
- [ ] Team sizes for the Junior Hackathon, Case Study, Reels, Band Competition, Gaming, CTF and Password War
- [ ] Fees for Reels, CTF and Masterclass; the CTF format and prizes; the Masterclass topic and speaker; the hackathon mentors
- [ ] Gaming and AI × Traditional Art are marked "To be confirmed"; remove `status: "tbc"` once confirmed
- [ ] Wording of the CSAI association (shown on the CTF and in Partners)
- [ ] Set `og:image` in `index.html` to the absolute URL of `assets/img/og.jpg` once the domain is known (some platforms ignore relative URLs). The image was rendered from the hero, so re-render it if the design changes.

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
- Mechakalyani = melakarta 65, scale S R2 G3 M2 P D2 N3; tanpura tuning Pa–Sa–Sa–Sa

## Engineering notes

- **Image quality.**
  - The dial renders at the screen's native pixel density (up to 3×) on WebGL2.
  - Ring artwork is painted at the size the hero dial needs: 4096² on high-density or large screens, 2048² otherwise, 1024² minimum. That keeps at least one texel per device pixel.
  - Textures are sampled with explicit gradients (`textureGrad`), so there are no seams where the rotating bands meet. Type stays sharp in motion and in the 3D view, with 16× anisotropic filtering.
  - Scrolling never lowers the resolution. Only quiet frames (not scrolling, not in the 3D view) are timed. The dial steps down if the GPU can't hold about 33 fps and steps back up when it can.
  - The canvas is sized to the large viewport (`100lvh`), so mobile toolbars sliding in and out don't resize or blur it.
- **Post-processing.** The scene renders to a framebuffer, with the depth-of-field amount in alpha. It's box-downsampled to ½, ¼ and ⅛, Gaussian-blurred at ¼ and ⅛, then composited with bloom. If a framebuffer can't be created, it falls back to direct rendering.
- **Performance.**
  - One full-screen shader, plus the small post passes. Every layout read for a frame happens first, and style writes only happen when a value changes, so scrolling doesn't force extra layouts.
  - The exploded 3D path only runs while it's visible.
- **Accessibility.**
  - Skip link, visible focus, and a real `<dialog>` that closes with Escape.
  - Keyboard tabs in the schedule, plus hidden text behind the rolling digits for screen readers.
  - `prefers-reduced-motion` turns off the boot, drift, explode, custom cursor and symbol drawing.
- **Resilience.**
  - Without WebGL the site falls back to a CSS background, and every section still works.
  - Failsafes clear the boot overlay and the dialog animations if anything stalls.
