const CURRENT_USER_KEY = "wellifyCurrentUser";
const USERS_KEY = "wellifyUsers";
const REMOVED_USERS_KEY = "wellifyRemovedUsersHistory";

const DEFAULT_ADMINS = [
  {
    name: "muskan",
    email: "muskanshah@gmail.com",
    password: "muskan123",
    role: "admin",
  },
  {
    name: "admin",
    email: "admin@gmail.com",
    password: "admin1234",
    role: "admin",
  },
];

const DEFAULT_ADMIN_IDS = DEFAULT_ADMINS.map((admin) => normalizeEmail(admin.email).replace(/[^a-z0-9]/g, "_"));

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

export function isAllowedEmailDomain(email = "") {
  return /@gmail\.com$/i.test(email.trim());
}

function createUserId(email = "") {
  return normalizeEmail(email).replace(/[^a-z0-9]/g, "_");
}

function normalizeRole(role) {
  return role === "admin" || role === "co-admin" || role === "main-admin" ? "admin" : "user";
}

function normalizeAdminLevel(userId, role, adminLevel) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole !== "admin") return null;
  if (DEFAULT_ADMIN_IDS.includes(userId)) return "admin";
  if (adminLevel === "admin" || adminLevel === "co-admin") return adminLevel;
  return "co-admin";
}

export function isAdminRole(role = "") {
  return normalizeRole(role) === "admin";
}

function ensureDefaultAdmins() {
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  let changed = false;

  // Normalize existing roles so older data migrates to admin/user.
  Object.keys(users).forEach((userId) => {
    const normalizedRole = normalizeRole(users[userId]?.role);
    const normalizedAdminLevel = normalizeAdminLevel(userId, normalizedRole, users[userId]?.adminLevel);
    if (users[userId]?.role !== normalizedRole || users[userId]?.adminLevel !== normalizedAdminLevel) {
      users[userId] = { ...users[userId], role: normalizedRole, adminLevel: normalizedAdminLevel };
      changed = true;
    }
  });

  DEFAULT_ADMINS.forEach((admin) => {
    const cleanEmail = normalizeEmail(admin.email);
    const userId = createUserId(cleanEmail);
    const existing = users[userId] || {};

    users[userId] = {
      id: userId,
      email: cleanEmail,
      name: admin.name,
      role: normalizeRole(admin.role),
      adminLevel: "admin",
      password: admin.password,
      createdAt: existing.createdAt || new Date().toISOString(),
      lastLoginAt: existing.lastLoginAt || null,
    };

    changed = true;
  });

  if (changed) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}

export function getCurrentUser() {
  ensureDefaultAdmins();
  try {
    const user = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");
    if (!user) return null;

    const normalizedRole = normalizeRole(user.role);
    const normalizedAdminLevel = normalizeAdminLevel(user.id, normalizedRole, user.adminLevel);
    if (user.role !== normalizedRole || user.adminLevel !== normalizedAdminLevel) {
      const next = { ...user, role: normalizedRole, adminLevel: normalizedAdminLevel };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(next));
      return next;
    }

    return user;
  } catch {
    return null;
  }
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: normalizeRole(user.role),
    adminLevel: normalizeAdminLevel(user.id, user.role, user.adminLevel),
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

export function getStorageKeyForUser(baseKey, userId) {
  return `${baseKey}:${userId}`;
}

export function getStorageKeyForCurrentUser(baseKey) {
  const user = getCurrentUser();
  if (!user?.id) return baseKey;
  return getStorageKeyForUser(baseKey, user.id);
}

export function loginUser({ name, email, password }) {
  ensureDefaultAdmins();

  const cleanEmail = normalizeEmail(email);
  const cleanPassword = (password || "").trim();

  if (!isAllowedEmailDomain(cleanEmail)) {
    throw new Error("INVALID_EMAIL_DOMAIN");
  }

  if (!cleanEmail) {
    throw new Error("Email is required");
  }
  if (!cleanPassword) {
    throw new Error("Password is required");
  }

  const userId = createUserId(cleanEmail);
  const cleanName = (name || cleanEmail.split("@")[0] || "Wellness User").trim();

  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  const existing = users[userId] || {};

  if (existing.id && existing.password && existing.password !== cleanPassword) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const user = {
    id: userId,
    email: cleanEmail,
    name: existing.name || cleanName,
    role: normalizeRole(existing.role),
    adminLevel: normalizeAdminLevel(userId, existing.role, existing.adminLevel),
    password: existing.password || cleanPassword,
    createdAt: existing.createdAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  users[userId] = user;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(toPublicUser(user)));

  return toPublicUser(user);
}

