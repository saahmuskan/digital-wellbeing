import { useState, useEffect } from "react";
import { FiCompass, FiActivity, FiCoffee, FiUser, FiCalendar, FiEdit3, FiCheckCircle, FiFileText, FiMail, FiMessageCircle } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getAllBookingsForUsers, getBookings, saveBooking, deleteBooking } from "../utils/bookings";
import { getAllUsers, isAllowedEmailDomain } from "../utils/auth";
 
const CONSULTANTS = [
  { label: "Wellness Coach", Icon: FiCompass },
  { label: "Therapist", Icon: FiActivity },
  { label: "Nutritionist", Icon: FiCoffee },
];
const TIMES = ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "06:00 PM"];

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function toMonthKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getDateLabel(date) {
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function buildDateRange(baseDate) {
  const dates = [];
  const now = new Date(baseDate);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 6);

  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return { dates, start, end };
}

function buildMonthOptions(dates) {
  const seen = new Set();
  const options = [];

  dates.forEach((date) => {
    const key = toMonthKey(date);
    if (seen.has(key)) return;
    seen.add(key);
    options.push({
      key,
      label: date.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    });
  });

  return options;
}

function getBookingDateKey(booking) {
  if (booking?.slot?.dateISO) {
    const dt = new Date(booking.slot.dateISO);
    if (!Number.isNaN(dt.getTime())) return toDateKey(dt);
  }
  return null;
}

function buildMonthCells(monthKey, rangeStart, rangeEnd) {
  const [year, month] = monthKey.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const startOffset = (first.getDay() + 6) % 7;
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ type: "blank", key: `blank-${i}` });
  }

  for (let day = 1; day <= last.getDate(); day += 1) {
    const date = new Date(year, month - 1, day);
    const inRange = date >= rangeStart && date <= rangeEnd;
    cells.push({ type: "day", date, key: toDateKey(date), inRange });
  }

  return cells;
}
 
