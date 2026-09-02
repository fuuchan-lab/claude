if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => console.error("SW registration failed", err));
  });
}

// --- i18n: Japanese if the browser/OS locale is Japanese, English otherwise ---
const LANG = (navigator.language || "ja").toLowerCase().startsWith("ja") ? "ja" : "en";
const LOCALE = LANG === "ja" ? "ja-JP" : "en-GB";

const STRINGS = {
  ja: {
    subtitle: "スイスの現在時刻・為替レート・鉄道時計をリアルタイム表示",
    clockTitle: "スイス時刻",
    sbbNote: "実際のSBB時計は毎分の同期パルスで秒針が12時位置で一瞬停止する「stop2go」機構を再現しています。",
    fxTitle: "スイスフラン (CHF) 為替レート",
    fxLabelChf: "スイスフラン",
    fxLabelJpy: "日本円",
    unitJpy: "円",
    oandaLinkTitle: "OANDAの為替換算ページを開く",
    oandaLinkText: "OANDAで見る ↗",
    fxNote: "出典: Frankfurter API (欧州中央銀行 参考レート)。60秒ごとに自動更新します。",
    weatherTitle: "Trübbach(トリュバッハ)の天気",
    weatherNote: "出典: Open-Meteo (座標: Trübbach, Wartau SG)。10分ごとに自動更新します。月齢は天文計算による概算値です。",
    webcamTitle: "近くのライブカメラ",
    webcamAlt: "Balzers ライブカメラ",
    webcamFallbackTitle: "Balzers ライブカメラ (MeteoNews)",
    webcamFallbackText: "画像を読み込めなかったため、タップして直接見る ↗",
    webcamNote: "出典: MeteoNews Webcam Balzers(Trübbach対岸)。1分ごとに画像を更新します。",
    busTitle: "次のバス",
    sbbLinkTitle: "SBBの乗換案内で調べる",
    sbbLinkText: "SBBで見る ↗",
    busNote: "出典: opendata.ch 公共交通機関API。30秒ごとに自動更新します。",

    loading: "読み込み中...",
    updatedPrefix: "最終更新: ",
    asOfPrefix: "レート基準日: ",
    fxRateFailed: "レート取得に失敗しました",
    weatherFailed: "天気情報の取得に失敗しました。しばらくして再試行します。",
    busFailed: "バス時刻表の取得に失敗しました。しばらくして再試行します。",
    busNoDepartures: "現在予定されている便がありません。",
    departingNow: "まもなく発車",
    minutesLater: (m) => `${m}分後`,
    hoursMinutesLater: (h, m) => `${h}時間${m}分後`,
    delaySuffix: (d) => `+${d}分遅れ`,
    busDest: (d) => `${d} 方面`,
    busDeparts: (t) => `${t}発`,
    statusDayOff: "休業日(土日祝)",
    statusOpen: "営業時間内 (8:00-17:00)",
    statusClosed: "営業時間外",
    pressureLabel: (v) => `気圧: ${v} hPa`,
    extraLabel: (h, w) => `湿度: ${h}% ・ 風速: ${w} km/h`,
    sunTimes: (sr, ss) => `日出 ${sr} / 日没 ${ss}`,
    moonLabel: (age, label) => `月齢 ${age} (${label})`,
    unknownWeather: "不明",
  },
  en: {
    subtitle: "Live Swiss time, exchange rate and railway clock",
    clockTitle: "Swiss Time",
    sbbNote: "Recreates the real SBB clock's \"stop2go\" mechanism: the second hand sweeps in 58.5s, then pauses at 12 for 1.5s until the next minute's sync pulse.",
    fxTitle: "Swiss Franc (CHF) Exchange Rate",
    fxLabelChf: "Swiss Francs",
    fxLabelJpy: "Japanese Yen",
    unitJpy: "JPY",
    oandaLinkTitle: "Open OANDA's currency converter",
    oandaLinkText: "View on OANDA ↗",
    fxNote: "Source: Frankfurter API (ECB reference rates). Refreshes every 60s.",
    weatherTitle: "Weather in Trübbach",
    weatherNote: "Source: Open-Meteo (coordinates: Trübbach, Wartau SG). Refreshes every 10 min. Moon phase is an astronomical approximation.",
    webcamTitle: "Nearby Live Camera",
    webcamAlt: "Balzers live camera",
    webcamFallbackTitle: "Balzers Live Camera (MeteoNews)",
    webcamFallbackText: "Image failed to load — tap to view it directly ↗",
    webcamNote: "Source: MeteoNews Webcam Balzers (across the river from Trübbach). Image refreshes every minute.",
    busTitle: "Next Buses",
    sbbLinkTitle: "Look it up on SBB's journey planner",
    sbbLinkText: "View on SBB ↗",
    busNote: "Source: opendata.ch public transport API. Refreshes every 30s.",

    loading: "Loading...",
    updatedPrefix: "Updated: ",
    asOfPrefix: "as of ",
    fxRateFailed: "Failed to fetch rate",
    weatherFailed: "Failed to load weather. Retrying shortly.",
    busFailed: "Failed to load bus times. Retrying shortly.",
    busNoDepartures: "No upcoming departures.",
    departingNow: "Departing now",
    minutesLater: (m) => `in ${m} min`,
    hoursMinutesLater: (h, m) => `in ${h}h ${m}m`,
    delaySuffix: (d) => `+${d} min delay`,
    busDest: (d) => `to ${d}`,
    busDeparts: (t) => `dep. ${t}`,
    statusDayOff: "Closed (weekend/holiday)",
    statusOpen: "Open (8:00-17:00)",
    statusClosed: "Closed (outside hours)",
    pressureLabel: (v) => `Pressure: ${v} hPa`,
    extraLabel: (h, w) => `Humidity: ${h}% · Wind: ${w} km/h`,
    sunTimes: (sr, ss) => `Sunrise ${sr} / Sunset ${ss}`,
    moonLabel: (age, label) => `Moon age ${age} (${label})`,
    unknownWeather: "Unknown",
  },
};

