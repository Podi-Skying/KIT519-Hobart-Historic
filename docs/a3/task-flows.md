# Task flows (final)

Each flow shows a persona's required workflows on the final prototype.

| Shape | Meaning |
| --- | --- |
| Rounded boxes | Screens (with route) |
| Plain boxes | Actions |
| Diamonds | Decisions |
| Stadiums | Start / end |

Dashed arrows are recovery paths: the "undo / change your mind" routes that Nielsen's
*user control and freedom* heuristic asks for. Every step name matches a real control in the
prototype, so the evaluation task scripts (T1–T9) can follow these flows.

Legend: `W#` = workflow ([personas.md](personas.md)); `FR#`/`NFR#` = requirement ([rtm.md](rtm.md)).

---

## P1 · Minzi: W1 discover → W2 plan → W3 navigate → W4 learn

```mermaid
flowchart TD
  S([Open app]) --> SP(Splash · Tap to start) --> H(Home /home)
  H --> L{UI in Korean?}
  L -- No --> LS(Language & display sheet) --> K[Choose 한국어] --> H
  L -- Yes --> W{Good day to walk?}
  W -- Check --> WE(Weather /weather) --> W
  W -- Yes --> B[Browse Top 5 · filter category · search]
  B --> F{Found an interesting site?}
  F -- No --> B
  F -- Yes --> SD(Site detail /sites/:id)
  SD --> ST[Start walking route]
  ST --> NM(How would you like to navigate? /navigate/:id)
  NM --> RT{Route suits my leg?}
  RT -- No --> ACC[Choose Accessible · check climb & max slope] --> RT
  RT -- Yes --> MO{AR comfortable?}
  MO -- Yes --> AR(AR navigation /navigate/:id/ar)
  MO -- No --> MAP(Standard map /navigate/:id/map)
  AR -. unsure .-> MAP
  MAP -. switch .-> AR
  AR --> ARR{Arrived? within 20 m / Simulate arrival}
  MAP --> ARR
  ARR --> AS(Arrival sheet)
  AS --> AU(Audio tour /sites/:id/audio · Korean voice · transcript)
  AS --> SC(AR camera /ar/:id) --> CP(Compare today with 1844 /ar/:id/compare)
  AU --> E([Learned about the site])
  CP --> E
```

**Changed in A3 (Round 1).**
- **Route type on the mode screen:** `Choose Accessible` now appears on the mode screen
  (R1-6). Before, a walker who started from a site page never saw the route-type choice.
- **Arrival:** the Arrival sheet (R1-2) replaces the AR-only "arrived" card. Standard map
  users used to have no arrival state at all.

---

## P2 · Margaret: W5 reading comfort → W6 gentle walk → W7 paper map (+ W4)

```mermaid
flowchart TD
  S([Open app]) --> H(Home /home)
  H --> R{Can I read it?}
  R -- No --> AA[Tap 🌐 EN · Aa] --> DS(Language & display sheet)
  DS --> LT[Larger text: on] --> HC[High contrast: on] --> H
  R -- Yes --> M(Map tab /map · browse panel)
  M --> ST{Need a rest stop?}
  ST -- Yes --> ADD[Add a stop → Toilets / Coffee] --> N
  ST -- No --> N[Nearest heritage site]
  N --> SEL(Selected destination panel · stop chips)
  SEL --> RT{Gentle enough?}
  RT -- No --> ACC[Accessible · read slope note] --> RT
  RT -- Yes --> GO[Go]
  GO --> NM(How would you like to navigate?)
  NM --> PR(Printable map /navigate/:id/print)
  PR --> P[Print or save as PDF] --> WALK([Walk with paper])
  NM -. prefers phone .-> MAP(Standard map) --> AS(Arrival sheet) --> AU(Listen to the audio tour)
  MAP -. forgot a stop .-> WS[Add stop sheet]
  SEL -. wrong place .-> X[✕ close] --> M
```

**Changed in A3 (Round 1).** The display settings (R1-1) are a new branch; before A3 there was
no way to change text size or contrast. Task T5 measures whether the "Aa" cue is found
without help.

**Open question (H5).** Stops are added from the browse panel *before* choosing a destination,
or from **Add stop** during navigation. The selected-destination panel, where the route time
is shown, can only *remove* stops. T6 and T8 observe whether people look for "add" there.

---

## P3 · Sam: W8 forecast → W9 multi-stop route → W10 hand-out (→ W11)

```mermaid
flowchart TD
  S([Open app on laptop / phone]) --> WE(Weather /weather)
  WE --> D{Which day is dry?}
  D --> WK[Scroll This week · pick a dry day]
  WK --> M(Map tab /map · browse panel)
  M --> ADD[Add a stop → Salamanca, Narryna]
  ADD --> FULL{4 stops already?}
  FULL -- Yes --> TOAST[Toast: up to 4 stops] --> PK
  FULL -- No --> PK[Tap destination marker · Cascade Female Factory]
  PK --> SEL(Selected destination panel · stop chips)
  SEL --> ACC[Route type: Accessible]
  ACC --> T{Total time fits 2 h?}
  T -- No --> RM[Remove a stop chip ✕] --> SEL
  T -- Yes --> GO[Go] --> NM(How would you like to navigate?)
  NM --> PR(Printable map /navigate/:id/print)
  PR --> FACTS[Check At each stop facts · numbered like map pins]
  FACTS --> P[Print or save as PDF] --> E([Hand-out for 24 students])
  E -. classroom .-> SD(Site detail › Through the years) --> CP(AR › Compare today with 1844)
```

**Changed in A3 (Round 1).** The printed page now carries per-stop facts (R1-4), which makes it
usable as a class hand-out without extra research.
