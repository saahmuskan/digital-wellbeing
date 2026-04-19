import { getStorageKeyForCurrentUser, getStorageKeyForUser } from "./auth";

const BOOKINGS_BASE_KEY = "wellifyBookings";

function getBookingsStorageKey() {
  return getStorageKeyForCurrentUser(BOOKINGS_BASE_KEY);
}

export function getBookings() {
  try {
    return JSON.parse(localStorage.getItem(getBookingsStorageKey()) || "[]");
  } catch {
    return [];
  }
}

export function saveBooking(booking) {
  const bookings = getBookings();
  const newBooking = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...booking,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(getBookingsStorageKey(), JSON.stringify([newBooking, ...bookings]));
  return newBooking;
}

export function deleteBooking(bookingId) {
  const bookings = getBookings();
  const filtered = bookings.filter((b) => b.id !== bookingId);
  localStorage.setItem(getBookingsStorageKey(), JSON.stringify(filtered));
  return filtered;
}

export function getAllBookingsForUsers(users = []) {
  const merged = [];

  users.forEach((user) => {
    try {
      const key = getStorageKeyForUser(BOOKINGS_BASE_KEY, user.id);
      const bookings = JSON.parse(localStorage.getItem(key) || "[]");
      bookings.forEach((booking) => {
        merged.push({
          ...booking,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
        });
      });
    } catch {
      // Skip invalid booking payloads for a user.
    }
  });

  return merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}