function tr(key, ...args) {
  const entry = STRINGS[LANG][key];
  return typeof entry === "function" ? entry(...args) : entry;
}

function applyStaticTranslations() {
  document.documentElement.lang = LANG;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (STRINGS[LANG][key]) el.textContent = tr(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (STRINGS[LANG][key]) el.title = tr(key);
  });
  document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    const key = el.getAttribute("data-i18n-alt");
    if (STRINGS[LANG][key]) el.alt = tr(key);
  });
}
applyStaticTranslations();

const ZURICH_TZ = "Europe/Zurich";

const digitalTimeEl = document.getElementById("digitalTime");
const digitalDateEl = document.getElementById("digitalDate");
const holidayLabelEl = document.getElementById("holidayLabel");
const statusLightEl = document.getElementById("statusLight");

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZURICH_TZ,
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  timeZone: ZURICH_TZ,
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

const zurichYmdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZURICH_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getZurichParts(date) {
  const parts = timeFormatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return {
    hours: Number(lookup.hour),
    minutes: Number(lookup.minute),
    seconds: Number(lookup.second),
  };
}

function getZurichYmd(date) {
  const parts = zurichYmdFormatter.formatToParts(date);
  const lookup = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { year: Number(lookup.year), month: lookup.month, day: lookup.day };
}

