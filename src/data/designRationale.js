/**
 * Design rationale for the desktop design notes (portfolio / showcase copy, English).
 * Screens are numbered S1–S11 in the order a visitor meets them. Each note is keyed
 * `screen:requirementId` (the same requirement can be argued differently on two screens);
 * `*:ID` applies to every screen. Evidence cites only real sources: the RTM, A1/A2 findings,
 * Round 1 refinements (docs/a3/evaluation/findings.md) and standards — never participant data
 * that hasn't been collected yet.
 */

export const SCREENS = [
  {
    key: 'splash',
    id: 'S1',
    name: 'Leading Page',
    intent:
      'A full-bleed photograph of Hobart sets the heritage mood before any interface appears. There is one obvious action, and the visitor chooses a language before reading anything else.',
  },
  {
    key: 'home',
    id: 'S2',
    name: 'Home Page',
    intent:
      'Recognition over recall: every site appears as a photograph, the most-liked first, so choosing a place means seeing it rather than already knowing its name.',
  },
  {
    key: 'site',
    id: 'S3',
    name: 'Site Detail',
    intent:
      'One screen answers "is this worth the walk?": key facts first, the story second, and a single primary action that turns interest into a route.',
  },
  {
    key: 'gallery',
    id: 'S4',
    name: 'Photo Gallery',
    intent:
      'Archive photographs are the content, so the chrome steps back: the photo you swipe follows your finger, and every image carries the credit its licence requires.',
  },
  {
    key: 'audio',
    id: 'S5',
    name: 'Audio Tour',
    intent:
      'Designed for listening while walking: large, familiar player controls, and a transcript one tap away for anyone who would rather read or cannot hear.',
  },
  {
    key: 'map',
    id: 'S6',
    name: 'Map',
    intent:
      'Planning happens here: compare routes by effort rather than distance alone, find the nearest site, and add practical stops before setting off.',
  },
  {
    key: 'navigate-map',
    id: 'S7',
    name: 'Standard Navigation',
    intent:
      'A calm, battery-friendly turn-by-turn view. The next instruction stays on top, and changes of plan (route type, stops, switching to AR) are one tap away without leaving the route.',
  },
  {
    key: 'navigate-ar',
    id: 'S8',
    name: 'AR Navigation',
    intent:
      'Heads-up wayfinding: direction arrows lie on the street itself, a Live View–style map dome keeps the overview, and moving is done only with two labelled buttons, so there is one clear way to do it.',
  },
  {
    key: 'navigate-print',
    id: 'S9',
    name: 'Printable Map',
    intent:
      'The walk on paper: works with no signal, suits groups and classes, and leaves room for notes. What is printed matches the numbered pins on the screen.',
  },
  {
    key: 'ar',
    id: 'S10',
    name: 'AR Camera · Through Time',
    intent:
      'Point the camera at a landmark and the past appears in place: a single timeline plays the site from today back to its oldest photograph, without new signage on heritage fabric.',
  },
  {
    key: 'weather',
    id: 'S11',
    name: 'Weather',
    intent:
      'Hobart weather decides whether a walk is pleasant. The page is for reading: conditions now, the best time today and the week ahead, with plain advice.',
  },
]

