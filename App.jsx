import { useState, useEffect } from “react”;

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CONTACT_PHONE = “(555) 012-3456”;
const BUSINESS_NAME = “Open Schedule”;
const SLOT_DURATION = 60; // minutes

const DAYS = [“Sun”, “Mon”, “Tue”, “Wed”, “Thu”, “Fri”, “Sat”];
const FULL_DAYS = [“Sunday”,“Monday”,“Tuesday”,“Wednesday”,“Thursday”,“Friday”,“Saturday”];

const HOURS = Array.from({ length: 24 }, (_, i) => {
const h = i % 12 || 12;
const ampm = i < 12 ? “AM” : “PM”;
return { label: `${h}:00 ${ampm}`, value: i };
});

// ─── STORAGE ─────────────────────────────────────────────────────────────────
const getStorage = () => {
try {
const raw = sessionStorage.getItem(“sched_data”);
return raw ? JSON.parse(raw) : null;
} catch { return null; }
};
const setStorage = (data) => {
try { sessionStorage.setItem(“sched_data”, JSON.stringify(data)); } catch {}
};

const DEFAULT_AVAILABILITY = {
// dayIndex -> array of hour numbers available
1: [9, 10, 11, 14, 15, 16],
2: [9, 10, 11, 14, 15, 16],
3: [9, 10, 11],
4: [9, 10, 11, 14, 15, 16],
5: [9, 10],
};

const initData = () => {
const stored = getStorage();
if (stored) return stored;
return {
availability: DEFAULT_AVAILABILITY, // dayIndex -> [hours]
bookings: {}, // “YYYY-MM-DD_HH” -> true
};
};

// ─── UTILS ───────────────────────────────────────────────────────────────────
const getWeekStart = (date) => {
const d = new Date(date);
d.setHours(0, 0, 0, 0);
d.setDate(d.getDate() - d.getDay());
return d;
};

const addDays = (date, n) => {
const d = new Date(date);
d.setDate(d.getDate() + n);
return d;
};

const formatDate = (date) => {
return date.toISOString().split(“T”)[0];
};

const slotKey = (dateStr, hour) => `${dateStr}_${String(hour).padStart(2, "0")}`;