// Swiss public holidays: canton St. Gallen's legal holidays (where Trübbach/
// Evatec AG sit) plus the two holidays observed nationwide across Switzerland
// (Bundesfeier is the only one set by federal law; Berchtoldstag and Bettag
// are near-universal cantonal customs coordinated to the same date).
function computeEasterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function buildHolidayMap(year) {
  const map = {};
  const setKey = (date, ja, en) => {
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    map[`${mm}-${dd}`] = { ja, en };
  };
  const setOffset = (base, days, ja, en) => {
    const d = new Date(base.getTime());
    d.setUTCDate(d.getUTCDate() + days);
    setKey(d, ja, en);
  };

  const easter = computeEasterSunday(year);
  setKey(new Date(Date.UTC(year, 0, 1)), "元日", "New Year's Day");
  setKey(new Date(Date.UTC(year, 0, 2)), "ベルヒトルトの日", "Berchtold's Day");
  setOffset(easter, -2, "聖金曜日", "Good Friday");
  setOffset(easter, 1, "イースターマンデー", "Easter Monday");
  setOffset(easter, 39, "キリスト昇天祭", "Ascension Day");
  setOffset(easter, 50, "聖霊降臨祭の月曜日", "Whit Monday");
  setKey(new Date(Date.UTC(year, 7, 1)), "スイス建国記念日", "Swiss National Day");

  // Bettag: third Sunday of September, coordinated nationwide.
  const sep1Weekday = new Date(Date.UTC(year, 8, 1)).getUTCDay();
  const firstSunday = 1 + ((7 - sep1Weekday) % 7);
  setKey(new Date(Date.UTC(year, 8, firstSunday + 14)), "連邦感謝祈祷の日", "Federal Day of Prayer");

  setKey(new Date(Date.UTC(year, 10, 1)), "諸聖人の日", "All Saints' Day");
  setKey(new Date(Date.UTC(year, 11, 25)), "クリスマス", "Christmas Day");
  setKey(new Date(Date.UTC(year, 11, 26)), "聖ステファノの日", "St. Stephen's Day");
  return map;
}

const holidayMapByYear = {};

function getHolidayName(year, month, day) {
  if (!holidayMapByYear[year]) holidayMapByYear[year] = buildHolidayMap(year);
  const entry = holidayMapByYear[year][`${month}-${day}`];
  return entry ? entry[LANG] : undefined;
}

function updateDigitalClock(date) {
  const { hours, minutes, seconds } = getZurichParts(date);
  const pad = (n) => String(n).padStart(2, "0");
  digitalTimeEl.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  digitalDateEl.textContent = dateFormatter.format(date);

  const { year, month, day } = getZurichYmd(date);
  const weekday = new Date(Date.UTC(year, Number(month) - 1, Number(day))).getUTCDay();
  const isWeekend = weekday === 0 || weekday === 6;
  const holidayName = getHolidayName(year, month, day);

  if (holidayName || isWeekend) {
    digitalDateEl.classList.add("is-holiday");
  } else {
    digitalDateEl.classList.remove("is-holiday");
  }
  if (holidayName) {
    holidayLabelEl.textContent = holidayName;
    holidayLabelEl.hidden = false;
  } else {
    holidayLabelEl.hidden = true;
  }

  updateStatusLight(isWeekend || Boolean(holidayName), hours);
}

// Evatec AG-area business-hours indicator: green during 8:00-17:00 on
// weekdays, yellow outside those hours on weekdays, red on weekends/holidays.
function updateStatusLight(isDayOff, hour) {
  let status, label;
  if (isDayOff) {
    status = "red";
    label = tr("statusDayOff");
  } else if (hour >= 8 && hour < 17) {
    status = "green";
    label = tr("statusOpen");
  } else {
    status = "yellow";
    label = tr("statusClosed");
  }
  statusLightEl.classList.remove("status-green", "status-yellow", "status-red");
  statusLightEl.classList.add(`status-${status}`);
  statusLightEl.title = label;
}

// --- SBB railway clock ---
const ticksGroup = document.getElementById("sbbTicks");
const hourHand = document.getElementById("sbbHour");
const minuteHand = document.getElementById("sbbMinute");
const secondGroup = document.getElementById("sbbSecondGroup");

