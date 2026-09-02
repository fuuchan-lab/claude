if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((err) => console.error("SW registration failed", err));
  });
}

const ZURICH_TZ = "Europe/Zurich";

const digitalTimeEl = document.getElementById("digitalTime");
const digitalDateEl = document.getElementById("digitalDate");
const holidayLabelEl = document.getElementById("holidayLabel");

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: ZURICH_TZ,
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
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
  const setKey = (date, name) => {
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    map[`${mm}-${dd}`] = name;
  };
  const setOffset = (base, days, name) => {
    const d = new Date(base.getTime());
    d.setUTCDate(d.getUTCDate() + days);
    setKey(d, name);
  };

  const easter = computeEasterSunday(year);
  setKey(new Date(Date.UTC(year, 0, 1)), "元日");
  setKey(new Date(Date.UTC(year, 0, 2)), "ベルヒトルトの日");
  setOffset(easter, -2, "聖金曜日");
  setOffset(easter, 1, "イースターマンデー");
  setOffset(easter, 39, "キリスト昇天祭");
  setOffset(easter, 50, "聖霊降臨祭の月曜日");
  setKey(new Date(Date.UTC(year, 7, 1)), "スイス建国記念日");

  // Bettag: third Sunday of September, coordinated nationwide.
  const sep1Weekday = new Date(Date.UTC(year, 8, 1)).getUTCDay();
  const firstSunday = 1 + ((7 - sep1Weekday) % 7);
  setKey(new Date(Date.UTC(year, 8, firstSunday + 14)), "連邦感謝祈祷の日");

  setKey(new Date(Date.UTC(year, 10, 1)), "諸聖人の日");
  setKey(new Date(Date.UTC(year, 11, 25)), "クリスマス");
  setKey(new Date(Date.UTC(year, 11, 26)), "聖ステファノの日");
  return map;
}

const holidayMapByYear = {};

function getHolidayName(year, month, day) {
  if (!holidayMapByYear[year]) holidayMapByYear[year] = buildHolidayMap(year);
  return holidayMapByYear[year][`${month}-${day}`];
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
    fxHeadlineEl.textContent = "レート取得に失敗しました";
    console.error("FX fetch failed", err);
  }
}

function renderFxRates(data) {
  const rate = data.rates.JPY;
  if (typeof rate !== "number") return;
  currentChfToJpyRate = rate;
  fxHeadlineEl.textContent = `1 CHF = ${rate.toFixed(2)} 円`;
  const now = new Date();
  fxUpdatedEl.textContent = `最終更新: ${now.toLocaleTimeString("ja-JP")} (レート基準日: ${data.date})`;
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
  0: { icon: "☀️", label: "快晴" },
  1: { icon: "🌤️", label: "ほぼ晴れ" },
  2: { icon: "⛅", label: "一部曇り" },
  3: { icon: "☁️", label: "曇り" },
  45: { icon: "🌫️", label: "霧" },
  48: { icon: "🌫️", label: "霧氷を伴う霧" },
  51: { icon: "🌦️", label: "弱い霧雨" },
  53: { icon: "🌦️", label: "霧雨" },
  55: { icon: "🌦️", label: "強い霧雨" },
  56: { icon: "🌧️", label: "着氷性の弱い霧雨" },
  57: { icon: "🌧️", label: "着氷性の霧雨" },
  61: { icon: "🌧️", label: "弱い雨" },
  63: { icon: "🌧️", label: "雨" },
  65: { icon: "🌧️", label: "強い雨" },
  66: { icon: "🌧️", label: "着氷性の弱い雨" },
  67: { icon: "🌧️", label: "着氷性の雨" },
  71: { icon: "🌨️", label: "弱い雪" },
  73: { icon: "🌨️", label: "雪" },
  75: { icon: "❄️", label: "強い雪" },
  77: { icon: "❄️", label: "霧雪" },
  80: { icon: "🌦️", label: "弱いにわか雨" },
  81: { icon: "🌦️", label: "にわか雨" },
  82: { icon: "⛈️", label: "激しいにわか雨" },
  85: { icon: "🌨️", label: "弱いにわか雪" },
  86: { icon: "🌨️", label: "にわか雪" },
  95: { icon: "⛈️", label: "雷雨" },
  96: { icon: "⛈️", label: "雹を伴う雷雨" },
  99: { icon: "⛈️", label: "激しい雹を伴う雷雨" },
};