/** title: short label on the callout · why: one visible sentence · the rest opens on hover. */
export const RATIONALE = {
  // ---- S1 Leading Page
  'splash:NFR7': {
    title: 'Choose your language first',
    why: 'Visitors pick one of five languages before the first screen of content.',
    principle: 'Universal design; user control and freedom (Nielsen H3).',
    evidence: 'RTM NFR7 (A2 FR9 extended for international visitors); persona P1, a non-native English speaker.',
    tradeoff: 'One extra tap at start. The choice can be changed at any time from the 🌐 EN · Aa button.',
  },

  // ---- S2 Home Page
  'home:FR3': {
    title: 'Filter & search',
    why: 'Category chips and search sit right above the list they filter, so their effect is visible at once.',
    principle: 'Gestalt proximity; natural mapping between control and content (Norman, 2013).',
    evidence: 'A1/A2 FR3, "reduce information overload"; design-system layout rule (README §5.4.1).',
    tradeoff: 'With five sites the filter rarely shortens the list much. It is kept because the pattern scales to a full heritage register.',
  },
  'home:FR4': {
    title: 'Top 5 featured sites',
    why: 'A ranked carousel of the most-liked sites gives first-time visitors a starting point.',
    principle: 'Recognition rather than recall (Nielsen H6).',
    evidence: 'A2 pilot strength S1. Open hypothesis H3: the Top 5 may repeat the list of five sites, to be checked in usability task T1.',
    tradeoff: 'Overlap with the full list is accepted until test evidence says otherwise.',
  },
  'home:FR16': {
    title: 'Like a site',
    why: 'A heart with a live count lets visitors endorse a site, and it feeds the Top 5 ranking.',
    principle: 'Immediate feedback; social proof.',
    evidence: 'A2 UML Like_Function; engagement success measure (RTM FR16).',
    tradeoff: 'No account is needed, so likes stay on this device.',
  },
  'home:FR14': {
    title: 'Reading comfort',
    why: 'The 🌐 EN · Aa button puts larger text and high contrast next to the language setting.',
    principle: 'Flexibility; WCAG 2.2 SC 1.4.4 (resize text) and 1.4.11 (non-text contrast).',
    evidence: 'Round 1 R1-1: the RTM review found A1 NFR1 (font size, contrast) had never been built. Critical for persona P2 (71, low vision).',
    tradeoff: 'Larger text scales pages 1.2×. Maps and camera views stay unscaled so they remain usable.',
  },
  'home:NFR7': {
    title: 'Five languages',
    why: 'English, 繁體中文, 日本語, 한국어 and Tiếng Việt cover the interface, narration and transcripts.',
    principle: 'Universal design; match between system and the real world (Nielsen H2).',
    evidence: 'RTM NFR7; international visitors are a core audience in the case study.',
    tradeoff: 'Every new string must exist in all five languages. An automated test blocks release if one is missing.',
  },
  'home:NFR5': {
    title: 'Four-tab navigation',
    why: 'Home, Map, AR and Weather are one tap away from every screen except full-screen navigation.',
    principle: 'Consistency and standards (Nielsen H4); the platform tab-bar convention.',
    evidence: 'A2 NFR5, "simple navigation". Site-map depth check: every persona goal is at most three taps from a tab.',
    tradeoff: 'The bar hides during navigation to give the map and camera the full screen; Back stays in the same place.',
  },

  // ---- S3 Site Detail
  'site:FR5': {
    title: 'Key facts at a glance',
    why: 'Category, area, year and accessibility come before the story, so suitability is clear in seconds.',
    principle: 'Information hierarchy; progressive disclosure.',
    evidence: 'A2 FR5; heritage officers need accurate interpretation. Facts checked against the Tasmanian Heritage Register and site histories.',
    tradeoff: 'The long description sits lower on the page; the facts carry the decision.',
  },
  'site:FR8': {
    title: 'Start walking route',
    why: 'The only filled button on the page turns interest into a route.',
    principle: 'One primary action per screen; the burgundy action colour means "you can do this".',
    evidence: 'A2 FR8, "smooth transition from information to wayfinding"; usability task T2.',
    tradeoff: 'Listen and View in AR are secondary buttons, visible but quieter.',
  },
  'site:FR7': {
    title: 'Through the years',
    why: 'A rail of dated archive photographs invites a closer look at how the place has changed.',
    principle: 'Content first: photographs are the heritage, not decoration.',
    evidence: 'A1 FR4 and A2 FR7: visual archives without new signage on heritage sites.',
    tradeoff: 'Thumbnails load at a small size; the full image loads only in the gallery.',
  },
  'site:FR16': {
    title: 'Like',
    why: 'The same heart as on Home, in the same place on the photo, so it needs no learning.',
    principle: 'Consistency and standards (Nielsen H4).',
    evidence: 'RTM FR16.',
    tradeoff: 'It sits on the photo, so it uses a solid badge to stay legible over any image.',
  },

  // ---- S4 Gallery
  'gallery:FR7': {
    title: 'Swipe through history',
    why: 'Photos follow the finger 1:1 and settle with a spring, and every image shows its author and licence.',
    principle: 'Direct manipulation; interruptible motion (Apple, Designing Fluid Interfaces).',
    evidence: 'A2 FR7; openly licensed Wikimedia Commons and Flickr sources require attribution.',
    tradeoff: 'Images are linked from their source, not re-hosted, so they need a connection.',
  },

  // ---- S5 Audio Tour
  'audio:FR6': {
    title: 'Player built for walking',
    why: 'A large play button and ±15-second skips are easy to hit without looking closely.',
    principle: "Fitts's law; familiar media conventions (Nielsen H4).",
    evidence: 'A1 FR5 and A2 FR6: older adults cannot read long text while walking. Round 1 R1-2 put audio one tap from the arrival sheet.',
    tradeoff: 'Narration never plays by itself (WCAG 1.4.2), so it takes one tap to start.',
  },
  'audio:FR9': {
    title: 'Read the transcript',
    why: 'The narration as text, with the current line highlighted, for reading, quiet places or hearing loss.',
    principle: 'Multiple means of access; WCAG 1.2.1 (audio alternative).',
    evidence: 'A2 FR9; non-native English speakers (persona P1).',
    tradeoff: 'Collapsed by default to keep the player uncluttered.',
  },
  'audio:FR14': {
    title: 'Comfort settings here too',
    why: 'Language and text size are reachable where the reading happens, not only from Home.',
    principle: 'Flexibility and efficiency of use (Nielsen H7).',
    evidence: 'Round 1 R1-1; persona P2.',
    tradeoff: 'The same sheet as on Home, so there is one place to learn.',
  },
  'audio:NFR7': {
    title: 'Narration language',
    why: 'Changing language changes the voice and the transcript together.',
    principle: 'Consistency: one setting, one outcome.',
    evidence: 'RTM NFR7 and FR9.',
    tradeoff: 'The voice is the device speech engine, so quality depends on the phone.',
  },

  // ---- S6 Map
  'map:FR1': {
    title: 'Routes by effort',
    why: 'Normal, Accessible and Steep are compared by time, distance, climb and maximum slope, not distance alone.',
    principle: 'Visibility of system status (Nielsen H1); informed choice.',
    evidence: "A1/A2 FR1: visitors and older adults need to know the real effort. Terrain from elevation data; minutes follow Naismith's rule. Round 1 R1-8 fixed contradictory times while routes load.",
    tradeoff: 'Elevation data is about 90 m resolution, so slopes are measured over at least 150 m.',
  },
  'map:FR17': {
    title: 'Nearest heritage site',
    why: 'One tap sets the closest site as the destination.',
    principle: 'Flexibility and efficiency (Nielsen H7); a shortcut for the most common case.',
    evidence: 'A1 challenge: visitors miss points of interest nearby (RTM FR17).',
    tradeoff: 'Without location permission it measures from a default starting point instead.',
  },
  'map:FR11': {
    title: 'Add a stop',
    why: 'Toilets, cafés, rest stops and other sites can be added before setting off, up to four.',
    principle: 'User control and freedom (Nielsen H3).',
    evidence: 'A2 pilot finding F2: "the route felt fixed". Persona P2 needs rest stops; P3 plans group routes.',
    tradeoff: 'Capped at four stops so the walk stays readable on a phone map.',
  },
  'map:NFR2': {
    title: 'Save map offline',
    why: 'A clear toggle for patchy coverage in older streets.',
    principle: 'Error prevention (Nielsen H5).',
    evidence: 'A1/A2 NFR2: variable connectivity is a case constraint.',
    tradeoff: 'Offline tiles are simulated in this prototype; the printable map (S9) is the real fallback.',
  },
  'map:NFR5': {
    title: 'Same tabs everywhere',
    why: 'The tab bar stays put, so the way back to Home is always in the same place.',
    principle: 'Consistency and standards (Nielsen H4).',
    evidence: 'A2 NFR5.',
    tradeoff: 'The map panel sits above the bar and can be hidden with a button, not only by dragging (WCAG 2.5.7, Round 1 R1-7).',
  },

  // ---- S7 Standard Navigation
  'navigate-map:FR1': {
    title: 'Change route type on the way',
    why: 'The compact route picker stays in the panel, so switching to Accessible never means starting over.',
    principle: 'User control and freedom (Nielsen H3).',
    evidence: 'Round 1 R1-6: the Accessible route was unreachable from a site page (critical).',
    tradeoff: 'The compact picker shows less detail than on the Map, to keep the route in view.',
  },
  'navigate-map:FR10': {
    title: 'Switch to AR',
    why: 'One button moves between map and AR on the same route.',
    principle: 'Flexibility; let people choose the mode that suits the moment.',
    evidence: 'A2 pilot finding F1: "AR felt forced". AR is now an option, never the only way.',
    tradeoff: 'Two navigation views to keep consistent; both share the same route state.',
  },
  'navigate-map:FR11': {
    title: 'Add a stop mid-walk',
    why: 'Stops can be added or removed during the walk, and removing one can be undone.',
    principle: 'Forgiveness: undo instead of confirmation dialogs (Apple, Agency).',
    evidence: 'A2 pilot finding F2; open hypothesis H5 about where people look for "add stop".',
    tradeoff: 'Undo lasts 4.5 seconds, then the change is final.',
  },
  'navigate-map:FR15': {
    title: 'Arrival',
    why: 'Within 20 m of the site an arrival sheet opens with the audio tour one tap away.',
    principle: 'Consistency (Nielsen H4): both navigation views end the same way.',
    evidence: 'A1 FR5 (location-triggered narration); Round 1 R1-2: standard navigation had no arrival state.',
    tradeoff: 'Simulate arrival exists for demonstration, because the prototype is tested indoors.',
  },
  'navigate-map:NFR3': {
    title: 'Real-time without lag',
    why: 'The route updates as you walk without freezing the map.',
    principle: 'Response time limits (Nielsen, 1993).',
    evidence: 'A1/A2 NFR3. Routes re-compute only after 50 m; maps are reused, not rebuilt.',
    tradeoff: 'Waiting for 50 m of movement means a new route can take a few steps to appear.',
  },

  // ---- S8 AR Navigation
  'navigate-ar:FR2': {
    title: 'Arrows on the street',
    why: 'Muted 3D chevrons lie on the ground and turn with the route, light enough to see the street through them.',
    principle: 'Heads-up wayfinding; figure–ground: guidance must not hide the world it guides you through.',
    evidence: 'A1/A2 FR2, hands-free wayfinding. The camera is simulated with Street View imagery in this prototype.',
    tradeoff: 'Moving is buttons-only (Step back / Walk ahead), which is less free than dragging but never ambiguous.',
  },
  'navigate-ar:FR10': {
    title: 'Map, always in view',
    why: 'A Live View–style dome shows the route under the camera, and the map button opens the full map.',
    principle: 'Wayfinding: where am I, where next (overview + detail).',
    evidence: 'A2 pilot finding F1, "AR felt forced"; the map is never more than one tap away.',
    tradeoff: 'The dome takes about a quarter of the screen height.',
  },
  'navigate-ar:FR15': {
    title: 'Simulate arrival',
    why: 'Shows the shared arrival sheet during demos.',
    principle: 'Consistency with S7.',
    evidence: 'Round 1 R1-2.',
    tradeoff: 'A prototype control, tucked into the map corner so it does not compete with the route.',
  },
  'navigate-ar:NFR3': {
    title: 'Smooth at camera speed',
    why: 'Arrows and the map follow the view every frame without re-rendering the page.',
    principle: 'Frame-level smoothness (Apple, Designing Fluid Interfaces).',
    evidence: 'A1/A2 NFR3. Street View and map instances are pooled because they cannot be destroyed.',
    tradeoff: 'More engineering effort for a smoother view on low-end phones.',
  },

  // ---- S9 Printable Map
  'navigate-print:FR12': {
    title: 'A hand-out, not a screenshot',
    why: 'Steps, facts at each numbered stop and lines for notes, laid out for A4.',
    principle: 'Match with the real-world task (Nielsen H2).',
    evidence: 'A2 pilot finding F3 (schools and walking groups). Round 1 R1-4 added facts at each stop.',
    tradeoff: 'A static snapshot: it does not update if the route changes after printing.',
  },
  'navigate-print:NFR2': {
    title: 'Works with no signal',
    why: 'Paper is the offline mode that always works.',
    principle: 'Error prevention; graceful degradation.',
    evidence: 'NFR2: variable connectivity is a case constraint.',
    tradeoff: 'It depends on access to a printer, or on saving as PDF before leaving.',
  },

  // ---- S10 AR Camera
  'ar:FR13': {
    title: 'Past and present, in place',
    why: 'One timeline plays the site from today back to its oldest photograph; drag it to stop at any year.',
    principle: 'Direct manipulation; one control for one idea.',
    evidence: 'A1 FR4 (historic photos as AR overlays); heritage officers want interpretation without new signage.',
    tradeoff: 'Landmark detection is simulated in this prototype.',
  },

  // ---- S11 Weather
  'weather:NFR4': {
    title: 'Is it a good day to walk?',
    why: 'Now, the best time today, the week ahead and plain walking advice, on one calm page.',
    principle: 'Purpose and simplicity: one job done well; recognition over recall (Nielsen H6).',
    evidence: 'A1/A2 NFR4: weather affects the outdoor experience (case challenge). Personas P1 and P3 check conditions before planning.',
    tradeoff: 'No shortcut into a walk from here: planning stays on the Map tab. Weather data is simulated in this prototype.',
  },

  // ---- every screen
  '*:NFR1': {
    title: 'Accessible by default',
    why: 'WCAG 2.2 AA contrast, 44 pt touch targets, labelled icons, and reduced-motion and high-contrast support.',
    principle: 'Universal design; WCAG 2.2 AA.',
    evidence: 'Round 1 R1-5: automated axe scan went from 3 app-owned failures to 0. A manual screen-reader test is still pending.',
    tradeoff: 'Some expressive motion is replaced by cross-fades when the system asks for less motion.',
  },
  '*:NFR6': {
    title: 'Clear hierarchy',
    why: 'One action colour, a type scale and consistent spacing make the most important thing the most obvious.',
    principle: 'Visual hierarchy; aesthetic and minimalist design (Nielsen H8).',
    evidence: 'A2 NFR6; one design-token source for every screen.',
    tradeoff: 'Strict tokens limit one-off styling, which is intentional.',
  },
}