function buildTicks() {
  const cx = 100;
  const cy = 100;
  const rOuter = 96;
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const rInner = isMajor ? rOuter - 14 : rOuter - 7;
    const x1 = cx + rInner * Math.cos(angle);
    const y1 = cy + rInner * Math.sin(angle);
    const x2 = cx + rOuter * Math.cos(angle);
    const y2 = cy + rOuter * Math.sin(angle);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1.toFixed(2));
    line.setAttribute("y1", y1.toFixed(2));
    line.setAttribute("x2", x2.toFixed(2));
    line.setAttribute("y2", y2.toFixed(2));
    line.setAttribute("class", isMajor ? "sbb-tick-major" : "sbb-tick-minor");
    ticksGroup.appendChild(line);
  }
}

// Authentic SBB "stop2go": the second hand sweeps a full circle in 58.5s,
// then rests at the 12 position for 1.5s until the next minute's sync pulse.
const SWEEP_SECONDS = 58.5;

function updateSbbClock(date) {
  const { hours, minutes, seconds } = getZurichParts(date);
  const ms = date.getMilliseconds();
  const secondsElapsed = seconds + ms / 1000;

  const hourAngle = ((hours % 12) + minutes / 60) * 30;
  const minuteAngle = minutes * 6;
  const secondAngle =
    secondsElapsed <= SWEEP_SECONDS ? (secondsElapsed / SWEEP_SECONDS) * 360 : 360;

  hourHand.setAttribute("transform", `rotate(${hourAngle} 100 100)`);
  minuteHand.setAttribute("transform", `rotate(${minuteAngle} 100 100)`);
  secondGroup.setAttribute("transform", `rotate(${secondAngle} 100 100)`);
}

buildTicks();