const formatHour = (h) => {
const hh = h % 12 || 12;
return `${hh}:00 ${h < 12 ? "AM" : "PM"}`;
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = `
@import url(‘https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap’);

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
–ink: #1a1a2e;
–ink2: #2d2d4e;
–cream: #faf7f2;
–warm: #f5ede0;
–accent: #c8783a;
–accent2: #e8a96a;
–muted: #9b9bb0;
–open: #3d9e6e;
–open-bg: #edf7f2;
–booked: #e05c5c;
–booked-bg: #fdf0f0;
–border: rgba(26,26,46,0.1);
–shadow: 0 4px 24px rgba(26,26,46,0.08);
–shadow-lg: 0 12px 48px rgba(26,26,46,0.14);
–radius: 14px;
–radius-sm: 8px;
}

body {
font-family: ‘DM Sans’, sans-serif;
background: var(–cream);
color: var(–ink);
min-height: 100vh;
-webkit-font-smoothing: antialiased;
}

.app { min-height: 100vh; display: flex; flex-direction: column; }

/* ── HEADER ── */
.header {
background: var(–ink);
color: white;
padding: 0 32px;
display: flex;
align-items: center;
justify-content: space-between;
height: 64px;
position: sticky;
top: 0;
z-index: 100;
}
.header-brand {
font-family: ‘DM Serif Display’, serif;
font-size: 1.4rem;
letter-spacing: -0.01em;
}
.header-brand span { color: var(–accent2); font-style: italic; }
.header-nav { display: flex; gap: 8px; }
.nav-btn {
padding: 7px 16px;
border-radius: 100px;
border: 1.5px solid rgba(255,255,255,0.2);
background: transparent;
color: rgba(255,255,255,0.75);
font-family: ‘DM Sans’, sans-serif;
font-size: 0.82rem;
font-weight: 500;
cursor: pointer;
transition: all 0.18s;
letter-spacing: 0.01em;
}
.nav-btn:hover { background: rgba(255,255,255,0.1); color: white; border-color: rgba(255,255,255,0.4); }
.nav-btn.active { background: var(–accent); color: white; border-color: var(–accent); }

/* ── MAIN ── */
.main { flex: 1; padding: 40px 32px; max-width: 1100px; margin: 0 auto; width: 100%; }

/* ── PAGE TITLE ── */
.page-title {
font-family: ‘DM Serif Display’, serif;
font-size: 2rem;
color: var(–ink);
margin-bottom: 4px;
letter-spacing: -0.02em;
}
.page-subtitle { color: var(–muted); font-size: 0.9rem; margin-bottom: 32px; }

/* ── WEEK NAV ── */
.week-nav {
display: flex;
align-items: center;
gap: 16px;
margin-bottom: 24px;
flex-wrap: wrap;
}
.week-label {
font-family: ‘DM Serif Display’, serif;
font-size: 1.1rem;
color: var(–ink);
min-width: 220px;
}
.icon-btn {
width: 36px; height: 36px;
border-radius: 50%;
border: 1.5px solid var(–border);
background: white;
cursor: pointer;
display: flex; align-items: center; justify-content: center;
font-size: 0.9rem;
transition: all 0.15s;
color: var(–ink);
box-shadow: var(–shadow);
}
.icon-btn:hover { background: var(–ink); color: white; border-color: var(–ink); }
.today-btn {
padding: 7px 14px;
border-radius: 100px;
border: 1.5px solid var(–border);
background: white;
color: var(–ink);
font-family: ‘DM Sans’, sans-serif;
font-size: 0.8rem;
font-weight: 500;
cursor: pointer;
transition: all 0.15s;
box-shadow: var(–shadow);
}
.today-btn:hover { background: var(–ink); color: white; border-color: var(–ink); }

/* ── CALENDAR GRID ── */
.cal-grid {
display: grid;
grid-template-columns: 60px repeat(7, 1fr);
border-radius: var(–radius);
overflow: hidden;
box-shadow: var(–shadow-lg);
background: white;
border: 1px solid var(–border);
}

.cal-header-cell {
background: var(–ink);
color: white;
text-align: center;
padding: 14px 6px;
font-size: 0.78rem;
font-weight: 500;
letter-spacing: 0.04em;
text-transform: uppercase;
}
.cal-header-cell.time-col { background: var(–ink2); }
.cal-header-cell .day-num {
display: block;
font-family: ‘DM Serif Display’, serif;
font-size: 1.3rem;
font-weight: 400;
letter-spacing: 0;
line-height: 1.1;
margin-top: 2px;
}
.cal-header-cell.today-col { background: var(–accent); }

.cal-time-cell {
padding: 0 8px;
font-size: 0.7rem;
color: var(–muted);
text-align: right;
background: #f8f8fc;
border-right: 1px solid var(–border);
display: flex;
align-items: flex-start;
justify-content: flex-end;
padding-top: 4px;
min-height: 52px;
border-bottom: 1px solid var(–border);
}

.cal-slot {
min-height: 52px;
border-bottom: 1px solid var(–border);
border-right: 1px solid var(–border);
display: flex;
align-items: center;
justify-content: center;
position: relative;
transition: background 0.12s;
}
.cal-slot:last-child { border-right: none; }
.cal-slot.available {
cursor: pointer;
background: var(–open-bg);
}
.cal-slot.available:hover { background: #d6f0e5; }
.cal-slot.booked {
background: var(–booked-bg);
cursor: not-allowed;
}
.cal-slot.past { opacity: 0.35; cursor: not-allowed; }
.cal-slot.today-col { background: rgba(200,120,58,0.04); }
.cal-slot.available.today-col { background: rgba(61,158,110,0.12); }

.slot-pill {
padding: 3px 10px;
border-radius: 100px;
font-size: 0.7rem;
font-weight: 600;
letter-spacing: 0.02em;
pointer-events: none;
}
.slot-pill.open { background: var(–open); color: white; }
.slot-pill.taken { background: var(–booked); color: white; }

/* ── LEGEND ── */
.legend {
display: flex;
gap: 20px;
margin-top: 16px;
flex-wrap: wrap;
}
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: var(–muted); }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; }
.legend-dot.open { background: var(–open); }
.legend-dot.booked { background: var(–booked); }
.legend-dot.none { background: var(–border); border: 1.5px solid #ccc; }

/* ── MODAL OVERLAY ── */
.overlay {
position: fixed;
inset: 0;
background: rgba(26,26,46,0.5);
backdrop-filter: blur(4px);
z-index: 200;
display: flex;
align-items: center;
justify-content: center;
padding: 20px;
animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal {
background: white;
border-radius: 20px;
padding: 36px;
width: 100%;
max-width: 420px;
box-shadow: var(–shadow-lg);
animation: slideUp 0.25s cubic-bezier(0.34,1.2,0.64,1);
position: relative;
}
@keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.modal-close {
position: absolute;
top: 16px; right: 16px;
width: 32px; height: 32px;
border-radius: 50%;
border: 1.5px solid var(–border);
background: white;
cursor: pointer;
font-size: 1rem;
display: flex; align-items: center; justify-content: center;
color: var(–muted);
transition: all 0.15s;
}
.modal-close:hover { background: var(–ink); color: white; border-color: var(–ink); }

.modal-eyebrow {
font-size: 0.72rem;
font-weight: 600;
letter-spacing: 0.08em;
text-transform: uppercase;
color: var(–accent);
margin-bottom: 6px;
}
.modal-title {
font-family: ‘DM Serif Display’, serif;
font-size: 1.6rem;
color: var(–ink);
margin-bottom: 4px;
line-height: 1.2;
}
.modal-date { color: var(–muted); font-size: 0.88rem; margin-bottom: 28px; }

.slot-info-row {
display: flex;
align-items: center;
gap: 12px;
background: var(–warm);
border-radius: var(–radius-sm);
padding: 14px 16px;
margin-bottom: 24px;
}
.slot-icon { font-size: 1.4rem; }
.slot-info-label { font-size: 0.78rem; color: var(–muted); }
.slot-info-value { font-weight: 600; font-size: 0.95rem; color: var(–ink); }

.modal-note {
font-size: 0.82rem;
color: var(–muted);
line-height: 1.6;
background: #f8f8fc;
border-radius: var(–radius-sm);
padding: 12px 14px;
margin-bottom: 24px;
}
.modal-note strong { color: var(–ink); }

.btn-primary {
width: 100%;
padding: 14px;
border-radius: 100px;
border: none;
background: var(–ink);
color: white;
font-family: ‘DM Sans’, sans-serif;
font-size: 0.95rem;
font-weight: 600;
cursor: pointer;
transition: all 0.18s;
letter-spacing: 0.01em;
}
.btn-primary:hover { background: var(–accent); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(200,120,58,0.3); }
.btn-secondary {
width: 100%;
padding: 12px;
border-radius: 100px;
border: 1.5px solid var(–border);
background: white;
color: var(–ink);
font-family: ‘DM Sans’, sans-serif;
font-size: 0.88rem;
font-weight: 500;
cursor: pointer;
transition: all 0.15s;
margin-top: 10px;
}
.btn-secondary:hover { border-color: var(–ink); }

/* ── CONFIRMATION ── */
.confirm-screen {
text-align: center;
padding: 8px 0;
}
.confirm-icon { font-size: 3.5rem; margin-bottom: 16px; }
.confirm-title {
font-family: ‘DM Serif Display’, serif;
font-size: 1.8rem;
color: var(–ink);
margin-bottom: 6px;
}
.confirm-sub { color: var(–muted); font-size: 0.88rem; margin-bottom: 28px; }
.confirm-slot-card {
background: var(–warm);
border-radius: var(–radius);
padding: 20px;
margin-bottom: 24px;
text-align: left;
}
.confirm-slot-date { font-size: 0.8rem; color: var(–muted); margin-bottom: 4px; }
.confirm-slot-time { font-family: ‘DM Serif Display’, serif; font-size: 1.4rem; color: var(–ink); }

.phone-card {
background: var(–ink);
color: white;
border-radius: var(–radius);
padding: 24px 20px;
margin-bottom: 12px;
text-align: center;
}
.phone-card-label { font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 6px; }
.phone-card-number { font-family: ‘DM Serif Display’, serif; font-size: 2rem; letter-spacing: 0.02em; color: white; margin-bottom: 4px; }
.phone-card-sub { font-size: 0.78rem; color: rgba(255,255,255,0.5); line-height: 1.5; }

/* ── ADMIN ── */
.admin-grid {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 32px;
}
@media (max-width: 700px) { .admin-grid { grid-template-columns: 1fr; } }

.admin-card {
background: white;
border-radius: var(–radius);
padding: 28px;
box-shadow: var(–shadow);
border: 1px solid var(–border);
}
.admin-card-title {
font-family: ‘DM Serif Display’, serif;
font-size: 1.15rem;
margin-bottom: 6px;
}
.admin-card-sub { font-size: 0.8rem; color: var(–muted); margin-bottom: 20px; line-height: 1.5; }

.day-row {
display: flex;
align-items: center;
gap: 12px;
padding: 10px 0;
border-bottom: 1px solid var(–border);
}
.day-row:last-child { border-bottom: none; }
.day-name { font-weight: 600; font-size: 0.85rem; width: 36px; }
.day-toggle {
width: 40px; height: 22px;
border-radius: 100px;
border: none;
cursor: pointer;
position: relative;
transition: background 0.2s;
flex-shrink: 0;
}
.day-toggle.on { background: var(–open); }
.day-toggle.off { background: #d0d0dc; }
.day-toggle-knob {
position: absolute;
top: 3px;
width: 16px; height: 16px;
border-radius: 50%;
background: white;
transition: left 0.2s;
box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}
.day-toggle.on .day-toggle-knob { left: 21px; }
.day-toggle.off .day-toggle-knob { left: 3px; }

.hour-chips {
display: flex;
flex-wrap: wrap;
gap: 6px;
flex: 1;
}
.hour-chip {
padding: 3px 9px;
border-radius: 100px;
border: 1.5px solid var(–border);
font-size: 0.7rem;
font-weight: 500;
cursor: pointer;
transition: all 0.15s;
color: var(–muted);
background: white;
}
.hour-chip.selected { background: var(–ink); color: white; border-color: var(–ink); }
.hour-chip:hover:not(.selected) { border-color: var(–ink); color: var(–ink); }

.admin-bookings-list { display: flex; flex-direction: column; gap: 10px; }
.booking-item {
display: flex;
align-items: center;
justify-content: space-between;
padding: 12px 14px;
background: var(–open-bg);
border-radius: var(–radius-sm);
font-size: 0.84rem;
}
.booking-item .b-date { font-weight: 600; color: var(–ink); }
.booking-item .b-time { color: var(–muted); font-size: 0.78rem; }
.booking-item .b-cancel {
padding: 4px 10px;
border-radius: 100px;
border: 1.5px solid var(–booked);
background: white;
color: var(–booked);
font-size: 0.72rem;
font-weight: 600;
cursor: pointer;
transition: all 0.15s;
}
.booking-item .b-cancel:hover { background: var(–booked); color: white; }

.empty-state { text-align: center; color: var(–muted); font-size: 0.85rem; padding: 32px 0; }
.empty-state .es-icon { font-size: 2rem; margin-bottom: 8px; }

.save-banner {
position: fixed;
bottom: 24px;
left: 50%;
transform: translateX(-50%);
background: var(–open);
color: white;
padding: 12px 28px;
border-radius: 100px;
font-size: 0.88rem;
font-weight: 600;
box-shadow: 0 8px 24px rgba(61,158,110,0.35);
animation: popUp 0.25s cubic-bezier(0.34,1.2,0.64,1);
z-index: 300;
}
@keyframes popUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }

.hours-quick { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.q-btn {
padding: 4px 10px;
border-radius: 100px;
border: 1.5px solid var(–border);
background: white;
font-size: 0.72rem;
cursor: pointer;
color: var(–muted);
transition: all 0.12s;
}
.q-btn:hover { border-color: var(–accent); color: var(–accent); }
`;

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
const [view, setView] = useState(“user”); // “user” | “admin”
const [data, setData] = useState(initData);
const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
const [modal, setModal] = useState(null); // { dateStr, hour, dayLabel }
const [confirmed, setConfirmed] = useState(null); // { dateStr, hour }
const [saved, setSaved] = useState(false);

useEffect(() => {
setStorage(data);
}, [data]);

const today = new Date();
today.setHours(0, 0, 0, 0);
const todayStr = formatDate(today);

const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

const prevWeek = () => setWeekStart(d => addDays(d, -7));
const nextWeek = () => setWeekStart(d => addDays(d, 7));
const goToday = () => setWeekStart(getWeekStart(new Date()));

const weekLabel = (() => {
const end = addDays(weekStart, 6);
const opts = { month: “short”, day: “numeric” };
return `${weekStart.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
})();

// ── Slot helpers ──
const isAvailable = (dayIndex, hour) => {
const avail = data.availability[dayIndex] || [];
return avail.includes(hour);
};
const isBooked = (dateStr, hour) => !!data.bookings[slotKey(dateStr, hour)];
const isPast = (dateStr, hour) => {
const slotDate = new Date(`${dateStr}T${String(hour).padStart(2,"0")}:00`);
return slotDate < new Date();
};

const bookSlot = (dateStr, hour) => {
const key = slotKey(dateStr, hour);
setData(d => ({ …d, bookings: { …d.bookings, [key]: true } }));
setModal(null);
setConfirmed({ dateStr, hour });
};

const cancelBooking = (dateStr, hour) => {
const key = slotKey(dateStr, hour);
setData(d => {
const b = { …d.bookings };
delete b[key];
return { …d, bookings: b };
});
};

// ── Admin: toggle hour for a day ──
const toggleHour = (dayIndex, hour) => {
setData(d => {
const avail = { …d.availability };
const arr = […(avail[dayIndex] || [])];
const idx = arr.indexOf(hour);
if (idx >= 0) arr.splice(idx, 1); else arr.push(hour);
avail[dayIndex] = arr.sort((a, b) => a - b);
return { …d, availability: avail };
});
};

const toggleDay = (dayIndex) => {
setData(d => {
const avail = { …d.availability };
if (avail[dayIndex]?.length > 0) {
avail[dayIndex] = [];
} else {
avail[dayIndex] = [9, 10, 11, 14, 15, 16];
}
return { …d, availability: avail };
});
};

const setQuickHours = (dayIndex, preset) => {
const presets = {
morning: [8, 9, 10, 11],
afternoon: [12, 13, 14, 15, 16, 17],
evening: [17, 18, 19, 20],
all: [8,9,10,11,12,13,14,15,16,17,18,19],
none: [],
};
setData(d => {
const avail = { …d.availability };
avail[dayIndex] = presets[preset];
return { …d, availability: avail };
});
};

const saveAdmin = () => {
setSaved(true);
setTimeout(() => setSaved(false), 2500);
};

// ── Collect bookings for admin view ──
const allBookings = Object.keys(data.bookings).map(k => {
const [dateStr, hStr] = k.split(”_”);
return { dateStr, hour: parseInt(hStr), key: k };
}).sort((a, b) => a.dateStr.localeCompare(b.dateStr) || a.hour - b.hour);

const displayHours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am-8pm

return (
<>
<style>{styles}</style>
<div className="app">
{/* HEADER */}
<header className="header">
<div className="header-brand">{BUSINESS_NAME} <span>.</span></div>
<nav className="header-nav">
<button className={`nav-btn ${view === "user" ? "active" : ""}`} onClick={() => setView(“user”)}>
Book a Slot
</button>
<button className={`nav-btn ${view === "admin" ? "active" : ""}`} onClick={() => setView(“admin”)}>
Admin
</button>
</nav>
</header>

```
    <main className="main">
      {view === "user" ? (
        <>
          <div className="page-title">Pick a Time</div>
          <div className="page-subtitle">Select any open slot below to reserve it — no account needed.</div>

          {/* Week nav */}
          <div className="week-nav">
            <button className="icon-btn" onClick={prevWeek}>‹</button>
            <button className="icon-btn" onClick={nextWeek}>›</button>
            <span className="week-label">{weekLabel}</span>
            <button className="today-btn" onClick={goToday}>Today</button>
          </div>

          {/* Calendar */}
          <div className="cal-grid">
            {/* Headers */}
            <div className="cal-header-cell time-col" />
            {weekDates.map((d, i) => {
              const isToday = formatDate(d) === todayStr;
              return (
                <div key={i} className={`cal-header-cell ${isToday ? "today-col" : ""}`}>
                  {DAYS[d.getDay()]}
                  <span className="day-num">{d.getDate()}</span>
                </div>
              );
            })}

            {/* Rows */}
            {displayHours.map(hour => (
              <>
                <div key={`t${hour}`} className="cal-time-cell">{formatHour(hour)}</div>
                {weekDates.map((d, di) => {
                  const dateStr = formatDate(d);
                  const dayIndex = d.getDay();
                  const avail = isAvailable(dayIndex, hour);
                  const booked = isBooked(dateStr, hour);
                  const past = isPast(dateStr, hour);
                  const isToday = dateStr === todayStr;
                  let cls = "cal-slot";
                  if (isToday) cls += " today-col";
                  if (past) cls += " past";
                  else if (booked) cls += " booked";
                  else if (avail) cls += " available";

                  return (
                    <div
                      key={`${dateStr}_${hour}`}
                      className={cls}
                      onClick={() => {
                        if (avail && !booked && !past) {
                          setModal({
                            dateStr,
                            hour,
                            dayLabel: d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
                          });
                        }
                      }}
                    >
                      {avail && !past && (
                        <span className={`slot-pill ${booked ? "taken" : "open"}`}>
                          {booked ? "Taken" : "Open"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>

          <div className="legend">
            <div className="legend-item"><div className="legend-dot open" /> Open — click to book</div>
            <div className="legend-item"><div className="legend-dot booked" /> Already taken</div>
            <div className="legend-item"><div className="legend-dot none" /> Unavailable</div>
          </div>
        </>
      ) : (
        <>
          <div className="page-title">Admin Panel</div>
          <div className="page-subtitle">Set your weekly availability and manage bookings.</div>

          <div className="admin-grid">
            {/* Availability */}
            <div className="admin-card">
              <div className="admin-card-title">Weekly Availability</div>
              <div className="admin-card-sub">Toggle days on/off and choose which hours you're open. This repeats every week.</div>

              {[0,1,2,3,4,5,6].map(dayIndex => {
                const hours = data.availability[dayIndex] || [];
                const on = hours.length > 0;
                return (
                  <div key={dayIndex}>
                    <div className="day-row">
                      <span className="day-name">{DAYS[dayIndex]}</span>
                      <button className={`day-toggle ${on ? "on" : "off"}`} onClick={() => toggleDay(dayIndex)}>
                        <span className="day-toggle-knob" />
                      </button>
                      {on && (
                        <div className="hour-chips">
                          {HOURS.filter(h => h.value >= 7 && h.value <= 19).map(h => (
                            <button
                              key={h.value}
                              className={`hour-chip ${hours.includes(h.value) ? "selected" : ""}`}
                              onClick={() => toggleHour(dayIndex, h.value)}
                            >
                              {h.label.replace(":00 ", "")}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {on && (
                      <div className="hours-quick">
                        <span style={{fontSize:"0.7rem",color:"var(--muted)"}}>Quick:</span>
                        {["morning","afternoon","evening","all","none"].map(p => (
                          <button key={p} className="q-btn" onClick={() => setQuickHours(dayIndex, p)}>{p}</button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div style={{marginTop:24}}>
                <button className="btn-primary" onClick={saveAdmin}>Save Availability</button>
              </div>
            </div>

            {/* Bookings */}
            <div className="admin-card">
              <div className="admin-card-title">Upcoming Bookings</div>
              <div className="admin-card-sub">These slots have been reserved. Cancel a booking to reopen it.</div>

              <div className="admin-bookings-list">
                {allBookings.length === 0 ? (
                  <div className="empty-state">
                    <div className="es-icon">📭</div>
                    <div>No bookings yet.</div>
                  </div>
                ) : allBookings.map(b => {
                  const d = new Date(`${b.dateStr}T12:00:00`);
                  const dateLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  return (
                    <div key={b.key} className="booking-item">
                      <div>
                        <div className="b-date">{dateLabel}</div>
                        <div className="b-time">{formatHour(b.hour)}</div>
                      </div>
                      <button className="b-cancel" onClick={() => cancelBooking(b.dateStr, b.hour)}>Cancel</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  </div>

  {/* ── BOOKING MODAL ── */}
  {modal && (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
      <div className="modal">
        <button className="modal-close" onClick={() => setModal(null)}>✕</button>
        <div className="modal-eyebrow">Reserve This Slot</div>
        <div className="modal-title">You're one tap away</div>
        <div className="modal-date">{modal.dayLabel}</div>

        <div className="slot-info-row">
          <span className="slot-icon">🕐</span>
          <div>
            <div className="slot-info-label">Time slot</div>
            <div className="slot-info-value">{formatHour(modal.hour)} – {formatHour(modal.hour + 1)}</div>
          </div>
        </div>

        <div className="modal-note">
          After confirming, you'll receive a <strong>phone number to text</strong> with your details.
          No account or personal info needed here — just grab the slot!
        </div>

        <button className="btn-primary" onClick={() => bookSlot(modal.dateStr, modal.hour)}>
          Confirm Reservation
        </button>
        <button className="btn-secondary" onClick={() => setModal(null)}>Never mind</button>
      </div>
    </div>
  )}

  {/* ── CONFIRMATION MODAL ── */}
  {confirmed && (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && setConfirmed(null)}>
      <div className="modal">
        <button className="modal-close" onClick={() => setConfirmed(null)}>✕</button>
        <div className="confirm-screen">
          <div className="confirm-icon">✅</div>
          <div className="confirm-title">Slot Reserved!</div>
          <div className="confirm-sub">Your time is held. Now just send a quick text.</div>

          <div className="confirm-slot-card">
            <div className="confirm-slot-date">
              {new Date(`${confirmed.dateStr}T12:00:00`).toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric"
              })}
            </div>
            <div className="confirm-slot-time">
              {formatHour(confirmed.hour)} – {formatHour(confirmed.hour + 1)}
            </div>
          </div>

          <div className="phone-card">
            <div className="phone-card-label">Text this number</div>
            <div className="phone-card-number">{CONTACT_PHONE}</div>
            <div className="phone-card-sub">
              Include your name, what you need, and your reserved time in the message.
              We'll confirm and get you sorted!
            </div>
          </div>

          <button className="btn-secondary" style={{marginTop:0}} onClick={() => setConfirmed(null)}>
            Back to Calendar
          </button>
        </div>
      </div>
    </div>
  )}

  {saved && <div className="save-banner">✓ Availability saved!</div>}
</>
```

);
}