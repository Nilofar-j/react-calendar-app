import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import jalaliday from "jalaliday";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdArrowDropleft } from "react-icons/io";
import { IoMdArrowDropright } from "react-icons/io";
import { IoTrashOutline } from "react-icons/io5";
import "./Calendar.css";

dayjs.extend(jalaliday);
const toPersianDigits = (num) => num.toString().replace(/[0-9]/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);

const persianMonths = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];
const weekDays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

export default function Calendar() {
    const today = dayjs().calendar('jalali').locale('fa');

    const [viewDate, setViewDate] = useState(dayjs(today));
    const [selected, setSelected] = useState(null);
    const [events, setEvents] = useState(() => {
        const storedEvents = localStorage.getItem('pc_events_v1');
        return storedEvents ? JSON.parse(storedEvents) : {};
    });
    const [showEventForm, setShowEventForm] = useState(false);
    const [eventTitle, setEventTitle] = useState("");
    const [eventNote, setEventNote] = useState("");

    useEffect(() => {
        const storedEvents = localStorage.getItem('pc_events_v1');
        if (storedEvents) setEvents(JSON.parse(storedEvents));
    }, []);

    useEffect(() => {
        localStorage.setItem('pc_events_v1', JSON.stringify(events));
    }, [events]);

    const daysInMonth = (d) => {
        try {
            return dayjs(d).calendar('jalali').daysInMonth();
        } catch (e) {
            const m = Number(dayjs(d).calendar('jalali').month());
            if (m <= 5) return 31;
            if (m <= 10) return 30;
            return 29;
        }
    };

    const firstDayWeekIndex = (d) => {
        const first = dayjs(d).calendar('jalali').date(1);
        const jsDay = first.day();
        return (jsDay + 1) % 7;
    };

    const goPrev = () => setViewDate((v) => dayjs(v).subtract(1, 'month'));
    const goNext = () => setViewDate((v) => dayjs(v).add(1, 'month'));

    const selectDate = (d) => {
        setSelected(d);
        setEventTitle('');
        setEventNote('');
        setShowEventForm(true);
    };

    const keyFor = (d) => dayjs(d).calendar('jalali').locale('fa').format('YYYY-MM-DD'); // locale اضافه شد

    const addEvent = () => {
        if (!selected) return;
        const key = keyFor(selected);
        const newEv = { id: Date.now(), title: eventTitle || 'بدون عنوان', note: eventNote };
        const copy = { ...events };
        copy[key] = copy[key] ? [newEv, ...copy[key]] : [newEv];
        setEvents(copy);
        setShowEventForm(false);
    };

    const deleteEvent = (dayKey, id) => {
        const copy = { ...events };
        copy[dayKey] = copy[dayKey].filter(e => e.id !== id);
        if (copy[dayKey].length === 0) delete copy[dayKey];
        setEvents(copy);
    };
    const monthIndex = viewDate.calendar('jalali').month();
    const currentMonthName = persianMonths[monthIndex];
    const persianYear = toPersianDigits(viewDate.calendar('jalali').year());

    let seasonClass;
    if (monthIndex >= 0 && monthIndex <= 2) seasonClass = 'spring';
    else if (monthIndex >= 3 && monthIndex <= 5) seasonClass = 'summer';
    else if (monthIndex >= 6 && monthIndex <= 8) seasonClass = 'autumn';
    else seasonClass = 'winter';

    const total = daysInMonth(viewDate);
    const firstIndex = firstDayWeekIndex(viewDate);
    const weeks = [];
    let cells = [];

    for (let i = 0; i < firstIndex; i++) cells.push(null);
    for (let d = 1; d <= total; d++) {
        const dd = dayjs(viewDate).date(d).calendar('jalali').locale('fa');
        cells.push(dd);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    for (let i = 0; i < cells.length; i += 7) {
        weeks.push(cells.slice(i, i + 7));
    };
    return (
        <div className={`pc-calendar ${seasonClass}`}>
            <div>
                <div className={`pc-seasons ${seasonClass}`}>

                </div>

                <div className="pc-header">
                    <button className="pc-nav" onClick={goPrev}><IoMdArrowDropright /></button>
                    <div className="pc-title">
                        <div className="pc-month">{currentMonthName} {persianYear}</div>
                        <div className="pc-sub">{persianYear}/{toPersianDigits(monthIndex + 1)}</div>
                    </div>
                    <button className="pc-nav" onClick={goNext}><IoMdArrowDropleft /></button>
                </div>
            </div>

            <div>
                <div className={`pc-weekheads ${seasonClass}`}>
                    {weekDays.map(d => <div key={d} className="pc-weekhead">{d}</div>)}
                </div>
                <div className="pc-grid">
                    {weeks.map((week, wi) => (
                        <React.Fragment key={wi}>
                            {week.map((cell, ci) => {
                                if (!cell) return <div key={ci} className="pc-cell empty" />;
                                const key = keyFor(cell);
                                const isToday = dayjs(cell).isSame(today, 'day');
                                const hasEvents = events[key] && events[key].length > 0;

                                return (
                                    <motion.button
                                        key={ci}
                                        onClick={() => selectDate(cell)}
                                        whileTap={{ scale: 0.97 }}
                                        className={`pc-cell pc-day ${isToday ? 'today' : ''}`}
                                    >
                                        <div className="pc-day-top">
                                            <span className="pc-day-num">{toPersianDigits(cell.format('D'))}</span>
                                            {hasEvents && <span className="pc-badge">{toPersianDigits(events[key].length)}</span>}
                                        </div>
                                        <div className="pc-day-name">{cell.format('dddd')}</div>
                                    </motion.button>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
            <AnimatePresence>
                {showEventForm && selected && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="pc-overlay"
                    >
                        <motion.div className="pc-modal" layout>
                            <div className="pc-modal-header">
                                <div>
                                    <div className="pc-modal-title">ثبت رویداد - {persianYear}/{toPersianDigits(selected.calendar('jalali').month() + 1)}/{toPersianDigits(selected.date())}</div>
                                    <div className="pc-modal-sub">{selected.format('dddd')}</div>
                                </div>
                                <button className="pc-close" onClick={() => setShowEventForm(false)}>✖</button>
                            </div>

                            <div className="pc-modal-body">
                                <input value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="عنوان رویداد" className="pc-input" />
                                <textarea value={eventNote} onChange={e => setEventNote(e.target.value)} placeholder="یادداشت" className="pc-textarea" />
                                <div className="pc-actions">
                                    <button onClick={() => setShowEventForm(false)} className="pc-btn pc-btn-ghost">لغو</button>
                                    <button onClick={addEvent} className="pc-btn pc-btn-primary">ذخیره</button>
                                </div>

                                <div className="pc-events-list">
                                    {(events[keyFor(selected)] || []).map(ev => (
                                        <div key={ev.id} className="pc-event">
                                            <div>
                                                <div className="pc-event-title">{ev.title}</div>
                                                {ev.note && <div className="pc-event-note">{ev.note}</div>}
                                            </div>
                                            <div className="pc-event-actions">
                                                <button className="pc-delete" onClick={() => deleteEvent(keyFor(selected), ev.id)}>
                                                    <IoTrashOutline />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {(!events[keyFor(selected)] || events[keyFor(selected)].length === 0) && (
                                        <div className="pc-empty">رویدادی ثبت نشده.</div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};



