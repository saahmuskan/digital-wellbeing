import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { FiBarChart2, FiTrendingUp, FiFileText, FiCalendar, FiCheckCircle, FiInfo } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { isAdminRole, getStorageKeyForUser } from "../utils/auth";

function AdminUsersPage() {
  const { user, listUsers, promoteToAdmin, demoteAdmin, deleteUser, listRemovedUsers } = useAuth();
  const [users, setUsers] = useState([]);
  const [removedUsers, setRemovedUsers] = useState([]);
  const [showRemoved, setShowRemoved] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dataPreviewUser, setDataPreviewUser] = useState(null);
  const [userDataBreakdown, setUserDataBreakdown] = useState({});
  const [selectedDataTypes, setSelectedDataTypes] = useState({
    scores: false,
    history: false,
    bookings: false,
  });
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const isAdmin = isAdminRole(user?.role);
  const canDeleteUserData = user?.adminLevel === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    setUsers(listUsers());
    setRemovedUsers(listRemovedUsers());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, listUsers]);

  const getUserDataBreakdown = (userId) => {
    try {
      const scoresKey = getStorageKeyForUser("wellifyScores", userId);
      const historyKey = getStorageKeyForUser("wellifyHistory", userId);
      const bookingsKey = getStorageKeyForUser("wellifyBookings", userId);

      const scores = JSON.parse(localStorage.getItem(scoresKey) || "null");
      const history = JSON.parse(localStorage.getItem(historyKey) || "[]");
      const bookings = JSON.parse(localStorage.getItem(bookingsKey) || "[]");

      return {
        scores: scores ? 1 : 0,
        history: Array.isArray(history) ? history.length : 0,
        bookings: Array.isArray(bookings) ? bookings.length : 0,
      };
    } catch {
      return { scores: 0, history: 0, bookings: 0 };
    }
  };

  const openDataPreview = (targetUser) => {
    const breakdown = getUserDataBreakdown(targetUser.id);
    setUserDataBreakdown(breakdown);
    setDataPreviewUser(targetUser);
    setSelectedDataTypes({ scores: false, history: false, bookings: false });
  };

  const openConfirm = (title, confirmMessage, onConfirm) => {
    setConfirmState({
      open: true,
      title,
      message: confirmMessage,
      onConfirm,
    });
  };

  const closeConfirm = () => {
    setConfirmState({
      open: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  };

  const deleteSelectedUserData = (userId, userName) => {
    if (!Object.values(selectedDataTypes).some((v) => v)) {
      setMessage("Please select at least one data type to delete.");
      setTimeout(() => setMessage(""), 4000);
      return;
    }

    const selected = Object.keys(selectedDataTypes).filter((k) => selectedDataTypes[k]);
    const confirmMsg = `Delete ${selected.join(", ")} for ${userName}? This cannot be undone.`;

    openConfirm("Confirm Data Deletion", confirmMsg, () => {
      try {
        if (selectedDataTypes.scores) {
          localStorage.removeItem(getStorageKeyForUser("wellifyScores", userId));
        }
        if (selectedDataTypes.history) {
          localStorage.removeItem(getStorageKeyForUser("wellifyHistory", userId));
        }
        if (selectedDataTypes.bookings) {
          localStorage.removeItem(getStorageKeyForUser("wellifyBookings", userId));
        }
        setMessage(`Selected data deleted for ${userName}.`);
        setTimeout(() => setMessage(""), 4000);
        setDataPreviewUser(null);
        setSelectedDataTypes({ scores: false, history: false, bookings: false });
      } catch {
        setMessage("Unable to delete selected data.");
        setTimeout(() => setMessage(""), 4000);
      }
    });
  };

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery = !normalized
        || u.name.toLowerCase().includes(normalized)
        || u.email.toLowerCase().includes(normalized);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, query, roleFilter]);

  const normalUsers = useMemo(
    () => filteredUsers.filter((u) => !isAdminRole(u.role)),
    [filteredUsers]
  );

  const admins = useMemo(
    () => filteredUsers.filter((u) => u.role === "admin"),
    [filteredUsers]
  );

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const makeAdmin = (targetUserId, targetName) => {
    openConfirm("Confirm Admin Update", `Confirm making ${targetName} an admin?`, () => {
      try {
        promoteToAdmin(targetUserId);
        setUsers(listUsers());
        setMessage(`Admin role confirmed for ${targetName}.`);
        setTimeout(() => setMessage(""), 4000);
      } catch (err) {
        const msg = err.message === "FORBIDDEN" ? "You are not allowed to perform this action." : "Unable to promote user.";
        setMessage(msg);
        setTimeout(() => setMessage(""), 4000);
      }
    });
  };

  const removeAdminAccess = (targetUserId, targetName) => {
    openConfirm("Confirm Admin Removal", `Confirm removing admin access for ${targetName}?`, () => {
      try {
        demoteAdmin(targetUserId);
        setUsers(listUsers());
        setMessage(`Admin role removed for ${targetName}.`);
        setTimeout(() => setMessage(""), 4000);
      } catch (err) {
        if (err.message === "AT_LEAST_ONE_ADMIN_REQUIRED") {
          setMessage("At least one admin must remain in the system.");
          setTimeout(() => setMessage(""), 4000);
          return;
        }
        const msg = err.message === "FORBIDDEN" ? "You are not allowed to perform this action." : "Unable to remove admin role.";
        setMessage(msg);
        setTimeout(() => setMessage(""), 4000);
      }
    });
  };

  const wipeUserData = (targetUserId, targetName) => {
    openDataPreview(users.find((u) => u.id === targetUserId));
  };

  const deleteUserAccountByAdmin = (targetUserId, targetName) => {
    const confirmMsg = `Delete user account ${targetName}? This will remove account and data permanently.`;

    openConfirm("Confirm User Deletion", confirmMsg, () => {
      try {
        deleteUser(targetUserId);
        setUsers(listUsers());
        setRemovedUsers(listRemovedUsers());
        setMessage(`User account deleted for ${targetName}.`);
        setTimeout(() => setMessage(""), 4000);
      } catch (err) {
        if (err.message === "CANNOT_DELETE_SELF") {
          setMessage("You cannot delete your own account.");
          setTimeout(() => setMessage(""), 4000);
          return;
        }
        if (err.message === "AT_LEAST_ONE_ADMIN_REQUIRED") {
          setMessage("At least one admin must remain in the system.");
          setTimeout(() => setMessage(""), 4000);
          return;
        }
        setMessage("Unable to delete user account.");
        setTimeout(() => setMessage(""), 4000);
      }
    });
  };

  return (
    <div className="dash-wrap">
      <div className="dash-header">
        <div>
          <h2>Admin: Users</h2>
          <p style={{ color: "var(--text-3)", fontSize: 14 }}>
            View all users and promote selected users to admin.
          </p>
        </div>
      </div>

      <div className="dash-panel" style={{ marginBottom: 16 }}>
        <h3>All Users ({filteredUsers.length}/{users.length})</h3>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <button
            type="button"
            className="btn-outline"
            onClick={() => setShowRemoved((prev) => !prev)}
          >
            {showRemoved ? "Hide Removed Users" : "Removed Users History"}
          </button>
        </div>
        <div className="form-row" style={{ marginBottom: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Search by name or email</label>
            <input
              type="text"
              placeholder="Type user name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Filter by role</label>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>
        <table className="history-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ color: "var(--text-3)" }}>No users found.</td>
              </tr>
            ) : filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${isAdminRole(u.role) ? "good" : "mid"}`}>
                    {u.role}
                  </span>
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showRemoved ? (
        <div className="dash-panel" style={{ marginBottom: 16 }}>
          <h3>Removed Users ({removedUsers.length})</h3>
          {removedUsers.length === 0 ? (
            <p style={{ color: "var(--text-2)", fontSize: 14 }}>No removed users history yet.</p>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Removed By</th>
                  <th>Removed At</th>
                </tr>
              </thead>
              <tbody>
                {removedUsers.map((u, index) => (
                  <tr key={`${u.id}-${u.removedAt}-${index}`}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.removedBy}</td>
                    <td>{new Date(u.removedAt).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      <div className="dash-panel" style={{ marginBottom: 16 }}>
        <h3>Promote User To Co-Admin</h3>
        {normalUsers.length === 0 ? (
          <p style={{ color: "var(--text-2)", fontSize: 14 }}>No regular users available for co-admin promotion.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {normalUsers.map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 12,
                  border: "1px solid rgba(26,92,58,0.12)",
                  borderRadius: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{u.name}</div>
                  <div style={{ fontSize: 13, color: "var(--text-3)" }}>{u.email}</div>
                </div>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => makeAdmin(u.id, u.name)}
                >
                  Make Co-Admin
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dash-panel" style={{ marginBottom: 16 }}>
        <h3>Remove Admin Access</h3>
        {!canDeleteUserData ? (
          <p style={{ color: "var(--text-2)", fontSize: 14 }}>
            Co-admins can promote users, but only admins can remove admin access.
          </p>
        ) : admins.length === 0 ? (
          <p style={{ color: "var(--text-2)", fontSize: 14 }}>No admins available.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {admins.map((u) => (
              <div
                key={u.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 12,
                  border: "1px solid rgba(196,74,106,0.22)",
                  borderRadius: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{u.name}</div>
                  <div style={{ fontSize: 13, color: "var(--text-3)" }}>{u.email}</div>
                </div>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => removeAdminAccess(u.id, u.name)}
                  style={{ borderColor: "var(--rose)", color: "var(--rose)" }}
                >
                  Remove Admin
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dash-panel">
        <h3>User Data Management</h3>
        <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 12 }}>
          Delete a user data only, or delete full user account.
        </p>
        {!canDeleteUserData ? (
          <p style={{ color: "var(--text-2)", fontSize: 14 }}>
            Co-admins cannot delete user data or user accounts.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {filteredUsers.map((u) => (
              <div
                key={`manage-${u.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 12,
                  border: "1px solid rgba(26,92,58,0.12)",
                  borderRadius: 10,
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{u.name}</div>
                  <div style={{ fontSize: 13, color: "var(--text-3)" }}>{u.email}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => wipeUserData(u.id, u.name)}
                  >
                    Delete Data
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => deleteUserAccountByAdmin(u.id, u.name)}
                    style={{ borderColor: "var(--rose)", color: "var(--rose)" }}
                  >
                    Delete User
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {dataPreviewUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setDataPreviewUser(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "var(--radius)",
              padding: 24,
              maxWidth: 500,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 16 }}>
              <FiBarChart2 aria-hidden="true" style={{ marginRight: 8, verticalAlign: "-2px" }} />
              Delete Data for {dataPreviewUser.name}
            </h3>
            <p style={{ color: "var(--text-2)", fontSize: 13, marginBottom: 18 }}>
              Select which data you want to delete. This action cannot be undone.
            </p>

            <div style={{ border: "1px solid rgba(26,92,58,0.1)", borderRadius: 10, padding: 16, marginBottom: 18, background: "rgba(232,245,238,0.5)" }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedDataTypes.scores}
                    onChange={(e) => setSelectedDataTypes({ ...selectedDataTypes, scores: e.target.checked })}
                    style={{ cursor: "pointer", width: 18, height: 18 }}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}><FiTrendingUp aria-hidden="true" style={{ marginRight: 6, verticalAlign: "-2px" }} />Wellness Scores</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                      Latest assessment score ({userDataBreakdown.scores} record)
                    </div>
                  </div>
                </label>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedDataTypes.history}
                    onChange={(e) => setSelectedDataTypes({ ...selectedDataTypes, history: e.target.checked })}
                    style={{ cursor: "pointer", width: 18, height: 18 }}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}><FiFileText aria-hidden="true" style={{ marginRight: 6, verticalAlign: "-2px" }} />Assessment History</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                      All past assessments ({userDataBreakdown.history} records)
                    </div>
                  </div>
                </label>
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedDataTypes.bookings}
                    onChange={(e) => setSelectedDataTypes({ ...selectedDataTypes, bookings: e.target.checked })}
                    style={{ cursor: "pointer", width: 18, height: 18 }}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}><FiCalendar aria-hidden="true" style={{ marginRight: 6, verticalAlign: "-2px" }} />Appointment Bookings</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                      All booked consultation slots ({userDataBreakdown.bookings} records)
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setDataPreviewUser(null)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => deleteSelectedUserData(dataPreviewUser.id, dataPreviewUser.name)}
                style={{ flex: 1, background: "var(--rose)", borderColor: "var(--rose)" }}
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setMessage("")}
        >
          <div
            style={{
              background: "white",
              borderRadius: "var(--radius)",
              padding: 32,
              maxWidth: 420,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              textAlign: "center",
              animation: "slideUp 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 40, marginBottom: 16, lineHeight: 1 }}>
              {message.includes("deleted") || message.includes("removed") || message.includes("confirmed")
                ? <FiCheckCircle aria-hidden="true" />
                : <FiInfo aria-hidden="true" />}
            </div>
            <p style={{ color: "var(--text)", fontSize: 16, lineHeight: 1.8, fontWeight: 500, marginBottom: 20 }}>
              {message}
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setMessage("")}
              style={{ minWidth: 120 }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {confirmState.open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.52)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 12000,
            backdropFilter: "blur(4px)",
          }}
          onClick={closeConfirm}
        >
          <div
            style={{
              background: "white",
              borderRadius: "var(--radius)",
              padding: 28,
              width: "min(92vw, 460px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
              animation: "slideUp 0.25s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: 10 }}>{confirmState.title}</h3>
            <p style={{ color: "var(--text-2)", lineHeight: 1.6, fontSize: 14, marginBottom: 18 }}>
              {confirmState.message}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                className="btn-outline"
                onClick={closeConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: "var(--rose)", borderColor: "var(--rose)" }}
                onClick={() => {
                  const fn = confirmState.onConfirm;
                  closeConfirm();
                  if (typeof fn === "function") fn();
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;
