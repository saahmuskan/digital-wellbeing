import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllBookingsForUsers } from "../utils/bookings";
import { isAdminRole } from "../utils/auth";

const MONTH_INDEX = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function getSlotDate(booking) {
  if (booking?.slot?.dateISO) {
    const dt = new Date(booking.slot.dateISO);
    if (!Number.isNaN(dt.getTime())) return dt;
  }

  const label = booking?.slot?.label || "";
  const match = label.match(/(\d{1,2})\s+([A-Za-z]{3})/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = MONTH_INDEX[match[2]];
  if (Number.isNaN(day) || month === undefined) return null;

  const now = new Date();
  let year = now.getFullYear();
  let slotDate = new Date(year, month, day);

  // If parsed date is far behind today, treat it as next year's slot.
  if (slotDate < new Date(now.getFullYear(), now.getMonth(), now.getDate() - 120)) {
    year += 1;
    slotDate = new Date(year, month, day);
  }

  return slotDate;
}

function getSlotDateKey(booking) {
  const dt = getSlotDate(booking);
  if (!dt) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isUpcoming(booking) {
  const slotDate = getSlotDate(booking);
  if (!slotDate) return false;
  const today = new Date();
  const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return slotDate >= currentDay;
}

function AdminBookedSlotsPage() {
  const { user, listUsers } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [query, setQuery] = useState("");
  const [consultantFilter, setConsultantFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const isAdmin = isAdminRole(user?.role);

  useEffect(() => {
    if (!isAdmin) return;
    const users = listUsers();
    setBookings(getAllBookingsForUsers(users));
  }, [isAdmin, listUsers]);

  const consultantOptions = useMemo(() => {
    const set = new Set(bookings.map((b) => b.consultant).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesQuery = !normalized
        || booking.userName?.toLowerCase().includes(normalized)
        || booking.userEmail?.toLowerCase().includes(normalized);

      const matchesConsultant = consultantFilter === "all" || booking.consultant === consultantFilter;

      // For date filtering: convert selected date to YYYY-MM-DD format
      let matchesDate = true;
      if (dateFilter) {
        const selectedDate = new Date(dateFilter);
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        const formattedSelectedDate = `${year}-${month}-${day}`;
        const bookingDate = getSlotDateKey(booking);
        matchesDate = bookingDate === formattedSelectedDate;
      }

      const bookingIsUpcoming = isUpcoming(booking);
      const matchesStatus = statusFilter === "all"
        || (statusFilter === "upcoming" && bookingIsUpcoming)
        || (statusFilter === "past" && !bookingIsUpcoming);

      return matchesQuery && matchesConsultant && matchesDate && matchesStatus;
    });
  }, [bookings, query, consultantFilter, dateFilter, statusFilter]);

  const upcoming = useMemo(() => filteredBookings.filter((b) => isUpcoming(b)), [filteredBookings]);
  const history = useMemo(() => filteredBookings, [filteredBookings]);

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const renderRows = (rows) => {
    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={6} style={{ color: "var(--text-3)" }}>No slots found.</td>
        </tr>
      );
    }

    return rows.map((b) => (
      <tr key={b.id}>
        <td>{b.userName}</td>
        <td>{b.userEmail}</td>
        <td>{b.consultant}</td>
        <td>{b.slot?.label || "-"}</td>
        <td>{b.slot?.time || "-"}</td>
        <td>{new Date(b.createdAt).toLocaleString("en-IN")}</td>
      </tr>
    ));
  };

  return (
    <div className="dash-wrap">
      <div className="dash-header">
        <div>
          <h2>Admin: Booked Slots</h2>
          <p style={{ color: "var(--text-3)", fontSize: 14 }}>
            See all users booking list with upcoming slots and full booking history.
          </p>
        </div>
      </div>

      <div className="dash-panel" style={{ marginBottom: 16, background: "white", border: "1px solid rgba(26,92,58,0.08)" }}>
        <h3 style={{ fontSize: 16, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>⚙️ Filter Slots</h3>
        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>🔍 Search user</label>
            <input
              type="text"
              placeholder="Enter name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ transition: "all 0.2s ease" }}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>👤 Consultant</label>
            <select value={consultantFilter} onChange={(e) => setConsultantFilter(e.target.value)}>
              <option value="all">All consultants</option>
              {consultantOptions.map((consultant) => (
                <option key={consultant} value={consultant}>{consultant}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>📅 Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>✓ Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="upcoming">Upcoming only</option>
              <option value="past">Past only</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          className="btn-outline"
          onClick={() => {
            setQuery("");
            setConsultantFilter("all");
            setDateFilter("");
            setStatusFilter("all");
          }}
          style={{ marginTop: 16, background: "rgba(26,92,58,0.06)", border: "1.5px solid var(--green-light)" }}
        >
          ↻ Clear Filters
        </button>
      </div>

      <div className="dash-panel" style={{ marginBottom: 16 }}>
        <h3>Upcoming Slots ({upcoming.length})</h3>
        <table className="history-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Consultant</th>
              <th>Date</th>
              <th>Time</th>
              <th>Booked At</th>
            </tr>
          </thead>
          <tbody>{renderRows(upcoming)}</tbody>
        </table>
      </div>

      <div className="dash-panel">
        <h3>All Slots History ({history.length})</h3>
        <table className="history-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Consultant</th>
              <th>Date</th>
              <th>Time</th>
              <th>Booked At</th>
            </tr>
          </thead>
          <tbody>{renderRows(history)}</tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminBookedSlotsPage;