function AppointmentPage() {
  const { user } = useAuth();
  const [calendarBaseDate, setCalendarBaseDate] = useState(() => new Date());
  const [consultant, setConsultant] = useState(0);
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [monthKey, setMonthKey] = useState("");
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [notes, setNotes]           = useState("");
  const [confirmed, setConfirmed]   = useState(false);
  const [pastBookings, setPastBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [errors, setErrors] = useState({ slot: "", name: "", email: "" });

  const { dates, start, end } = buildDateRange(calendarBaseDate);
  const monthOptions = buildMonthOptions(dates);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const delay = Math.max(nextMidnight.getTime() - now.getTime(), 1000);

    const timeoutId = window.setTimeout(() => {
      setCalendarBaseDate(new Date());
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [calendarBaseDate]);

  useEffect(() => {
    if (!monthOptions.length) return;
    setMonthKey((prev) => {
      if (!prev) return monthOptions[0].key;
      return monthOptions.some((month) => month.key === prev) ? prev : monthOptions[0].key;
    });
  }, [monthOptions]);
 
  // Load bookings on mount
  useEffect(() => {
    setPastBookings(getBookings());
    const users = getAllUsers();
    setAllBookings(getAllBookingsForUsers(users));
  }, [user]);

  const selectedConsultant = CONSULTANTS[consultant]?.label;

  const availabilityMap = dates.reduce((acc, date) => {
    const dateKey = toDateKey(date);

    if (isWeekend(date)) {
      acc[dateKey] = [];
      return acc;
    }

    const bookedTimes = new Set(
      allBookings
        .filter((booking) => getBookingDateKey(booking) === dateKey && booking.consultant === selectedConsultant)
        .map((booking) => booking.slot?.time)
        .filter(Boolean)
    );

    acc[dateKey] = TIMES.filter((time) => !bookedTimes.has(time));
    return acc;
  }, {});

  const monthCells = monthKey ? buildMonthCells(monthKey, start, end) : [];
  const selectedDateTimes = selectedDateKey ? (availabilityMap[selectedDateKey] || []) : [];

  useEffect(() => {
    if (!selectedDateKey) return;
    if (!availabilityMap[selectedDateKey] || availabilityMap[selectedDateKey].length === 0) {
      setSelectedDateKey(null);
      setSelectedTime(null);
      return;
    }

    if (selectedTime && !availabilityMap[selectedDateKey].includes(selectedTime)) {
      setSelectedTime(null);
    }
  }, [selectedDateKey, selectedTime, availabilityMap]);
 
  const confirm = () => {
    const nextErrors = { slot: "", name: "", email: "" };
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!selectedDateKey || !selectedTime) {
      nextErrors.slot = "Please select an available date and time slot.";
    }

    if (!cleanName) {
      nextErrors.name = "Invalid name: name is required.";
    } else if (user?.name && cleanName.toLowerCase() !== user.name.trim().toLowerCase()) {
      nextErrors.name = `Invalid name: name should match your account name (${user.name}).`;
    } else if (!/^[A-Za-z0-9][A-Za-z0-9\s._'-]{1,49}$/.test(cleanName)) {
      nextErrors.name = "Invalid name: use letters, numbers, spaces, or . _ ' -";
    }

    if (!cleanEmail) {
      nextErrors.email = "Invalid mail ID: email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      nextErrors.email = "Invalid mail ID.";
    } else if (!isAllowedEmailDomain(cleanEmail)) {
      nextErrors.email = "Invalid mail ID: only @gmail.com is allowed.";
    }

    if (nextErrors.slot || nextErrors.name || nextErrors.email) {
      setErrors(nextErrors);
      return;
    }

    setErrors({ slot: "", name: "", email: "" });

    const selectedDate = parseDateKey(selectedDateKey);
    
    saveBooking({
      consultant: selectedConsultant,
      slot: {
        label: getDateLabel(selectedDate),
        time: selectedTime,
        dateISO: selectedDate.toISOString(),
      },
      name: cleanName,
      email: cleanEmail,
      notes,
    });

    // Update past bookings list
    setPastBookings(getBookings());
    setAllBookings(getAllBookingsForUsers(getAllUsers()));
    
    setConfirmed(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };
  
  const handleDeleteBooking = (bookingId) => {
    setPastBookings(deleteBooking(bookingId));
    setAllBookings(getAllBookingsForUsers(getAllUsers()));
  };
  
  const handleNewBooking = () => {
    setConsultant(0);
    setSelectedDateKey(null);
    setSelectedTime(null);
    setName("");
    setEmail("");
    setNotes("");
    setConfirmed(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
 
  return (
    <div className="apt-wrap">
      <h2>Book a Consultation</h2>
      <p>Choose a slot and connect with a certified wellness coach.</p>
 
      {/* Consultant type */}
      <div className="form-section">
        <h3><FiUser aria-hidden="true" /> Consultant type</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {CONSULTANTS.map((consultantItem, i) => (
            <button
              key={consultantItem.label}
              type="button"
              className={`slot-btn${consultant === i ? " selected" : ""}`}
              onClick={() => setConsultant(i)}
            >
              <div className="slot-date" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <consultantItem.Icon aria-hidden="true" />
                <span>{consultantItem.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
 
      {/* Slots */}
      <div className="form-section">
        <h3><FiCalendar aria-hidden="true" /> Calendar slots (next 6 months)</h3>
        <div className="calendar-toolbar">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Select month</label>
            <select value={monthKey} onChange={(e) => setMonthKey(e.target.value)}>
              {monthOptions.map((month) => (
                <option key={month.key} value={month.key}>{month.label}</option>
              ))}
            </select>
          </div>
          <div className="calendar-legend">
            <span><i className="dot available" /> Available date</span>
            <span><i className="dot unavailable" /> Unavailable date</span>
          </div>
        </div>

        <div className="calendar-weekdays">
          {WEEK_DAYS.map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar-grid">
          {monthCells.map((cell) => {
            if (cell.type === "blank") {
              return <div key={cell.key} className="day-empty" />;
            }

            const availableCount = cell.inRange ? (availabilityMap[cell.key]?.length || 0) : 0;
            const unavailable = !cell.inRange || availableCount === 0;
            const selected = selectedDateKey === cell.key;

            return (
              <button
                key={cell.key}
                type="button"
                disabled={unavailable}
                className={`day-btn${selected ? " selected" : ""}${unavailable ? " unavailable" : " available"}`}
                onClick={() => {
                  setSelectedDateKey(cell.key);
                  setSelectedTime(null);
                  setErrors((prev) => ({ ...prev, slot: "" }));
                }}
              >
                <span className="day-num">{cell.date.getDate()}</span>
                <span className="day-slots">{availableCount} slots</span>
              </button>
            );
          })}
        </div>

        <h4 className="time-title">Available time slots</h4>
        <div className="slot-grid">
          {selectedDateKey ? selectedDateTimes.map((time) => (
            <button
              key={time}
              type="button"
              className={`slot-btn${selectedTime === time ? " selected" : ""}`}
              onClick={() => {
                setSelectedTime(time);
                setErrors((prev) => ({ ...prev, slot: "" }));
              }}
            >
              <div className="slot-date">{time}</div>
            </button>
          )) : <p className="slot-hint">Select an available date to view time slots.</p>}
          {selectedDateKey && selectedDateTimes.length === 0 ? (
            <p className="slot-hint">No available time slots for the selected date.</p>
          ) : null}
        </div>
        {errors.slot ? <p className="field-error">{errors.slot}</p> : null}
      </div>
 
      {/* Details */}
      <div className="form-section">
        <h3><FiEdit3 aria-hidden="true" /> Your details</h3>
        <div className="form-row">
          <div className="field">
            <label>Full name</label>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: "" }));
              }}
            />
            {errors.name ? <p className="field-error">{errors.name}</p> : null}
          </div>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
            />
            {errors.email ? <p className="field-error">{errors.email}</p> : null}
          </div>
        </div>
        <div className="field">
          <label>Notes for consultant (optional)</label>
          <input type="text" placeholder="Any specific concerns…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
 
      <button className="submit-btn" onClick={confirm}>Confirm Booking →</button>
 
      {confirmed && (
        <div className="confirm-box">
          <div style={{ fontSize: 40, marginBottom: 12, lineHeight: 1, display: "inline-flex" }} aria-hidden="true"><FiCheckCircle /></div>
          <h3>Appointment Confirmed!</h3>
          <p>
            Hi {name || "there"}, your consultation with a {selectedConsultant} is booked for{" "}
            {selectedDateKey && selectedTime ? `${getDateLabel(parseDateKey(selectedDateKey))} at ${selectedTime}` : "your selected slot"}.
            You'll receive a confirmation email shortly.
          </p>
          <button className="submit-btn" onClick={handleNewBooking} style={{ marginTop: 20 }}>
            Book Another Appointment →
          </button>
        </div>
      )}
      
      {/* Past Bookings Section */}
      {pastBookings.length > 0 && (
        <div className="form-section" style={{ marginTop: 40 }}>
          <h3><FiFileText aria-hidden="true" /> Your Bookings</h3>
          <div style={{ display: "grid", gap: 16 }}>
            {pastBookings.map((booking) => (
              <div key={booking.id} style={{
                padding: 16,
                border: "1px solid #e0e0e0",
                borderRadius: 8,
                backgroundColor: "#f9f9f9"
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" }}>
                  <div>
                    <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>
                      {booking.consultant}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: 14, color: "#666" }}>
                      <FiCalendar aria-hidden="true" style={{ marginRight: 6, verticalAlign: "-2px" }} />
                      {booking.slot?.label} at {booking.slot?.time}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: 14, color: "#666" }}>
                      <FiUser aria-hidden="true" style={{ marginRight: 6, verticalAlign: "-2px" }} />
                      {booking.name}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: 14, color: "#666" }}>
                      <FiMail aria-hidden="true" style={{ marginRight: 6, verticalAlign: "-2px" }} />
                      {booking.email}
                    </p>
                    {booking.notes && (
                      <p style={{ margin: "4px 0", fontSize: 14, color: "#666", fontStyle: "italic" }}>
                        <FiMessageCircle aria-hidden="true" style={{ marginRight: 6, verticalAlign: "-2px" }} />
                        {booking.notes}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this booking?")) {
                        handleDeleteBooking(booking.id);
                      }
                    }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#ff4444",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: "bold",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
 
export default AppointmentPage;
 