"use client";

import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import styles from "./WallCalendar.module.css";

type DateRange = {
  start: string | null;
  end: string | null;
};

type DayCell = {
  iso: string;
  date: Date;
  dayNumber: number;
  inMonth: boolean;
};

type MonthTheme = {
  name: string;
  accent: string;
  accentSoft: string;
  panel: string;
  image: string;
  specialty: string;
  climate: string;
  indicator: string;
};

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const IMAGES = [
  "/season-winter.svg",
  "/season-spring.svg",
  "/season-summer.svg",
  "/season-autumn.svg",
];

const MONTHS: MonthTheme[] = [
  { name: "JANUARY", accent: "#c9a46a", accentSoft: "#f2e6d3", panel: "#22283a", image: IMAGES[3], specialty: "Quiet reset", climate: "Cool light and crisp starts", indicator: "Low haze" },
  { name: "FEBRUARY", accent: "#c98a7c", accentSoft: "#f3dfda", panel: "#2c2432", image: IMAGES[0], specialty: "Soft bloom", climate: "Gentle warmth and longer afternoons", indicator: "First bloom" },
  { name: "MARCH", accent: "#8ea26b", accentSoft: "#e5eddc", panel: "#213027", image: IMAGES[1], specialty: "Spring edge", climate: "Fresh air and greener tones", indicator: "Fresh air" },
  { name: "APRIL", accent: "#d7a36d", accentSoft: "#f5e5d6", panel: "#23293a", image: IMAGES[1], specialty: "Clear skies", climate: "Sunny days with balanced warmth", indicator: "Clear sun" },
  { name: "MAY", accent: "#d89c59", accentSoft: "#f7e3ce", panel: "#2b2227", image: IMAGES[2], specialty: "Dry gold", climate: "Heat building across the month", indicator: "Warm rise" },
  { name: "JUNE", accent: "#7d90c7", accentSoft: "#dfe5f6", panel: "#21283a", image: IMAGES[3], specialty: "Monsoon edge", climate: "Clouds gather with cooler blues", indicator: "Cloud front" },
  { name: "JULY", accent: "#6d86c9", accentSoft: "#dbe3f8", panel: "#1f2637", image: IMAGES[3], specialty: "Rain wash", climate: "Dense greens and diffused daylight", indicator: "Rainfall" },
  { name: "AUGUST", accent: "#5f9f98", accentSoft: "#dcedea", panel: "#1f2c2e", image: IMAGES[0], specialty: "Humid calm", climate: "Heavy air with lush texture", indicator: "Dense air" },
  { name: "SEPTEMBER", accent: "#b89b62", accentSoft: "#efe5d5", panel: "#28262d", image: IMAGES[2], specialty: "Golden shift", climate: "Balanced heat and drier evenings", indicator: "Dry light" },
  { name: "OCTOBER", accent: "#b97b58", accentSoft: "#f1ddd3", panel: "#2d2421", image: IMAGES[2], specialty: "Amber fall", climate: "Warm color with gentler sun", indicator: "Amber tone" },
  { name: "NOVEMBER", accent: "#8a78b4", accentSoft: "#e5dff1", panel: "#262431", image: IMAGES[0], specialty: "Cool hush", climate: "Muted skies and calm mornings", indicator: "Still air" },
  { name: "DECEMBER", accent: "#738cb1", accentSoft: "#dfe7f0", panel: "#212735", image: IMAGES[3], specialty: "Winter blue", climate: "Short days and clean blue light", indicator: "Blue hour" },
];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function toIso(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromIso(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function buildMonthGrid(viewDate: Date) {
  const monthStart = startOfMonth(viewDate);
  const gridStart = new Date(monthStart);
  gridStart.setDate(1 - monthStart.getDay());

  return Array.from({ length: 35 }, (_, index) => {
    const date = addDays(gridStart, index);
    return {
      iso: toIso(date),
      date,
      dayNumber: date.getDate(),
      inMonth: date.getMonth() === viewDate.getMonth(),
    } satisfies DayCell;
  });
}

function formatRange(range: DateRange) {
  if (!range.start || !range.end) {
    return "Select two dates";
  }

  const start = fromIso(range.start);
  const end = fromIso(range.end);
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

export function WallCalendar() {
  const [viewDate, setViewDate] = useState(() => startOfMonth(new Date()));
  const [range, setRange] = useState<DateRange>({ start: null, end: null });

  const theme = MONTHS[viewDate.getMonth()];
  const days = useMemo(() => buildMonthGrid(viewDate), [viewDate]);

  const rangeBounds = useMemo(() => {
    if (!range.start) {
      return null;
    }

    const start = fromIso(range.start);
    const end = range.end ? fromIso(range.end) : start;
    return start <= end ? { start, end } : { start: end, end: start };
  }, [range]);

  function selectDay(iso: string) {
    if (!range.start || range.end) {
      setRange({ start: iso, end: null });
      return;
    }

    if (iso < range.start) {
      setRange({ start: iso, end: range.start });
      return;
    }

    setRange({ start: range.start, end: iso });
  }

  return (
    <main
      className={styles.page}
      style={{
        "--accent": theme.accent,
        "--accent-soft": theme.accentSoft,
        "--panel": theme.panel,
      } as CSSProperties}
    >
      <section className={styles.scene}>
        <div className={styles.stand} aria-hidden="true" />
        <div className={styles.calendar}>
          <div className={styles.binding} aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => (
              <span key={index} className={styles.ring} />
            ))}
          </div>

          <div className={styles.card}>
            <div className={styles.imagePanel}>
              <Image
                src={theme.image}
                alt={`${theme.name} placeholder artwork`}
                fill
                priority
                className={styles.heroImage}
              />
              <div className={styles.imageOverlay} />
              <div className={styles.overlayAccent} aria-hidden="true" />
              <div className={styles.overlayYear}>{viewDate.getFullYear()}</div>
              <div className={styles.overlayMonth}>
                <span>{`${viewDate.getMonth() + 1}`.padStart(2, "0")}</span>
                <strong>{theme.name}</strong>
              </div>
            </div>

            <div className={styles.calendarPanel}>
              <div className={styles.cutTriangle} aria-hidden="true" />
              <div className={styles.headerRow}>
                <div>
                  <span className={styles.kicker}>{theme.specialty}</span>
                  <h1>{theme.climate}</h1>
                </div>
                <div className={styles.controls}>
                  <button type="button" className={`${styles.navButton} ${styles.navLeft}`} onClick={() => setViewDate((current) => addMonths(current, -1))} aria-label="Previous month">
                    {"<"}
                  </button>
                  <button type="button" className={`${styles.navButton} ${styles.navRight}`} onClick={() => setViewDate((current) => addMonths(current, 1))} aria-label="Next month">
                    {">"}
                  </button>
                </div>
              </div>

              <div className={styles.selectionLine}>
                <span className={styles.selectionLabel}>Selected</span>
                <strong>{formatRange(range)}</strong>
              </div>

              <div className={styles.weekdays}>
                {WEEKDAYS.map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>

              <div className={styles.grid}>
                {days.map((day) => {
                  const inRange = rangeBounds
                    ? day.date >= rangeBounds.start && day.date <= rangeBounds.end
                    : false;
                  const isStart = range.start === day.iso;
                  const isEnd = range.end === day.iso;

                  return (
                    <button
                      key={day.iso}
                      type="button"
                      onClick={() => selectDay(day.iso)}
                      className={[
                        styles.dayCell,
                        !day.inMonth ? styles.outsideMonth : "",
                        inRange ? styles.inRange : "",
                        isStart ? styles.rangeEdge : "",
                        isEnd ? styles.rangeEdge : "",
                      ].join(" ")}
                    >
                      {`${day.dayNumber}`.padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
