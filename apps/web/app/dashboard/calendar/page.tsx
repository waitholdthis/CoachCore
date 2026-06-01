"use client";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, X, CheckCircle, Trash2, MapPin, Calendar as CalIcon } from "lucide-react";
import { calendarApi } from "@/lib/api";
import type { CalendarEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const EVENT_TYPE_COLORS: Record<string, string> = {
  practice: "bg-blue-100 text-blue-700 border-blue-200",
  game: "bg-green-100 text-green-700 border-green-200",
  training: "bg-amber-100 text-amber-700 border-amber-200",
  other: "bg-slate-100 text-slate-600 border-slate-200",
};

const EVENT_TYPE_DOT: Record<string, string> = {
  practice: "bg-blue-500",
  game: "bg-green-500",
  training: "bg-amber-500",
  other: "bg-slate-400",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EVENT_TYPES = ["practice", "game", "training", "other"];

interface EventForm {
  title: string;
  event_type: string;
  start_time: string;
  end_time: string;
  location: string;
  sport: string;
  notes: string;
}

const EMPTY_FORM: EventForm = {
  title: "",
  event_type: "practice",
  start_time: "",
  end_time: "",
  location: "",
  sport: "",
  notes: "",
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(() => {
    setLoading(true);
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    calendarApi
      .list({ start, end })
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function eventsOnDay(day: number): CalendarEvent[] {
    return events.filter((e) => {
      const d = new Date(e.start_time);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.start_time) return;
    setSubmitting(true);
    setError(null);
    try {
      await calendarApi.create({
        title: form.title,
        event_type: form.event_type,
        start_time: new Date(form.start_time).toISOString(),
        end_time: form.end_time ? new Date(form.end_time).toISOString() : null,
        location: form.location || null,
        sport: form.sport || null,
        age_bracket: null,
        team_name: null,
        notes: form.notes || null,
        linked_plan_id: null,
        is_completed: false,
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      loadEvents();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e?.response?.data?.detail ?? e?.message ?? "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComplete(event: CalendarEvent) {
    try {
      const updated = await calendarApi.update(event.id, { is_completed: !event.is_completed });
      setEvents(prev => prev.map(ev => ev.id === event.id ? updated : ev));
    } catch {}
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this event?")) return;
    try {
      await calendarApi.delete(id);
      setEvents(prev => prev.filter(ev => ev.id !== id));
      if (selectedDay !== null && eventsOnDay(selectedDay).length <= 1) setSelectedDay(null);
    } catch {}
  }

  const selectedEvents = selectedDay !== null ? eventsOnDay(selectedDay) : [];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Practice Calendar</h1>
          <p className="text-slate-500 text-sm mt-1">Schedule and track practices, games, and training sessions</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(null); }}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 flex items-center gap-2 transition-colors"
        >
          <Plus size={16} /> Add Event
        </button>
      </div>

      <div className={cn("grid gap-6", selectedDay !== null ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1")}>
        {/* Calendar */}
        <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden", selectedDay !== null ? "lg:col-span-2" : "")}>
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronLeft size={18} className="text-slate-600" />
            </button>
            <h2 className="font-semibold text-slate-900">
              {MONTH_NAMES[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronRight size={18} className="text-slate-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAY_NAMES.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-slate-400 py-2">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          {loading ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Loading…</div>
          ) : (
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="min-h-[80px] border-r border-b border-slate-100 bg-slate-50/50" />;
                }
                const dayEvents = eventsOnDay(day);
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const isSelected = day === selectedDay;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={cn(
                      "min-h-[80px] p-1.5 border-r border-b border-slate-100 text-left transition-colors hover:bg-brand-50/50",
                      isSelected && "bg-brand-50 ring-1 ring-inset ring-brand-200",
                      !isSelected && "bg-white"
                    )}
                  >
                    <span className={cn(
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1",
                      isToday ? "bg-brand-600 text-white" : "text-slate-700"
                    )}>
                      {day}
                    </span>
                    <div className="flex flex-wrap gap-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <span
                          key={ev.id}
                          className={cn(
                            "w-2 h-2 rounded-full",
                            EVENT_TYPE_DOT[ev.event_type] ?? "bg-slate-400"
                          )}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] text-slate-400">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Day detail panel */}
        {selectedDay !== null && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">
                {MONTH_NAMES[month]} {selectedDay}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X size={16} className="text-slate-400" />
              </button>
            </div>
            {selectedEvents.length === 0 ? (
              <div className="text-center py-8">
                <CalIcon size={32} className="text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No events this day</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-3 text-xs text-brand-600 hover:underline"
                >
                  Add event
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className={cn(
                      "rounded-lg border p-3",
                      EVENT_TYPE_COLORS[ev.event_type] ?? EVENT_TYPE_COLORS.other,
                      ev.is_completed && "opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-medium", ev.is_completed && "line-through")}>{ev.title}</p>
                        <p className="text-xs mt-0.5 opacity-75">{formatTime(ev.start_time)}</p>
                        {ev.location && (
                          <p className="text-xs flex items-center gap-1 mt-1 opacity-75">
                            <MapPin size={10} /> {ev.location}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleComplete(ev)}
                          className="p-1 rounded hover:bg-white/50 transition-colors"
                          title={ev.is_completed ? "Mark incomplete" : "Mark complete"}
                        >
                          <CheckCircle size={14} className={ev.is_completed ? "text-green-600" : "opacity-50"} />
                        </button>
                        <button
                          onClick={() => handleDelete(ev.id)}
                          className="p-1 rounded hover:bg-white/50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} className="opacity-50 hover:opacity-100 hover:text-red-600" />
                        </button>
                      </div>
                    </div>
                    {ev.notes && <p className="text-xs mt-2 opacity-80 leading-relaxed">{ev.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {Object.entries(EVENT_TYPE_DOT).map(([type, dot]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={cn("w-2.5 h-2.5 rounded-full", dot)} />
            <span className="text-xs text-slate-500 capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Add Event</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="Practice, Game vs. Rivals..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Event Type</label>
                <select
                  value={form.event_type}
                  onChange={(e) => setForm(f => ({ ...f, event_type: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Start Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={form.start_time}
                  onChange={(e) => setForm(f => ({ ...f, start_time: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  value={form.end_time}
                  onChange={(e) => setForm(f => ({ ...f, end_time: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="Field 3, Main Gym..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Sport</label>
                <input
                  value={form.sport}
                  onChange={(e) => setForm(f => ({ ...f, sport: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="Soccer, Basketball..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Saving…" : "Add Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
