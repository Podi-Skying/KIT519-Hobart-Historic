# Hobart Heritage Guide

以 AR 探索 Hobart（nipaluna）歷史建築的步行導覽 App 原型。
Vue 3 + Vite 單頁應用，採模組化架構，方便後續迭代與交接。

- **Leading page** → 點 *Tap to start* 進入 Home
- **5 種語言**：English／繁體中文／日本語／한국어／Tiếng Việt，介面、景點內容、語音導覽、Google 路線指示全部跟著切換
- **顯示設定**：「語言與顯示」面板可開啟放大文字、高對比（年長者／低視力）
- **Home**：Top 5 輪播、景點清單（可收合搜尋＋分類篩選）、按讚、語言切換
- **景點詳情**：資訊、步行路線、語音導覽、歷年相簿
- **Map**：Google Maps 顯示各景點實際座標與使用者即時定位；路線類型（一般／無障礙／陡坡）、最多 4 個停靠點
- **導航**：標準地圖／AR 導航／可列印地圖（含各站重點，可當團體講義）；抵達時自動跳出面板，一鍵收聽語音導覽或用 AR 掃描
- **語音導覽**：以裝置內建語音（Web Speech API，免費、免金鑰）朗讀所選語言的導覽稿
- **AR**：依景點顯示相機畫面與資訊（辨識到的地標名稱顯示在頂部狀態列；「不是這棟建築？」改放在右上角說明裡，可切換地標）；每個景點都有「穿越時光」時間軸：該景點所有照片（今日、相簿、檔案照片）由新到舊排列，全螢幕淡入淡出切換，附年份、說明與縮圖時間軸（`lib/sites.js` `siteTimeline`）
- **Weather**：步行天氣（含目前天氣圖示）、最佳步行時段、一週預報；一鍵「規劃無障礙步行」。原型以模擬資料每 10 秒切換一次目前天氣，頁面與 tab bar 的天氣圖示會跟著淡入淡出（`stores/weather.js`）

> **KIT519 Assignment 3 設計與評估文件**：[`docs/a3/`](docs/a3/README.md)（personas、user journeys、task flows、site map、RTM、UML、評估計畫與工具、證據與發現）

---

## 目錄

