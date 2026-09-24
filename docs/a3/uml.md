# UML artefacts (final)

All diagrams are drawn from the final code, not from intent. That matters for consistency: the
A2 sequence diagrams showed an AWS cloud service and a database, which the prototype never had.
The A3 set therefore separates:

- **§1–§6 Prototype as built:** a static single-page app on GitHub Pages. User state lives in
  the browser (localStorage), and the only servers are Google Maps Platform and Open-Meteo.
- **§7 Proposed production architecture:** what the City of Hobart would add (a content
  service for Heritage Officers, offline caching, analytics). This is labelled as a
  recommendation.

Requirement IDs → [rtm.md](rtm.md). Rendered SVG/PNG copies → [figures/](figures/).

---

## 1. Use case diagram

Actors are the three personas (primary), plus external systems (secondary). The system
boundary is the web app. Use case IDs map to requirements.

```mermaid
flowchart LR
  subgraph actors [" "]
    direction TB
    V["👤 Visitor<br/>(P1 Minzi)"]
    R["👤 Older resident<br/>(P2 Margaret)"]
    T["👤 Teacher / group leader<br/>(P3 Sam)"]
  end

  subgraph SYS [Hobart Heritage Guide — web app]
    direction TB
    UC1([UC1 Browse & filter sites · FR3 FR4])
    UC2([UC2 View site information & gallery · FR5 FR7])
    UC3([UC3 Plan route: type & stops · FR1 FR11 FR17])
    UC4([UC4 Navigate: map or AR · FR2 FR10])
    UC5([UC5 Print walking map & hand-out · FR12])
    UC6([UC6 Listen to audio tour · FR6 FR9])
    UC7([UC7 Explore landmark in AR / compare past · FR13])
    UC8([UC8 Check walking weather · NFR4])
    UC9([UC9 Adjust language & display · FR14 NFR7])
    UC10([UC10 Arrive at destination · FR15])
    UC11([UC11 Like a site · FR16])
  end

  subgraph EXT [" "]
    direction TB
    G[["Google Maps Platform<br/>Maps JS · Routes API"]]
    O[["Open-Meteo<br/>elevation API"]]
    D[["Device<br/>GPS · camera · speech · print"]]
  end

  V --- UC1 & UC2 & UC3 & UC4 & UC6 & UC7 & UC8 & UC9 & UC11
  R --- UC3 & UC5 & UC6 & UC8 & UC9
  T --- UC1 & UC2 & UC3 & UC5 & UC7 & UC8

  UC4 -. "«include»" .-> UC3
  UC10 -. "«extend» on arrival" .-> UC4
  UC10 -. "«include»" .-> UC6
  UC5 -. "«include»" .-> UC3

  UC3 --- G
  UC3 --- O
  UC4 --- G
  UC4 --- D
  UC6 --- D
  UC7 --- D
  UC5 --- D
```

---

## 2. Domain class diagram

Static data (`src/data`), Pinia stores (user state, persisted where marked «persisted») and the
route model produced by the services.

