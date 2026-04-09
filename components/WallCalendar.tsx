"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { FiTrash2, FiCheckCircle, FiCircle, FiChevronLeft, FiChevronRight, FiHelpCircle } from "react-icons/fi";
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
};

type NavDirection = "left" | "right";
type ScopeType = "month" | "range";
type PlanPriority = "low" | "medium" | "high";

type PlannerScope = {
  type: ScopeType;
  key: string;
  label: string;
  description: string;
  start: string;
  end: string;
};

type PlanItem = {
  id: string;
  scopeType: ScopeType;
  scopeKey: string;
  title: string;
  notes: string;
  priority: PlanPriority;
  color: string;
  completed: boolean;
  createdAt: string;
};

const STORAGE_KEY = "wall-calendar-plans";
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const IMAGES = ["/season-winter.svg", "/season-spring.svg", "/season-summer.svg", "/season-autumn.svg"];
const PLAN_COLORS = ["#D98C7E", "#C8A95A", "#7FA780", "#6D95C8", "#8F7CC0", "#D18CBE", "#73A8A4", "#C07A5E"];

const MONTHS: MonthTheme[] = [
  { name: "JANUARY", accent: "#c9a46a", accentSoft: "#f2e6d3", panel: "#22283a", image: IMAGES[3], specialty: "Quiet reset", climate: "Cool light and crisp starts" },
  { name: "FEBRUARY", accent: "#c98a7c", accentSoft: "#f3dfda", panel: "#2c2432", image: IMAGES[0], specialty: "Soft bloom", climate: "Gentle warmth and longer afternoons" },
  { name: "MARCH", accent: "#8ea26b", accentSoft: "#e5eddc", panel: "#213027", image: IMAGES[1], specialty: "Spring edge", climate: "Fresh air and greener tones" },
  { name: "APRIL", accent: "#d7a36d", accentSoft: "#f5e5d6", panel: "#23293a", image: IMAGES[1], specialty: "Clear skies", climate: "Sunny days with balanced warmth" },
  { name: "MAY", accent: "#d89c59", accentSoft: "#f7e3ce", panel: "#2b2227", image: IMAGES[2], specialty: "Dry gold", climate: "Heat building across the month" },
  { name: "JUNE", accent: "#7d90c7", accentSoft: "#dfe5f6", panel: "#21283a", image: IMAGES[3], specialty: "Monsoon edge", climate: "Clouds gather with cooler blues" },
  { name: "JULY", accent: "#6d86c9", accentSoft: "#dbe3f8", panel: "#1f2637", image: IMAGES[3], specialty: "Rain wash", climate: "Dense greens and diffused daylight" },
  { name: "AUGUST", accent: "#5f9f98", accentSoft: "#dcedea", panel: "#1f2c2e", image: IMAGES[0], specialty: "Humid calm", climate: "Heavy air with lush texture" },
  { name: "SEPTEMBER", accent: "#b89b62", accentSoft: "#efe5d5", panel: "#28262d", image: IMAGES[2], specialty: "Golden shift", climate: "Balanced heat and drier evenings" },
  { name: "OCTOBER", accent: "#b97b58", accentSoft: "#f1ddd3", panel: "#2d2421", image: IMAGES[2], specialty: "Amber fall", climate: "Warm color with gentler sun" },
  { name: "NOVEMBER", accent: "#8a78b4", accentSoft: "#e5dff1", panel: "#262431", image: IMAGES[0], specialty: "Cool hush", climate: "Muted skies and calm mornings" },
  { name: "DECEMBER", accent: "#738cb1", accentSoft: "#dfe7f0", panel: "#212735", image: IMAGES[3], specialty: "Winter blue", climate: "Short days and clean blue light" },
];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
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

function monthKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