function describeWeatherCode(code) {
  return WEATHER_CODE_MAP[code] || { icon: "❓", label: "不明" };
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
    weatherDescEl.textContent = "天気情報の取得に失敗しました。しばらくして再試行します。";
    console.error("Weather fetch failed", err);
  }
}

// Moon phase via a simple synodic-month approximation (no API needed).
const SYNODIC_MONTH_DAYS = 29.53058867;
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14); // a reference new moon

const MOON_PHASES = [
  { max: 0.03, emoji: "🌑", label: "新月" },
  { max: 0.22, emoji: "🌒", label: "三日月" },
  { max: 0.28, emoji: "🌓", label: "上弦の月" },
  { max: 0.47, emoji: "🌔", label: "十三夜" },
  { max: 0.53, emoji: "🌕", label: "満月" },
  { max: 0.72, emoji: "🌖", label: "十六夜" },
  { max: 0.78, emoji: "🌗", label: "下弦の月" },
  { max: 0.97, emoji: "🌘", label: "二十六夜" },
  { max: 1.01, emoji: "🌑", label: "新月" },
];

function getMoonPhase(date) {
  const daysSinceNew = (date.getTime() - KNOWN_NEW_MOON_MS) / 86400000;
  const age = daysSinceNew % SYNODIC_MONTH_DAYS;
  const normalizedAge = age < 0 ? age + SYNODIC_MONTH_DAYS : age;
  const fraction = normalizedAge / SYNODIC_MONTH_DAYS;
  const phase = MOON_PHASES.find((p) => fraction <= p.max) || MOON_PHASES[0];
  return { ...phase, age: normalizedAge };
}

function updateMoonPhase() {
  const { emoji, label, age } = getMoonPhase(new Date());
  weatherMoonEl.innerHTML = `<span class="moon-emoji">${emoji}</span> 月齢 ${age.toFixed(1)} (${label})`;
}

function renderWeather(data) {
  const current = describeWeatherCode(data.current.weather_code);
  weatherIconEl.textContent = current.icon;
  weatherTempEl.textContent = `${Math.round(data.current.temperature_2m)}°C`;
  weatherDescEl.textContent = current.label;
  weatherPressureEl.textContent = `気圧: ${Math.round(data.current.pressure_msl)} hPa`;
  weatherExtraEl.textContent = `湿度: ${Math.round(data.current.relative_humidity_2m)}% ・ 風速: ${data.current.wind_speed_10m.toFixed(1)} km/h`;
  updateMoonPhase();

  const sunrise = data.daily.sunrise[0].split("T")[1];
  const sunset = data.daily.sunset[0].split("T")[1];
  sunTimesEl.textContent = `日出 ${sunrise} / 日没 ${sunset}`;

  const days = data.daily.time.map((dateStr, i) => ({
    date: dateStr,
    code: data.daily.weather_code[i],
    max: data.daily.temperature_2m_max[i],
    min: data.daily.temperature_2m_min[i],
  }));

  const dayFormatter = new Intl.DateTimeFormat("ja-JP", { weekday: "short", day: "numeric" });
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

  weatherUpdatedEl.textContent = `最終更新: ${new Date().toLocaleTimeString("ja-JP")}`;
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
  if (minutes <= 0) return "まもなく発車";
  if (minutes < 60) return `${minutes}分後`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}時間${m}分後`;
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
    busListEl.innerHTML = `<li class="bus-item bus-item--loading">バス時刻表の取得に失敗しました。しばらくして再試行します。</li>`;
    console.error("Bus fetch failed", err);
  }
}

function renderBusDepartures(entries) {
  if (!entries.length) {
    busListEl.innerHTML = `<li class="bus-item bus-item--loading">現在予定されている便がありません。</li>`;
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
        ? departureDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
        : "--:--";
      const minutesUntil = departureDate ? Math.round((departureDate.getTime() - now) / 60000) : null;
      const countdown = minutesUntil !== null ? formatCountdown(minutesUntil) : "";
      const delay = entry.stop && entry.stop.delay;
      const delayStr = delay ? `<span class="bus-delay">+${delay}分遅れ</span>` : "";
      return `
        <li class="bus-item">
          <span class="bus-line">${line}</span>
          <span class="bus-dest">${dest} 方面</span>
          <span class="bus-countdown">${countdown}</span>
          <span class="bus-time">${timeStr}発${delayStr}</span>
        </li>`;
    })
    .join("");
  busUpdatedEl.textContent = `最終更新: ${new Date().toLocaleTimeString("ja-JP")}`;
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