```mermaid
classDiagram
  direction LR
  class HeritageSite {
    +id: number
    +name: string
    +shortName: string
    +category: Category
    +area: string
    +builtYear: string
    +coordinates: LatLng
    +accessible: boolean
    +baseLikes: number
    +walkMinutes: number
  }
  class GalleryPhoto {
    +image: url
    +caption: string
    +year: string
  }
  class TimeTravel {
    +pastYear: string
    +pastImage: url
    +presentImage: url
    +pastCaption: string
    +presentCaption: string
  }
  class Narration {
    +title: string
    +chapter: number
    +transcript: string[]
  }
  class Waypoint {
    +id: string
    +detourMinutes: number
    +siteId?: number
  }
  class RouteType {
    +key: normal|accessible|steep
    +factor: number
  }
  class WalkingRoute {
    +distanceMeters: number
    +durationSeconds: number
    +path: LatLng[]
    +climbMeters: number
    +maxGrade: number
    +minutes() Naismith
  }
  class RouteStep {
    +instruction: string
    +maneuver: string
    +distanceMeters: number
  }
  class Guidance {
    +kind: none|start|turn|arrive
    +meters: number
    +arrived: boolean
  }
  class TripStore {
    <<persisted>>
    +destinationId: number
    +routeType: string
    +stopIds: string[]
    +voiceGuidance: boolean
    +offlineMap: boolean
    +setRouteType(key)
    +toggleStop(id) added|removed|full
  }
  class LocationStore {
    +status: idle|locating|active|denied|unavailable
    +coords: LatLng
    +origin() LatLng
    +distanceTo(site) km, minutes
  }
  class PlayerStore {
    +siteId: number
    +playing: boolean
    +lineIndex: number
    +voiceStatus: ok|missing|unsupported
    +play() pause() seek()
  }
  class PrefsStore {
    <<persisted>>
    +largeText: boolean
    +highContrast: boolean
  }
  class FavoritesStore {
    <<persisted>>
    +likedIds: number[]
    +likeCount(site)
  }

  HeritageSite "1" *-- "1..*" GalleryPhoto
  HeritageSite "1" *-- "0..1" TimeTravel
  HeritageSite "1" -- "1" Narration : narrated by
  Waypoint "0..1" --> "1" HeritageSite : heritage stop
  TripStore "1" --> "0..1" HeritageSite : destination
  TripStore "1" --> "0..4" Waypoint : stops
  TripStore "1" --> "1" RouteType
  WalkingRoute "1" *-- "1..*" RouteStep
  Guidance ..> WalkingRoute : derived from + position
  LocationStore ..> Guidance : position
  PlayerStore "1" --> "1" Narration : plays
  FavoritesStore ..> HeritageSite : ranks Top 5
```

---

## 3. Sequence diagram: planning the three route options (FR1, NFR3)

`useWalkingRoute` is used by the Map, Navigate, Standard, AR and Print screens. Results are
cached per origin, destination, stops and language, and re-planned only after 50 m of movement.

```mermaid
sequenceDiagram
  autonumber
  actor U as Walker
  participant V as View (Map / Navigate)
  participant W as useWalkingRoute
  participant P as routeOptions.planRouteOptions
  participant G as Google Routes API
  participant E as Open-Meteo elevation
  participant C as chooseOptions (pure)

  U->>V: select destination / change route type
  V->>W: site, trip.routeType, stops
  alt cached for this origin + stops + language
    W-->>V: summaries (normal / accessible / steep)
  else not cached
    W->>P: origin, destination, intermediates
    par fastest + alternatives
      P->>G: computeRoutes(WALK, alternatives)
    and via flat points
      P->>G: computeRoutes(via Franklin Wharf…)
    and via hill points
      P->>G: computeRoutes(via Princes Park…)
    end
    G-->>P: candidate routes (polyline, steps)
    P->>E: sample every candidate path
    E-->>P: elevations → climb, max grade (≥150 m runs)
    P->>C: candidates
    C-->>P: {normal: fastest, accessible: min difficulty ≤1.6×, steep: max difficulty ≤1.9×}
    P-->>W: options (+ Naismith minutes)
    W-->>V: summaries, status = ready
  end
  opt no API key / network error
    W-->>V: status = fallback (straight line, estimated minutes)
  end
  V-->>U: route cards with minutes, climb, max slope
```

---

## 4. Sequence diagram: arrival → audio tour (FR15, FR6, FR9)