function formatShortDate(value: string) {
  return fromIso(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
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
  if (!range.start) return "Select two dates";
  if (!range.end) return formatShortDate(range.start);
  return `${formatShortDate(range.start)} - ${formatShortDate(range.end)}`;
}

function normalizeRangeStartEnd(viewDate: Date, range: DateRange) {
  if (!range.start) {
    const start = toIso(startOfMonth(viewDate));
    const end = toIso(endOfMonth(viewDate));
    return { start, end };
  }

  const start = range.start;
  const fallbackEnd = toIso(endOfMonth(fromIso(range.start)));
  const end = range.end ?? fallbackEnd;
  return start <= end ? { start, end } : { start: end, end: start };
}

function getScope(viewDate: Date, range: DateRange): PlannerScope {
  const monthStartIso = toIso(startOfMonth(viewDate));
  const monthEndIso = toIso(endOfMonth(viewDate));

  if (!range.start) {
    return {
      type: "month",
      key: monthKeyFromDate(viewDate),
      label: formatMonthLabel(viewDate),
      description: "Monthly planning board",
      start: monthStartIso,
      end: monthEndIso,
    };
  }

  const normalized = normalizeRangeStartEnd(viewDate, range);

  return {
    type: "range",
    key: `${normalized.start}__${normalized.end}`,
    label: range.end ? `${formatShortDate(normalized.start)} - ${formatShortDate(normalized.end)}` : formatShortDate(normalized.start),
    description: range.end
      ? `${Math.round((fromIso(normalized.end).getTime() - fromIso(normalized.start).getTime()) / 86400000) + 1}-day planning window`
      : "Single picked date",
    start: normalized.start,
    end: normalized.end,
  };
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3 ? normalized.split("").map((part) => part + part).join("") : normalized;
  const number = Number.parseInt(value, 16);
  const r = (number >> 16) & 255;
  const g = (number >> 8) & 255;
  const b = number & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizePlan(saved: Omit<PlanItem, "color"> & { color?: string }, index: number): PlanItem {
  return {
    ...saved,
    color: saved.color ?? PLAN_COLORS[index % PLAN_COLORS.length],
  };
}

function getPlanWindow(plan: PlanItem) {
  if (plan.scopeType === "month") {
    const [year, month] = plan.scopeKey.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return { start: toIso(startOfMonth(date)), end: toIso(endOfMonth(date)) };
  }

  const [start, end] = plan.scopeKey.split("__");
  return { start, end: end ?? start };
}

function windowsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart <= bEnd && bStart <= aEnd;
}

function getApplicablePlansForDay(dayIso: string, monthKey: string, plans: PlanItem[]) {
  return plans.filter((plan) => {
    if (plan.scopeType === "month") return plan.scopeKey === monthKey;
    const window = getPlanWindow(plan);
    return windowsOverlap(dayIso, dayIso, window.start, window.end);
  });
}

function getPlansForScope(scope: PlannerScope, plans: PlanItem[]) {
  return plans.filter((plan) => {
    const window = getPlanWindow(plan);
    return windowsOverlap(scope.start, scope.end, window.start, window.end);
  });
}

export function WallCalendar() {
  const [viewDate, setViewDate] = useState(() => startOfMonth(new Date()));
  const [incomingDate, setIncomingDate] = useState<Date | null>(null);
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [navDirection, setNavDirection] = useState<NavDirection>("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [hasLoadedPlans, setHasLoadedPlans] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<PlanPriority>("medium");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setPlans(parsed.map((item, index) => normalizePlan(item, index)));
        }
      }
    } catch {
      setPlans([]);
    } finally {
      setHasLoadedPlans(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedPlans) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  }, [plans, hasLoadedPlans]);

  const rangeBounds = useMemo(() => {
    if (!range.start) return null;
    const endValue = range.end ?? range.start;
    const start = fromIso(range.start);
    const end = fromIso(endValue);
    return start <= end ? { start, end } : { start: end, end: start };
  }, [range]);

  const activeScope = useMemo(() => getScope(viewDate, range), [viewDate, range]);
  const activePlans = useMemo(() => getPlansForScope(activeScope, plans), [plans, activeScope]);
  const monthPlans = useMemo(() => getPlansForScope(getScope(viewDate, { start: null, end: null }), plans), [plans, viewDate]);
  const completedCount = activePlans.filter((plan) => plan.completed).length;

  function selectDay(iso: string) {
    if (isAnimating) return;
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

  function changeMonth(direction: NavDirection) {
    if (isAnimating) return;
    setNavDirection(direction);
    setIncomingDate(addMonths(viewDate, direction === "right" ? 1 : -1));
    setIsAnimating(true);
  }

  function finishFlip() {
    if (!incomingDate) return;
    setViewDate(incomingDate);
    setIncomingDate(null);
    setIsAnimating(false);
  }

  function handleCreatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanNotes = notes.trim();
    if (!cleanTitle) return;

    const nextPlan: PlanItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      scopeType: activeScope.type,
      scopeKey: `${activeScope.start}__${activeScope.end}`,
      title: cleanTitle,
      notes: cleanNotes,
      priority,
      color: PLAN_COLORS[plans.length % PLAN_COLORS.length],
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setPlans((current) => [nextPlan, ...current]);
    setTitle("");
    setNotes("");
    setPriority("medium");
  }

  function togglePlan(id: string) {
    setPlans((current) => current.map((plan) => (plan.id === id ? { ...plan, completed: !plan.completed } : plan)));
  }

  function deletePlan(id: string) {
    setPlans((current) => current.filter((plan) => plan.id !== id));
  }

  function clearSelection() {
    setRange({ start: null, end: null });
  }

  function renderSheet(sheetDate: Date, layerClassName: string, cardClassName?: string, onAnimationEnd?: () => void) {
    const theme = MONTHS[sheetDate.getMonth()];
    const days = buildMonthGrid(sheetDate);
    const monthKey = monthKeyFromDate(sheetDate);

    return (
      <div
        className={layerClassName}
        style={{
          "--accent": theme.accent,
          "--accent-soft": theme.accentSoft,
          "--panel": theme.panel,
        } as CSSProperties}
        onAnimationEnd={onAnimationEnd}
      >
        <div className={[styles.card, cardClassName ?? ""].join(" ")}>
          <div className={styles.imagePanel}>
            <Image src={theme.image} alt={`${theme.name} placeholder artwork`} fill priority className={styles.heroImage} />
            <div className={styles.imageOverlay} />
            <div className={styles.overlayYear}>{sheetDate.getFullYear()}</div>
            <div className={styles.overlayMonth}>
              <span>{`${sheetDate.getMonth() + 1}`.padStart(2, "0")}</span>
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
                const inRange = rangeBounds ? day.date >= rangeBounds.start && day.date <= rangeBounds.end : false;
                const isStart = range.start === day.iso;
                const isEnd = range.end === day.iso;
                const applicablePlans = day.inMonth ? getApplicablePlansForDay(day.iso, monthKey, plans) : [];
                const leadPlan = applicablePlans[0];
                const planStyle = leadPlan
                  ? ({
                      "--plan-fill": hexToRgba(leadPlan.color, 0.18),
                      "--plan-stroke": hexToRgba(leadPlan.color, 0.45),
                      "--plan-dot": leadPlan.color,
                    } as CSSProperties)
                  : undefined;

                return (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() => selectDay(day.iso)}
                    style={planStyle}
                    className={[
                      styles.dayCell,
                      !day.inMonth ? styles.outsideMonth : "",
                      applicablePlans.length > 0 ? styles.hasPlan : "",
                      inRange ? styles.inRange : "",
                      isStart ? styles.rangeEdge : "",
                      isEnd ? styles.rangeEdge : "",
                    ].join(" ")}
                  >
                    <span>{`${day.dayNumber}`.padStart(2, "0")}</span>
                    
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const theme = MONTHS[viewDate.getMonth()];
  const outgoingCardClass = isAnimating ? (navDirection === "right" ? styles.cardFlipNext : styles.cardFlipPrevious) : "";

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

          <div className={styles.controls}>
            <button type="button" className={`${styles.navButton} ${styles.navLeft}`} onClick={() => changeMonth("left")} aria-label="Previous month">
              <FiChevronLeft />
            </button>
            <button type="button" className={`${styles.navButton} ${styles.navRight}`} onClick={() => changeMonth("right")} aria-label="Next month">
              <FiChevronRight />
            </button>
          </div>


          <div className={styles.sheetStage}>
            {incomingDate
              ? renderSheet(
                  incomingDate,
                  `${styles.sheetLayer} ${styles.sheetIncoming} ${navDirection === "right" ? styles.revealForward : styles.revealBackward}`
                )
              : null}

            {renderSheet(
              viewDate,
              `${styles.sheetLayer} ${isAnimating ? styles.sheetOutgoing : styles.sheetCurrent}`,
              outgoingCardClass,
              isAnimating ? finishFlip : undefined
            )}
          </div>
        </div>
      </section>

      <section className={styles.plannerSection}>
        <div className={styles.plannerShell}>
          <div className={styles.plannerIntro}>
            <span className={styles.plannerEyebrow}>Planning Desk</span>
            <h2>{activeScope.label}</h2>
            <p>{activeScope.description}</p>
          </div>

          <div className={styles.plannerMeta}>
            <article className={styles.metaCard}>
              <span>Open plans</span>
              <strong>{activePlans.length}</strong>
            </article>
            <article className={styles.metaCard}>
              <span>Completed</span>
              <strong>{completedCount}</strong>
            </article>
            <article className={styles.metaCard}>
              <span>This month</span>
              <strong>{monthPlans.length}</strong>
            </article>
          </div>

          <div className={styles.plannerGrid}>
            <aside className={styles.planComposer}>
              <div className={styles.composerHeader}>
                <div>
                  <span className={styles.plannerEyebrow}>New Plan</span>
                  <h3>Capture the next thing to do</h3>
                </div>
                <button type="button" className={styles.clearButton} onClick={clearSelection}>
                  Reset selection
                </button>
              </div>

              <form className={styles.planForm} onSubmit={handleCreatePlan}>
                <label className={styles.field}>
                  <span>Title</span>
                  <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Outline the next task or event" />
                </label>

                <label className={styles.field}>
                  <span>Notes</span>
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add details, reminders, or context for this plan" rows={5} />
                </label>

                <label className={styles.field}>
                  <span>Priority</span>
                  <select value={priority} onChange={(event) => setPriority(event.target.value as PlanPriority)}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>

                <button type="submit" className={styles.submitButton}>
                  Save plan
                </button>
              </form>
            </aside>

            <div className={styles.planListArea}>
              <div className={styles.listHeader}>
                <div>
                  <span className={styles.plannerEyebrow}>Saved Plans</span>
                  <h3>{activeScope.type === "month" ? "Everything scheduled in this month" : range.end ? `Plans from ${formatShortDate(activeScope.start)} to ${formatShortDate(activeScope.end)}` : `Plans from ${formatShortDate(activeScope.start)}`}</h3>
                </div>
                <p>{activeScope.label}</p>
              </div>

              {activePlans.length === 0 ? (
                <div className={styles.emptyState}>
                  <strong>No plans in this window</strong>
                  <p>Create the first item for this month or selected date window.</p>
                </div>
              ) : (
                <div className={styles.planList}>
                  {activePlans.map((plan) => {
                    const window = getPlanWindow(plan);
                    return (
                      <article key={plan.id} className={`${styles.simplePlanCard} ${plan.completed ? styles.planDone : ""}`} style={{ "--card-accent": plan.color } as CSSProperties}>
                        <div className={styles.planCardHeader}>
                          <span className={`${styles.priorityIndicator} ${styles[`priority${plan.priority[0].toUpperCase()}${plan.priority.slice(1)}`]}`} />
                          <div className={styles.planMainInfo}>
                            <h4>{plan.title}</h4>
                            <span className={styles.planDates}>{`${formatShortDate(window.start)} - ${formatShortDate(window.end)}`}</span>
                          </div>
                          <div className={styles.cardActions}>
                            <button type="button" className={styles.helpIconButton} aria-label="Help details">
                              <FiHelpCircle />
                            </button>
                            <button type="button" className={styles.deleteIconButton} onClick={() => deletePlan(plan.id)} aria-label="Remove plan">
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                        
                        {plan.notes ? <p className={styles.planNotes}>{plan.notes}</p> : null}
                        
                        <div className={styles.planCardFooter}>
                          <button 
                            type="button" 
                            className={styles.completeToggle} 
                            onClick={() => togglePlan(plan.id)}
                          >
                            {plan.completed ? (
                              <>
                                <FiCheckCircle className={styles.checkIcon} />
                                <span>Completed</span>
                              </>
                            ) : (
                              <>
                                <FiCircle className={styles.circleIcon} />
                                <span>Mark as complete</span>
                              </>
                            )}
                          </button>
                        </div>
                      </article>
                    );
                  })}

                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}