function tick() {
  const now = new Date();
  updateDigitalClock(now);
  updateSbbClock(now);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// --- CHF -> JPY exchange rate + calculator ---
const fxHeadlineEl = document.getElementById("fxHeadline");
const fxUpdatedEl = document.getElementById("fxUpdated");
const fxCalcChfEl = document.getElementById("fxCalcChf");
const fxCalcJpyEl = document.getElementById("fxCalcJpy");
const fxOandaLinkEl = document.getElementById("fxOandaLink");

let currentChfToJpyRate = null;

async function fetchFxRates() {
  try {
    const url = "https://api.frankfurter.dev/v1/latest?base=CHF&symbols=JPY";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderFxRates(data);
  } catch (err) {
    fxHeadlineEl.textContent = tr("fxRateFailed");
    console.error("FX fetch failed", err);
  }
}

function renderFxRates(data) {
  const rate = data.rates.JPY;
  if (typeof rate !== "number") return;
  currentChfToJpyRate = rate;
  fxHeadlineEl.textContent = `1 CHF = ${rate.toFixed(2)} ${tr("unitJpy")}`;
  const now = new Date();
  fxUpdatedEl.textContent = `${tr("updatedPrefix")}${now.toLocaleTimeString(LOCALE)} (${tr("asOfPrefix")}${data.date})`;
  recalcFromChf();
}

function recalcFromChf() {
  if (currentChfToJpyRate === null) return;
  const chf = parseFloat(fxCalcChfEl.value);
  if (Number.isNaN(chf)) {
    fxCalcJpyEl.value = "";
  } else {
    fxCalcJpyEl.value = roundForDisplay(chf * currentChfToJpyRate);
  }
  updateOandaLink();
}

function recalcFromJpy() {
  if (currentChfToJpyRate === null) return;
  const jpy = parseFloat(fxCalcJpyEl.value);
  if (Number.isNaN(jpy)) {
    fxCalcChfEl.value = "";
  } else {
    fxCalcChfEl.value = roundForDisplay(jpy / currentChfToJpyRate);
  }
  updateOandaLink();
}

function roundForDisplay(value) {
  return Math.round(value * 100) / 100;
}

function updateOandaLink() {
  const jpy = parseFloat(fxCalcJpyEl.value);
  const amount = Number.isNaN(jpy) ? 1 : jpy;
  fxOandaLinkEl.href = `https://www.oanda.com/currency-converter/en/?from=JPY&to=CHF&amount=${amount}`;
}

fxCalcChfEl.addEventListener("input", recalcFromChf);
fxCalcJpyEl.addEventListener("input", recalcFromJpy);

fetchFxRates();
setInterval(fetchFxRates, 60_000);

// --- Trübbach / Evatec AG weather (Open-Meteo, no API key required) ---
// Evatec AG's headquarters (Hauptstrasse 1a) sits in Trübbach, a village in
// the municipality of Wartau, canton St. Gallen — coordinates below target
// that location.
const TRUEBBACH_LAT = 47.2064;
const TRUEBBACH_LON = 9.4826;

const WEATHER_CODE_MAP = {
  0: { icon: "☀️", ja: "快晴", en: "Clear sky" },
  1: { icon: "🌤️", ja: "ほぼ晴れ", en: "Mainly clear" },
  2: { icon: "⛅", ja: "一部曇り", en: "Partly cloudy" },
  3: { icon: "☁️", ja: "曇り", en: "Overcast" },
  45: { icon: "🌫️", ja: "霧", en: "Fog" },
  48: { icon: "🌫️", ja: "霧氷を伴う霧", en: "Rime fog" },
  51: { icon: "🌦️", ja: "弱い霧雨", en: "Light drizzle" },
  53: { icon: "🌦️", ja: "霧雨", en: "Drizzle" },
  55: { icon: "🌦️", ja: "強い霧雨", en: "Dense drizzle" },
  56: { icon: "🌧️", ja: "着氷性の弱い霧雨", en: "Light freezing drizzle" },
  57: { icon: "🌧️", ja: "着氷性の霧雨", en: "Freezing drizzle" },
  61: { icon: "🌧️", ja: "弱い雨", en: "Light rain" },
  63: { icon: "🌧️", ja: "雨", en: "Rain" },
  65: { icon: "🌧️", ja: "強い雨", en: "Heavy rain" },
  66: { icon: "🌧️", ja: "着氷性の弱い雨", en: "Light freezing rain" },
  67: { icon: "🌧️", ja: "着氷性の雨", en: "Freezing rain" },
  71: { icon: "🌨️", ja: "弱い雪", en: "Light snow" },
  73: { icon: "🌨️", ja: "雪", en: "Snow" },
  75: { icon: "❄️", ja: "強い雪", en: "Heavy snow" },
  77: { icon: "❄️", ja: "霧雪", en: "Snow grains" },
  80: { icon: "🌦️", ja: "弱いにわか雨", en: "Light rain showers" },
  81: { icon: "🌦️", ja: "にわか雨", en: "Rain showers" },
  82: { icon: "⛈️", ja: "激しいにわか雨", en: "Violent rain showers" },
  85: { icon: "🌨️", ja: "弱いにわか雪", en: "Light snow showers" },
  86: { icon: "🌨️", ja: "にわか雪", en: "Snow showers" },
  95: { icon: "⛈️", ja: "雷雨", en: "Thunderstorm" },
  96: { icon: "⛈️", ja: "雹を伴う雷雨", en: "Thunderstorm with hail" },
  99: { icon: "⛈️", ja: "激しい雹を伴う雷雨", en: "Severe thunderstorm with hail" },
};

function describeWeatherCode(code) {
  const entry = WEATHER_CODE_MAP[code];
  if (!entry) return { icon: "❓", label: tr("unknownWeather") };
  return { icon: entry.icon, label: entry[LANG] };
}

const weatherIconEl = document.getElementById("weatherIcon");
const weatherTempEl = document.getElementById("weatherTemp");
const weatherDescEl = document.getElementById("weatherDesc");
const weatherPressureEl = document.getElementById("weatherPressure");
const weatherExtraEl = document.getElementById("weatherExtra");
const weatherMoonEl = document.getElementById("weatherMoon");
const weatherForecastEl = document.getElementById("weatherForecast");
const weatherUpdatedEl = document.getElementById("weatherUpdated");
const sunTimesEl = document.getElementById("sunTimes");

async function fetchWeather() {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${TRUEBBACH_LAT}&longitude=${TRUEBBACH_LON}` +
      `&current=temperature_2m,weather_code,pressure_msl,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
      `&timezone=Europe%2FZurich&forecast_days=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderWeather(data);
  } catch (err) {
    weatherDescEl.textContent = tr("weatherFailed");
    console.error("Weather fetch failed", err);
  }
}

// Moon phase via a simple synodic-month approximation (no API needed).
const SYNODIC_MONTH_DAYS = 29.53058867;
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14); // a reference new moon

const MOON_PHASES = [
  { max: 0.03, emoji: "🌑", ja: "新月", en: "New Moon" },
  { max: 0.22, emoji: "🌒", ja: "三日月", en: "Waxing Crescent" },
  { max: 0.28, emoji: "🌓", ja: "上弦の月", en: "First Quarter" },
  { max: 0.47, emoji: "🌔", ja: "十三夜", en: "Waxing Gibbous" },
  { max: 0.53, emoji: "🌕", ja: "満月", en: "Full Moon" },
  { max: 0.72, emoji: "🌖", ja: "十六夜", en: "Waning Gibbous" },
  { max: 0.78, emoji: "🌗", ja: "下弦の月", en: "Last Quarter" },
  { max: 0.97, emoji: "🌘", ja: "二十六夜", en: "Waning Crescent" },
  { max: 1.01, emoji: "🌑", ja: "新月", en: "New Moon" },
];

function getMoonPhase(date) {
  const daysSinceNew = (date.getTime() - KNOWN_NEW_MOON_MS) / 86400000;
  const age = daysSinceNew % SYNODIC_MONTH_DAYS;
  const normalizedAge = age < 0 ? age + SYNODIC_MONTH_DAYS : age;
  const fraction = normalizedAge / SYNODIC_MONTH_DAYS;
  const phase = MOON_PHASES.find((p) => fraction <= p.max) || MOON_PHASES[0];
  return { emoji: phase.emoji, label: phase[LANG], age: normalizedAge };
}

function updateMoonPhase() {
  const { emoji, label, age } = getMoonPhase(new Date());
  weatherMoonEl.innerHTML = `<span class="moon-emoji">${emoji}</span> ${tr("moonLabel", age.toFixed(1), label)}`;
}

function renderWeather(data) {
  const current = describeWeatherCode(data.current.weather_code);
  weatherIconEl.textContent = current.icon;
  weatherTempEl.textContent = `${Math.round(data.current.temperature_2m)}°C`;
  weatherDescEl.textContent = current.label;
  weatherPressureEl.textContent = tr("pressureLabel", Math.round(data.current.pressure_msl));
  weatherExtraEl.textContent = tr(
    "extraLabel",
    Math.round(data.current.relative_humidity_2m),
    data.current.wind_speed_10m.toFixed(1)
  );
  updateMoonPhase();

  const sunrise = data.daily.sunrise[0].split("T")[1];
  const sunset = data.daily.sunset[0].split("T")[1];
  sunTimesEl.textContent = tr("sunTimes", sunrise, sunset);

  const days = data.daily.time.map((dateStr, i) => ({
    date: dateStr,
    code: data.daily.weather_code[i],
    max: data.daily.temperature_2m_max[i],
    min: data.daily.temperature_2m_min[i],
  }));

  const dayFormatter = new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric" });
  weatherForecastEl.innerHTML = days
    .map((day) => {
      const desc = describeWeatherCode(day.code);
      const label = dayFormatter.format(new Date(`${day.date}T12:00:00`));
      return `
        <div class="forecast-day">
          <div class="fd-label">${label}</div>
          <div class="fd-icon">${desc.icon}</div>
          <div class="fd-temps"><span class="max">${Math.round(day.max)}°</span> / <span class="min">${Math.round(day.min)}°</span></div>
        </div>`;
    })
    .join("");

  weatherUpdatedEl.textContent = `${tr("updatedPrefix")}${new Date().toLocaleTimeString(LOCALE)}`;
}

fetchWeather();
setInterval(fetchWeather, 10 * 60_000);

// --- Trübbach, Oberstufenzentrum bus departures (opendata.ch transport API) ---
const busListEl = document.getElementById("busList");
const busUpdatedEl = document.getElementById("busUpdated");
const BUS_STATION_QUERY = "Trübbach, Oberstufenzentrum";
let cachedStationId = null;

async function resolveStationId() {
  if (cachedStationId) return cachedStationId;
  const url = `https://transport.opendata.ch/v1/locations?query=${encodeURIComponent(BUS_STATION_QUERY)}&type=station`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const match = data.stations && data.stations[0];
  if (!match || !match.id) throw new Error("station not found");
  cachedStationId = match.id;
  return cachedStationId;
}

function formatCountdown(minutes) {
  if (minutes <= 0) return tr("departingNow");
  if (minutes < 60) return tr("minutesLater", minutes);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return tr("hoursMinutesLater", h, m);
}

const BUS_DISPLAY_COUNT = 4;

async function fetchBusDepartures() {
  try {
    const id = await resolveStationId();
    const res = await fetch(`https://transport.opendata.ch/v1/stationboard?id=${encodeURIComponent(id)}&limit=${BUS_DISPLAY_COUNT}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderBusDepartures(data.stationboard || []);
  } catch (err) {
    busListEl.innerHTML = `<li class="bus-item bus-item--loading">${tr("busFailed")}</li>`;
    console.error("Bus fetch failed", err);
  }
}

function renderBusDepartures(entries) {
  if (!entries.length) {
    busListEl.innerHTML = `<li class="bus-item bus-item--loading">${tr("busNoDepartures")}</li>`;
    return;
  }
  const now = Date.now();
  busListEl.innerHTML = entries
    .map((entry) => {
      const line = entry.category ? `${entry.category}${entry.number || ""}` : entry.name || "-";
      const dest = entry.to || "-";
      const departureIso = entry.stop && entry.stop.departure;
      const departureDate = departureIso ? new Date(departureIso) : null;
      const timeStr = departureDate
        ? departureDate.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit" })
        : "--:--";
      const minutesUntil = departureDate ? Math.round((departureDate.getTime() - now) / 60000) : null;
      const countdown = minutesUntil !== null ? formatCountdown(minutesUntil) : "";
      const delay = entry.stop && entry.stop.delay;
      const delayStr = delay ? `<span class="bus-delay">${tr("delaySuffix", delay)}</span>` : "";
      return `
        <li class="bus-item">
          <span class="bus-line">${line}</span>
          <span class="bus-dest">${tr("busDest", dest)}</span>
          <span class="bus-countdown">${countdown}</span>
          <span class="bus-time">${tr("busDeparts", timeStr)}${delayStr}</span>
        </li>`;
    })
    .join("");
  busUpdatedEl.textContent = `${tr("updatedPrefix")}${new Date().toLocaleTimeString(LOCALE)}`;
}

fetchBusDepartures();
setInterval(fetchBusDepartures, 30_000);

// --- Nearby live webcam (Balzers, MeteoNews) ---
const WEBCAM_IMAGE_URL = "https://webcams.meteonews.net/webcams/orig/10116.jpg";
const webcamImgEl = document.getElementById("webcamImg");
const webcamFrameEl = document.querySelector(".webcam-frame");
const webcamFallbackEl = document.getElementById("webcamFallback");

function refreshWebcamImage() {
  webcamImgEl.src = `${WEBCAM_IMAGE_URL}?t=${Date.now()}`;
}

webcamImgEl.addEventListener("error", () => {
  webcamFrameEl.hidden = true;
  webcamFallbackEl.hidden = false;
}, { once: true });

refreshWebcamImage();
setInterval(refreshWebcamImage, 60_000);