```mermaid
sequenceDiagram
  autonumber
  actor U as Walker
  participant N as Standard / AR navigation
  participant L as LocationStore (GPS)
  participant G as lib/guidance.nextGuidance
  participant A as ArrivalSheet
  participant P as PlayerStore
  participant S as services/speech (Web Speech API)

  loop while walking
    L-->>N: coords
    N->>G: route, position
    G-->>N: {kind, meters, arrived}
  end
  alt arrived (< 20 m) or "Simulate arrival"
    N->>A: open (primary = audio on map, AR on camera)
    U->>A: Listen to the audio tour
    A->>P: route /sites/:id/audio → load(siteId)
    U->>P: play
    P->>S: pickVoice(locale speech tags)
    alt voice for language installed
      S-->>P: voice
    else missing
      S-->>P: fallback voice (voiceStatus = missing, notice shown)
    end
    loop each transcript line
      P->>S: speak(line)
      S-->>P: end → next line
    end
  end
```

---

## 5. Activity diagram: navigation with mode switching and arrival (W3, W4)

```mermaid
flowchart TD
  A((●)) --> B[Choose destination]
  B --> C[Choose route type]
  C --> D{Choose mode}
  D -->|Standard map| E[Follow turn-by-turn card]
  D -->|AR| F[Follow arrows over camera]
  D -->|Printable| P[Print or save PDF] --> Z((◉))
  E <-->|switch any time| F
  E --> G{Arrived?}
  F --> G
  G -->|no| H{Moved ≥ 50 m since last plan?}
  H -->|yes| I[Re-plan route] --> G
  H -->|no| G
  G -->|yes| J[Arrival sheet]
  J --> K{Next}
  K -->|Listen| L[Audio tour] --> Z
  K -->|Scan| M[AR camera → compare past] --> Z
  K -->|Details| N[Site page] --> Z
  E -->|Add stop| O[Stop sheet] --> I
```

---

## 6. State machines

**Audio player** (`stores/player.js`)

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Playing: play
  Playing --> Paused: pause (resumes from line start)
  Paused --> Playing: play
  Playing --> Playing: seek (snaps to line start) / next line
  Playing --> Ended: last line finished
  Ended --> Playing: play (restart)
  Idle --> Idle: locale change → reset
  Paused --> Idle: load another site
  note right of Playing: no speech API → same clock runs silently\nvoiceStatus: ok | missing | unsupported
```

**Walking route** (`useWalkingRoute` status)

```mermaid
stateDiagram-v2
  [*] --> idle
  idle --> loading: destination set
  loading --> ready: options chosen
  loading --> fallback: no key / API error
  ready --> loading: moved ≥ 50 m · stops or language changed
  fallback --> loading: retry on change
  ready --> idle: destination cleared
```

---

## 7. Deployment: prototype vs proposed production

```mermaid
flowchart LR
  subgraph Phone [Visitor's phone · browser]
    SPA[Vue 3 SPA<br/>views · stores · i18n]
    LS[(localStorage<br/>prefs · likes · trip · locale)]
    DEV[GPS · camera · Web Speech · print]
    SPA --- LS
    SPA --- DEV
  end
  GH[GitHub Pages<br/>static hosting · CI deploy]
  GM[Google Maps Platform<br/>Maps JS · Routes API]
  OM[Open-Meteo<br/>elevation]
  GH -- HTML/JS/CSS --> SPA
  SPA -- routes · tiles --> GM
  SPA -- elevations --> OM

  subgraph Proposed [Proposed for production — not built]
    CMS[Heritage content service<br/>for Heritage Officers]
    SW[Service worker<br/>offline tiles & content]
    WX[Live weather API]
    AN[Privacy-preserving analytics<br/>success measures]
  end
  SPA -. content .-> CMS
  SPA -. cache .-> SW
  SPA -. forecast .-> WX
  SPA -. events .-> AN
```

- **Why no backend in the prototype:** the case constraints (limited budget, variable
  connectivity) and the Agile MVP scope favoured a static SPA with free browser APIs
  (Web Speech, Geolocation).
- **Production additions:** the dashed services are the recommended next increments.
  - The content service lets Heritage Officers keep information accurate (a case constraint).
  - The service worker makes NFR2 real.
  - Analytics measure the client's success criteria (participation, engagement).