export function registerUser({ name, email, password }) {
  ensureDefaultAdmins();

  const cleanEmail = normalizeEmail(email);
  const cleanPassword = (password || "").trim();

  if (!isAllowedEmailDomain(cleanEmail)) {
    throw new Error("INVALID_EMAIL_DOMAIN");
  }

  if (!cleanEmail) {
    throw new Error("Email is required");
  }
  if (!cleanPassword) {
    throw new Error("Password is required");
  }

  const userId = createUserId(cleanEmail);
  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");

  if (users[userId]?.id) {
    throw new Error("USER_EXISTS");
  }

  const cleanName = (name || cleanEmail.split("@")[0] || "Wellness User").trim();

  const user = {
    id: userId,
    email: cleanEmail,
    name: cleanName,
    role: "user",
    adminLevel: null,
    password: cleanPassword,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  users[userId] = user;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(toPublicUser(user)));

  return toPublicUser(user);
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getAllUsers() {
  ensureDefaultAdmins();
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
    return Object.values(users)
      .map((user) => toPublicUser(user))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

export function promoteUserToAdmin(userId) {
  const currentUser = getCurrentUser();
  if (!isAdminRole(currentUser?.role)) {
    throw new Error("FORBIDDEN");
  }

  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  if (!users[userId]) {
    throw new Error("USER_NOT_FOUND");
  }

  users[userId] = {
    ...users[userId],
    role: "admin",
    adminLevel: "co-admin",
  };

  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  if (currentUser?.id === userId) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(toPublicUser(users[userId])));
  }

  return toPublicUser(users[userId]);
}

export function demoteAdminToUser(userId) {
  const currentUser = getCurrentUser();
  if (!isAdminRole(currentUser?.role) || currentUser?.adminLevel !== "admin") {
    throw new Error("FORBIDDEN");
  }

  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  if (!users[userId]) {
    throw new Error("USER_NOT_FOUND");
  }

  const targetRole = normalizeRole(users[userId].role);
  if (targetRole !== "admin") {
    throw new Error("NOT_ADMIN");
  }

  const adminCount = Object.values(users).filter((u) => normalizeRole(u.role) === "admin").length;
  if (adminCount <= 1) {
    throw new Error("AT_LEAST_ONE_ADMIN_REQUIRED");
  }

  users[userId] = {
    ...users[userId],
    role: "user",
    adminLevel: null,
  };

  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  if (currentUser?.id === userId) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(toPublicUser(users[userId])));
  }

  return toPublicUser(users[userId]);
}

export function deleteUserData(userId) {
  const currentUser = getCurrentUser();
  if (!isAdminRole(currentUser?.role) || currentUser?.adminLevel !== "admin") {
    throw new Error("FORBIDDEN");
  }

  if (!userId) {
    throw new Error("USER_NOT_FOUND");
  }

  localStorage.removeItem(getStorageKeyForUser("wellifyScores", userId));
  localStorage.removeItem(getStorageKeyForUser("wellifyHistory", userId));
  localStorage.removeItem(getStorageKeyForUser("wellifyBookings", userId));

  return true;
}

export function deleteUserAccount(userId) {
  const currentUser = getCurrentUser();
  if (!isAdminRole(currentUser?.role) || currentUser?.adminLevel !== "admin") {
    throw new Error("FORBIDDEN");
  }

  if (!userId) {
    throw new Error("USER_NOT_FOUND");
  }

  if (currentUser?.id === userId) {
    throw new Error("CANNOT_DELETE_SELF");
  }

  const users = JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  if (!users[userId]) {
    throw new Error("USER_NOT_FOUND");
  }

  const removedUser = users[userId];

  const targetRole = normalizeRole(users[userId].role);
  const adminCount = Object.values(users).filter((u) => normalizeRole(u.role) === "admin").length;
  if (targetRole === "admin" && adminCount <= 1) {
    throw new Error("AT_LEAST_ONE_ADMIN_REQUIRED");
  }

  delete users[userId];
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  deleteUserData(userId);

  const removedHistory = JSON.parse(localStorage.getItem(REMOVED_USERS_KEY) || "[]");
  removedHistory.unshift({
    id: removedUser.id,
    name: removedUser.name,
    email: removedUser.email,
    role: normalizeRole(removedUser.role),
    removedAt: new Date().toISOString(),
    removedBy: currentUser?.email || "admin",
  });
  localStorage.setItem(REMOVED_USERS_KEY, JSON.stringify(removedHistory.slice(0, 100)));

  if (currentUser?.id === userId) {
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  return true;
}

export function getRemovedUsersHistory() {
  const currentUser = getCurrentUser();
  if (!isAdminRole(currentUser?.role)) {
    throw new Error("FORBIDDEN");
  }

  try {
    return JSON.parse(localStorage.getItem(REMOVED_USERS_KEY) || "[]");
  } catch {
    return [];
  }
}