1. [快速開始](#1-快速開始)
2. [技術架構](#2-技術架構)
3. [專案結構](#3-專案結構)
4. [開發規範](#4-開發規範)
5. [UI 設計規範（Design System）](#5-ui-設計規範design-system)
6. [測試](#6-測試)
7. [建置與部署](#7-建置與部署)
8. [素材與授權](#8-素材與授權)

---

## 1. 快速開始

專案內附一份 Node.js LTS（`.tools/node/`，不影響系統）。若電腦已安裝 Node.js ≥ 20 也可直接使用。

```bash
# 開發伺服器（自動使用 .tools 內的 Node；第一次會自動 npm install）
./scripts/dev.sh
# → http://localhost:5173
```

使用系統 Node 或手動執行時：

```bash
export PATH="$PWD/.tools/node/bin:$PATH"   # 只有使用內附 Node 時需要
npm install
npm run dev        # 開發模式（HMR）
npm run build      # 產出 dist/
npm run preview    # 預覽 dist/
npm test           # 單元測試（Vitest）
```

---

### Google Maps 設定

Map 頁使用 Google Maps JavaScript API。**沒有設定 key 時會自動改用插畫版地圖**，其他功能不受影響。

1. 到 [Google Cloud Console](https://console.cloud.google.com/) 建立專案，啟用 **Maps JavaScript API** 與 **Routes API**（步行路線規劃；需綁定帳單，每月有免費額度）。
2. 在 **Credentials** 建立 API key，並設定 **Application restrictions → Websites**：
   - `http://localhost:5173/*`
   - `https://podi-skying.github.io/*`
   若有設定 **API restrictions**，需同時勾選 Maps JavaScript API 與 Routes API。
   （Maps JS 的 key 會出現在網頁原始碼中，這是正常設計；靠網域限制防止他人盜用。）
3. 本機：複製 `.env.example` 成 `.env.local`，填入 `VITE_GOOGLE_MAPS_API_KEY`。`.env.local` 不會被 git 追蹤。
4. 線上版：GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**，新增 `GOOGLE_MAPS_API_KEY`。下次部署時自動套用。
5. （選用）在 **Map Management** 建立 Map ID 並套用米色地圖樣式，填入 `VITE_GOOGLE_MAPS_MAP_ID` / secret `GOOGLE_MAPS_MAP_ID`；未設定時使用 Google 預設樣式。

**三種路線（Normal / Accessible / Steep）**：Google 的步行模式沒有「平緩」或「爬坡」選項，因此 `services/routeOptions.js` 會：
1. 取得 Google 最快路線與替代路線；
2. 另外強制經過低地的海濱／溪谷途經點（Franklin Wharf、Parliament House Gardens、Hobart Rivulet Park）與坡頂公園（Princes Park、Arthur Circus），只保留繞路 ≤ 60% 的候選；
3. 用 **Open-Meteo Elevation API**（免費、免金鑰）量測每條候選的總爬升與最大坡度；
4. Normal = 最快；Accessible = 坡度最緩、爬升最少（時間 ≤ 1.6 倍）；Steep = 爬升最多（時間 ≤ 1.9 倍）。
步行時間依 Naismith 法則每爬升 10 m 加 1 分鐘。畫面會顯示每種路線的說明與實測「↑ 爬升 · 最大坡度 · 經由」。

**步行路線**：所有地圖畫面（Map、標準導航、AR 導航小地圖、可列印地圖）都用 Google Routes API（`travelMode: WALK`）規劃沿實際道路的路線，並依即時位置顯示下一個轉彎與距離。
- 使用者加入的景點停靠點（Salamanca、St George's、Narryna）會成為真正的途經點；廁所、咖啡、圖書館等不改變路線，但會以圖示標在路線上（原型沒有設施資料，位置沿路線穩定地隨機產生，見 `lib/geo.js` `placeAlongPath`）。
- Routes API 未啟用或請求失敗時，改以虛線直線顯示並標示「straight-line estimate」，頁面照常運作。
- 同一路線會快取；使用者移動超過 50 m 才重新規劃，以節省 API 用量。

**定位**：Map 頁會向瀏覽器請求位置權限。
- 使用者在 Hobart 25 km 內 → 地圖顯示藍色定位點，距離與步行時間從使用者位置計算。
- 拒絕權限、無法定位或不在 Hobart → 預設起點為 **Centenary Building（Grosvenor Crescent, Dynnyrne TAS 7005）**，並標示「from Centenary Building」。
- 瀏覽器只在 HTTPS 或 localhost 提供定位；GitHub Pages 為 HTTPS，可正常使用。

### 多語言（i18n）

| 內容 | 位置 |
| --- | --- |
| 介面文字 | `src/i18n/messages/<locale>.js`（vue-i18n；`en.js` 為來源語言） |
| 景點介紹、相簿說明、今昔對照、導覽稿 | 英文在 `src/data/`；翻譯在 `src/i18n/content/<locale>.js`，由 `src/i18n/content.js` 合併 |
| 語言清單、語音標籤 | `src/i18n/index.js` 的 `LOCALES` |

- 缺少的翻譯一律退回英文，不會出現空白。
- 景點名稱為專有名詞，保留英文。
- 單元測試會檢查每種語言的介面鍵值與英文**完全一致**、且 `{placeholder}` 沒有遺漏；新增文字時忘了翻譯，`npm test` 會直接失敗。
- 語言選擇會記住（localStorage），並設定 `<html lang>`；Google 路線指示與地圖標籤也使用同一語言。

**新增一種語言**：複製 `messages/en.js` 翻譯 → 新增 `content/<code>.js` → 在 `i18n/index.js` 的 `LOCALES` 與 `messages`、`i18n/content.js` 的 `CONTENT` 登記。

### 語音導覽（免費）

使用瀏覽器內建的 **Web Speech API**（`speechSynthesis`）：不需 API 金鑰、不收費、可離線。iOS／macOS、Android、Windows 與 Chrome 都內建英、中、日、韓、越語音；若裝置缺少某語言的語音，頁面會提示使用者到系統設定新增。逐句朗讀，進度條、±15 秒與拖曳都以句子為單位。

## 2. 技術架構

| 層級 | 選擇 | 理由 |
| --- | --- | --- |
| 框架 | **Vue 3**（`<script setup>` SFC） | 元件化、樣式 scoped、學習曲線平緩 |
| 建置 | **Vite 7** | 秒級啟動、HMR、依頁面自動 code-splitting |
| 路由 | **Vue Router 4**（hash 模式） | 每個畫面都有網址，可返回／重新整理／分享；hash 模式可直接放在 GitHub Pages 等靜態空間 |
| 狀態 | **Pinia** ＋自製 `persist` plugin | 依領域拆分 store；按讚、路線偏好寫入 localStorage |
| 測試 | **Vitest** | 與 Vite 共用設定，測試純邏輯與 store |

資料流：

```
data/（靜態內容） ──► lib/（純函式：篩選、排序、計算）
        │                        │
        ▼                        ▼
stores/（使用者狀態） ──► views/（頁面）──► components/（UI 元件）
```

- **內容與狀態分離**：景點、路線類型、天氣等「內容」放在 `data/`；使用者操作產生的「狀態」（按讚、目的地、停靠點、播放進度）放在 `stores/`。
- **邏輯與畫面分離**：可測試的計算都放在 `lib/`，元件只負責呈現與事件。
- **網址即狀態**：Home 的分類與搜尋寫在 query（`#/home?category=convict&q=chapel`），返回上一頁時會保留。

---

## 3. 專案結構

```
hobart-heritage/
├── index.html                 # 入口 HTML（載入字體）
├── vite.config.js             # Vite + Vitest 設定、@ 路徑別名
├── scripts/dev.sh             # 一鍵啟動開發伺服器
├── src/
│   ├── main.js                # 建立 App、註冊 Pinia / Router / 全域樣式
│   ├── App.vue                # App 殼：狀態列、頁面轉場、Tab bar、Toast、Leading page
│   ├── router/index.js        # 路由表與 meta（所屬 Tab、狀態列樣式、是否隱藏 Tab bar）
│   ├── styles/
│   │   ├── tokens.css         # ★ 設計 token：色彩、字體、間距、圓角、陰影、動效
│   │   └── base.css           # reset、排版工具類、轉場、列印、減少動態
│   ├── data/                  # 靜態內容（改內容只需改這裡）
│   │   ├── sites.js           # 景點（實際經緯度、相簿、今昔對照；距離由座標計算）
│   │   ├── categories.js      # Home 分類
│   │   ├── navigation.js      # 路線類型、停靠點、導航模式、市中心參考點
│   │   ├── narration.js       # 語音導覽章節與逐字稿
│   │   └── weather.js         # 天氣資料（日後可替換為 API）
│   ├── lib/                   # 純函式（有單元測試）
│   │   ├── sites.js           # filterSites / rankByLikes / nearestSite / walkMinutesFor
│   │   ├── geo.js             # distanceKm / walkingMinutes / projectToBox（地理計算）
│   │   ├── polyline.js        # Google encoded polyline 解碼
│   │   ├── guidance.js        # 逐步導航：依位置判斷下一個轉彎
│   │   ├── format.js          # formatClock / pluralize / formatKm
│   │   └── storage.js         # 不會丟錯的 localStorage 包裝
│   ├── plugins/persist.js     # Pinia 持久化 plugin（含版本號）
│   ├── services/googleMaps.js # Google Maps API 載入器（讀取 VITE_ 環境變數）
│   ├── services/routes.js     # Google Routes API 步行路線（替代路線、途經點、快取）
│   ├── services/routeOptions.js # Normal / Accessible / Steep 路線挑選
│   ├── services/elevation.js  # Open-Meteo 海拔：爬升與坡度
│   ├── services/speech.js     # Web Speech API 朗讀與語音挑選
│   ├── i18n/                  # 多語言：index.js、messages/、content/、content.js
│   ├── stores/                # Pinia stores（依領域拆分）
│   │   ├── favorites.js       # 按讚
│   │   ├── trip.js            # 目的地、路線類型、停靠點、地圖偏好
│   │   ├── location.js        # 使用者即時定位（Geolocation API）與距離計算
│   │   ├── player.js          # 語音導覽播放
│   │   └── ui.js              # Toast、狀態列底色
│   ├── composables/           # 可重用的組合式函式
│   │   ├── useCarousel.js     # 吸附輪播 + 桌機拖曳
│   │   ├── useSwipe.js        # 左右滑動
│   │   ├── useKeydown.js      # 頁面鍵盤快捷鍵
│   │   ├── useGoBack.js       # 返回（沒有歷史紀錄時走 fallback）
│   │   └── useWalkingRoute.js # 目前位置 → 景點的步行路線（所有導航畫面共用）
│   ├── assets/
│   │   ├── icons.js           # 圖示庫（24px 線條）
│   │   └── images/splash-bg.jpg
│   ├── components/
│   │   ├── base/              # 設計系統基礎元件（不含業務邏輯）
│   │   │   ├── AppIcon.vue  BaseButton.vue  IconButton.vue  BaseBadge.vue
│   │   │   ├── ChipGroup.vue  SectionHeader.vue  BottomSheet.vue  EmptyState.vue
│   │   ├── layout/            # App 殼與頁面框架
│   │   │   ├── DeviceFrame.vue  StatusBar.vue  TabBar.vue  AppToast.vue
│   │   │   ├── AppPage.vue      # 可捲動頁面容器（回報捲動、保留捲動位置）
│   │   │   └── PageHeader.vue   # 子頁標頭（返回鍵＋標題）
│   │   ├── splash/            # SplashScreen.vue、TapToStart.vue
│   │   ├── home/              # SearchField、HeritageCarousel、SiteGridCard
│   │   ├── layout/…           # （另含 LanguageButton、LanguageSheet 語言切換）
│   │   ├── site/              # GalleryRail
│   │   ├── map/               # SiteMap（統一入口）→ GoogleMap / MapCanvas（插畫備援）；StopPicker、RouteTypePicker、WaypointSheet、ArrivalSheet（抵達面板）
│   │   └── ar/                # ArBubble、ArStatusPill、ArHelpOverlay
│   └── views/                 # 一個路由 = 一個 View（皆為 lazy-load）
│       ├── HomeView.vue  SiteDetailView.vue  GalleryView.vue  AudioTourView.vue
│       ├── MapView.vue  NavigationModesView.vue  StandardNavigationView.vue
│       ├── ArNavigationView.vue  PrintableMapView.vue
│       ├── ArCameraView.vue  ArCompareView.vue  WeatherView.vue
├── tests/                     # Vitest 單元測試
└── archive/v1-single-file/    # 舊版單檔 HTML（僅供參考，可刪除）
```

### 路由一覽

| 路徑 | View | Tab |
| --- | --- | --- |
| `/home` | HomeView（KeepAlive，保留捲動與輪播位置；舊網址 `/explore` 自動導向） | Home |
| `/sites/:id` | SiteDetailView | Home |
| `/sites/:id/gallery/:index?` | GalleryView | Home |
| `/sites/:id/audio` | AudioTourView | Home |
| `/map` | MapView | Map |
| `/navigate/:id` | NavigationModesView | Map |
| `/navigate/:id/map` · `/ar` · `/print` | 標準／AR／列印導航 | Map |
| `/ar/:id?` · `/ar/:id/compare` | ArCameraView（無 id = 最近的景點）· ArCompareView（所有景點的照片時間軸） | AR |
| `/weather` | WeatherView | Weather |

不存在的景點 id 會被 `beforeEnter` 導回 Home；未知路徑一律導回 Home。

---

## 4. 開發規範

### 4.1 元件分層

| 層 | 可以依賴 | 不可以 |
| --- | --- | --- |
| `components/base` | tokens、`AppIcon` | store、router、`data/` |
| `components/layout` | base、`ui` store、router | 業務資料 |
| `components/<feature>` | base、layout、`data/`、`lib/`、stores | 其他 feature 的元件 |
| `views` | 以上全部 | 直接寫 localStorage、寫死色碼 |

### 4.2 命名

- 元件：PascalCase，基礎元件加 `Base` / `App` 前綴（`BaseButton`、`AppIcon`）。
- View：`<Name>View.vue`；Store：`use<Name>Store`；Composable：`use<Name>`。
- CSS class：BEM 風格（`rank-card__name`、`is-active` 表示狀態）。
- 事件：`update:modelValue`（v-model）、`select`、`close`、`move`，一律小寫動詞。

### 4.3 樣式

- **只用 token**：顏色、字體、間距、圓角、陰影一律用 `var(--…)`，不在元件內寫死 hex。
- 元件樣式寫在 `<style scoped>`；跨元件的排版工具類在 `base.css`（`.t-h1`、`.t-caption`、`.muted`…）。
- 數值在 JS 使用時（例如縮放上限、掃描秒數）寫成檔案頂端的常數（`ZOOM`、`SCAN_DURATION_MS`）。

### 4.4 常見修改

| 需求 | 修改位置 |
| --- | --- |
| 新增景點 | `src/data/sites.js` 加一筆（含 `coordinates` 經緯度、`gallery`）即可；距離、步行時間、地圖位置都會自動計算 |
| 新增分類 | `src/data/categories.js` ＋ 景點的 `category`（Home 篩選列自動出現） |
| 調整品牌色／字體 | `src/styles/tokens.css` |
| 新增圖示 | `src/assets/icons.js`（24×24、2px 線條） |
| 新增頁面 | `src/views/XxxView.vue` ＋ `src/router/index.js` 設定 `meta.tab` / `meta.status` |
| 串接真實天氣 | 讓 API 回傳 `src/data/weather.js` 相同結構 |
| localStorage 結構改變 | 在該 store 的 `persist.version` 加 1，舊資料會被忽略 |

---

## 5. UI 設計規範（Design System）

所有數值的唯一來源：[`src/styles/tokens.css`](src/styles/tokens.css)。

### 5.1 設計原則

1. **Heritage, not museum** — 以砂岩米色、襯線標題營造歷史感，但互動保持現代、直覺。
2. **One action colour** — 勃根地紅只代表「可以按／已選擇」，使用者不需要猜。
3. **Content first** — 照片與故事是主角；介面使用低彩度中性色退到背景。
4. **Accessible by default** — 對比度 ≥ WCAG AA、觸控區 ≥ 44px、所有圖示按鈕都有 `aria-label`。
5. **Consistent everywhere** — 所有頁面（含 Leading page、AR、地圖）共用同一組 token。

### 5.2 色彩

#### 主色 Primary — Heritage Burgundy

| Token | Hex | 用途 | 對比度 |
| --- | --- | --- | --- |
| `--brand-600` | `#7D3045` | **唯一的行動色**：主要按鈕、選中的 chip／分頁／路線類型、Tab bar 指示條、按讚 | 白底 8.8:1 · 米底 7.7:1（AAA） |
| `--brand-700` | `#5E2233` | 按下（hover / pressed） | — |
| `--brand-100` | `#EAD2D9` | 選中外框的淺色 | — |
| `--brand-50` | `#F5E8EC` | 選中底色（如路線類型、今日天氣） | — |

#### 輔色 Secondary — Sandstone Charcoal（文字與深色表面）

| Token | Hex | 用途 | 米底對比 |
| --- | --- | --- | --- |
| `--ink-900` | `#2C2417` | 標題、深色膠囊（Toast、AR 狀態、導航指示卡） | 13.4:1 |
| `--ink-700` | `#4A3F30` | 內文 | 9.0:1 |
| `--ink-500` | `#6E6352` | 次要文字、說明、未選中的 Tab | 5.1:1（AA） |
| `--ink-300` | `#B9AE9C` | 停用、深色底上的分隔 | 僅裝飾 |

#### 中性色 Neutrals — 紙與砂岩

| Token | Hex | 用途 |
| --- | --- | --- |
| `--cream` | `#F5EFE6` | **頁面底色**（每個畫面約 60%） |
| `--paper` | `#FFFFFF` | 卡片、Home 標頭與輪播區、Tab bar |
| `--parchment` | `#FAF6F0` | 列表 hover 等內嵌表面 |
| `--sand` | `#E8DCC8` | 邊框、chip 外框、安靜按鈕 |
| `--sand-dark` | `#D4C4A8` | 未啟用指示點、筆記虛線 |

#### 點綴色 Accent — Sunset Amber

| Token | Hex | 用途 |
| --- | --- | --- |
| `--accent-500` | `#D98A3D` | 填色／圖示：陡坡路線線條 |
| `--accent-100` / `-50` | `#F6DFC4` / `#FBF0E3` | 地圖「最近景點」提示條底色 |
| `--accent-700` | `#8F5217` | 需要琥珀色文字時使用（相簿年份），米底 5.4:1 |

> ⚠️ `--accent-500` 不可作為白／米底上的文字色（白底僅 2.7:1）。

#### 功能色 Functional — 每個顏色只有一種意義

| Token | Hex | 意義 |
| --- | --- | --- |
| `--success-600` / `-50` | `#4A6741` / `#E8EFE6` | 無障礙、適合步行、已抵達、ETA |
| `--info-600` | `#2F6FED` | 「你在這裡」定位點（沿用地圖慣例藍） |
| `--ar-400` | `#38BDF8` | AR 數位疊加層（掃描框、導航箭頭），**只出現在相機畫面** |

#### 使用比例 60 · 30 · 10

```
██████████████████████████████████████ 60%  米色／白（背景、卡片）
███████████████████                    30%  砂岩炭灰（文字、深色元件）
██████                                 10%  勃根地紅 7% ＋ 琥珀 3%（行動、點綴）
```

#### 照片上的文字

照片（Leading page、景點大圖、AR）一律疊加暖炭灰漸層（`--photo-veil-top` / `--photo-veil-bottom` 或同色系 rgba），確保白／米色文字對比 ≥ 4.5:1。**不使用冷色（藍黑）遮罩**，以維持整體米色系調性。

### 5.3 字體

| 角色 | 字體 | 風格 | 用在 |
| --- | --- | --- | --- |
| **Heading** | Playfair Display 700 | 高對比襯線 — 歷史感、優雅 | 頁面標題、區塊標題、景點名稱、大數字（溫度、ETA） |
| **Body** | Inter 400/500 | 現代、乾淨 | 描述、逐字稿、說明文字 |
| **Label** | Montserrat 500–700 | 清楚、容易閱讀 | 小標題、Tab bar、按鈕、chip、徽章、表單 |
| **Decorative** | Caveat 600 | 手寫 — 旅遊、故事感 | 只用於 Leading page 的點綴，**一個畫面最多一處** |

字級（token → 規格）：

| Token | 規格 | 範例 |
| --- | --- | --- |
| `--t-hero` | Playfair 700 · 52px / 1.02 | Leading page「Hobart」（副行 40px） |
| `--t-display` | Playfair 700 · 30 / 36 | 景點名稱、「How would you like to navigate?」 |
| `--t-h1` | Playfair 700 · 24 / 30 | 「Heritage Guide」「Walking conditions」 |
| `--t-h2` | Playfair 700 · 19 / 25 | 區塊標題「Top 5 Heritages」 |
| `--t-h3` | Montserrat 700 · 15 / 21 | 子頁標頭「Audio tour」 |
| `--t-body` | Inter 400 · 15 / 23 | 內文 |
| `--t-small` | Inter 500 · 13 / 18 | 地區 · 步行時間 |
| `--t-label` | Montserrat 600 · 13 / 16 | 按鈕、chip |
| `--t-caption` | Montserrat 700 · 11 / 14，大寫、字距 +8% | 「CONVICT HERITAGE · SOUTH HOBART」 |

- 數字一律使用齊線數字（`lining-nums`），避免 Playfair 預設的舊式數字造成時間／溫度高低不一。
- 行長控制在 45–75 字元；內文不使用粗體強調超過一句。

### 5.4 間距與版面

- **4pt 網格**：`--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 20 · `--s-6` 24 · `--s-8` 32。
- **畫面左右邊距** `--gutter` 20px；區塊之間 24px；卡片內距 12–16px。
- **狀態列** 44px（`--safe-top`），浮在內容上方：照片頁為透明白字，捲過主視覺後轉為米色實底。
- **Tab bar** 固定四項：Home · Map · AR · Weather；全螢幕導航任務時隱藏。Weather 的圖示顯示目前天氣，天氣改變時淡入淡出（`CrossfadeIcon`）；標籤文字不變。

### 5.4.1 版面層級：控制項靠近它控制的內容

依 Gestalt「鄰近原則」，控制項必須緊貼它所影響的內容：

| 控制項 | 位置 | 原因 |
| --- | --- | --- |
| 輪播 ‹ › 與頁碼圓點 | 輪播**下方**同一列 | 讀完卡片後自然往下找「下一張」；拇指易觸及；標題列保持乾淨 |
| 搜尋、分類 chips | 「All Heritage Sites」清單**正上方** | 它們只篩選清單、不影響 Top 5；放在頁首會讓使用者誤以為會篩選輪播 |
| 頁首 | 只放地點與頁面標題 | 第一眼先建立情境，不放功能按鈕 |

### 5.5 圓角、陰影、動效

| 類別 | Token | 用途 |
| --- | --- | --- |
| 圓角 | `--r-sm` 8 | 縮圖、排名標 |
| | `--r-md` 12 | 按鈕、輸入框、提示卡 |
| | `--r-lg` 16 | 卡片、相片 |
| | `--r-xl` 24 | 底部面板、主視覺卡 |
| | `--r-pill` | chip、徽章、搜尋列、分段控制 |
| 陰影 | `--e-1` | 卡片 hover、浮在照片上的按鈕 |
| | `--e-2` | 浮動控制（地圖按鈕、Toast、彈出卡） |
| | `--e-3` | 由下往上的面板 |
| 動效 | `--dur-fast` 150ms · `--dur` 220ms · `--dur-slow` 400ms，曲線 `--ease` | 頁面淡入上移 6px；面板上滑；Leading page 文字依序浮現 |

系統開啟「減少動態效果」時，所有動畫與轉場自動關閉（`base.css`）。

### 5.6 元件規範

| 元件 | 規格 | 規則 |
| --- | --- | --- |
| **BaseButton** | 高 48px（sm 40px）、圓角 12、Montserrat 600 14px | `primary` 每個畫面最多一個；其他動作用 `secondary`（白底＋砂色框）或 `quiet`（砂色底） |
| **IconButton** | 44×44 | `paper` 照片上、`sand` 米色標頭內、`glass` 相機畫面、`float` 地圖上；**必填 `label`** |
| **BaseBadge** | 高 30（sm 24）、膠囊 | `neutral` 事實、`success` 無障礙、`brand` 按讚／特色、`accent` 提示 |
| **ChipGroup** | 高 36、膠囊 | 單選（`role="radiogroup"`）；選中＝勃根地紅實心 |
| **卡片** | 白底、1.5px 砂色框、圓角 16 | 可點擊整張卡；卡內另有按鈕時用 stretched-link，避免巢狀互動元素 |
| **BottomSheet** | 米色、上圓角 24、把手 40×4 | 點背景或 Esc 關閉；`aria-modal` |
| **Toast / 狀態膠囊** | 炭灰底、米色字、圓角 12 | 1.8 秒自動消失；進行中狀態附 spinner |
| **Tab bar** | 白底、上邊框砂色 | 選中項：勃根地紅圖示＋文字＋頂部 3px 指示條 |
| **搜尋（收合式）** | 清單標題右側 44px 🔍 按鈕 | 點擊後標題列變成搜尋框＋「取消」，自動聚焦；平常不占版面 |
| **語言與顯示** | 地球圖示＋語言縮寫＋「Aa」的膠囊按鈕 | 開啟底部面板：上方「顯示」兩個開關（放大文字、高對比，`role="switch"`，不會關閉面板）；下方語言以各語言原文列出，選擇後立即套用並關閉 |
| **抵達面板** | `ArrivalSheet`，標準與 AR 導航共用 | 到達 20 m 內自動開啟（原型可按「Simulate arrival」）；主要動作依情境：地圖導航→收聽語音，AR 導航→AR 掃描；語音不自動播放（WCAG 1.4.2） |
| **底部面板確認鈕** | 44px 圓形 | 尚未選擇時為沙色 ✕（關閉）；有任何選擇時變為綠色 ✓（完成） |
| **輪播（Carousel）** | 卡片 290px、吸附捲動；控制列 `‹ • • • • • ›` 置中於卡片**下方** | 箭頭 44×44；圓點可點擊（24×44 觸控區），選中圓點拉長為 18px 主色；首／末張時對應箭頭淡化停用 |
| **篩選列（Filter bar）** | 搜尋框（常駐）＋分類 chips，米色底 | 放在**被篩選的清單正上方**；捲動時 sticky 在狀態列下方，黏住後出現分隔陰影 |
| **Tap to start** | 核心 148px 米白發光圓＋兩圈固定光暈＋三層擴散脈衝 | 文字單行、勃根地紅、字距 0.22em |

### 5.7 圖示

- 24×24 viewBox、2px 線條、圓角端點與轉角，統一由 `AppIcon` 繪製。
- 圖示顏色繼承文字色（`currentColor`）；選中時與文字一起轉為主色。
- 只用在有明確意義的地方；純裝飾圖示加 `aria-hidden`（`AppIcon` 預設即是）。

### 5.8 無障礙檢查清單

- [x] 文字對比 ≥ 4.5:1，大字 ≥ 3:1
- [x] 所有可點擊元素 ≥ 44×44px
- [x] 圖示按鈕皆有 `aria-label`；切換類按鈕有 `aria-pressed`
- [x] 單選群組使用 `role="radiogroup"` / `aria-checked`
- [x] 鍵盤：Tab 聚焦環（`--focus-ring`）、Enter/Space 啟動、Esc 關閉面板、相簿支援 ← →
- [x] 動態訊息（Toast、掃描狀態、搜尋結果）使用 `aria-live`
- [x] 支援 `prefers-reduced-motion`
- [x] 放大文字：`.text-zoom` 表面（頁面、面板、Tab bar）放大 1.2 倍；地圖與相機畫面不縮放，避免座標偏移
- [x] 高對比：`:root[data-contrast=high]` 覆寫 token，次要文字與外框加深（外框 ≥ 3:1，WCAG 1.4.11）
- [x] 橫向捲動區可用鍵盤聚焦；圖表與 emoji 天氣圖示另有文字替代
- [x] 照片皆有 `alt`；純裝飾圖片 `alt=""`

### 5.9 文案語氣

- 英文介面、句首大寫（Sentence case）：「Start walking route」而非「START WALKING ROUTE」；全大寫只用於 caption。
- 動詞開頭、具體：「Add a stop」「Travel through time · 6 photos」。
- 在地尊重：地名優先並列原住民名稱（nipaluna / Hobart、kunanyi / Mount Wellington）。

---

## 6. 測試

```bash
npm test
```

| 檔案 | 內容 |
| --- | --- |
| `tests/lib/sites.spec.js` | 篩選（分類＋搜尋）、依按讚排序、最近景點、各路線步行時間 |
| `tests/lib/format.spec.js` | 時間、單複數、公里格式 |
| `tests/stores/stores.spec.js` | 按讚切換、停靠點上限、路線類型驗證、播放器 seek／計時 |

新增邏輯時，優先寫成 `lib/` 的純函式並補上測試。

---

## 7. 建置與部署

**線上版本：** https://podi-skying.github.io/KIT519-Hobart-Historic/

推送到 `main` 分支後，GitHub Actions（`.github/workflows/deploy.yml`）會自動執行：
`npm ci` → `npm test` → `npm run build` → 發布 `dist/` 到 GitHub Pages。測試沒過就不會發布。

第一次使用需在 repo 的 **Settings › Pages › Build and deployment › Source** 選 **GitHub Actions**。

本機建置：

```bash
npm run build      # → dist/
```

- `vite.config.js` 設定 `base: './'`，搭配 hash 路由，`dist/` 可直接上傳到 GitHub Pages、Netlify 或任何靜態主機，不需伺服器重寫規則。
- 每個 View 各自拆成一個 chunk，首次載入只下載 Home 需要的程式碼。

---

## 8. 素材與授權

- **Leading page 背景**（`src/assets/images/splash-bg.jpg`）：由專案作者提供。
- **景點照片**：目前直接引用原型網站 `ginaintas-art.github.io/hobart-heritage-ar-prototype` 的圖片；正式上線前請確認授權或替換為自有素材（修改 `src/data/sites.js` 的 `IMAGE_BASE`）。
- **字體**：Playfair Display、Inter、Montserrat、Caveat — Google Fonts（SIL Open Font License）。

---

_v2.0 — Vue 3 重構版。v1 單檔 HTML 保留於 `archive/v1-single-file/`。_
