// Client-side storage and session management

const TOKEN_KEY = 'homeresource_token';
const USER_KEY = 'homeresource_user';
const HOUSEHOLD_KEY = 'homeresource_household_id';

export const storage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),

  getUser: () => {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  removeUser: () => localStorage.removeItem(USER_KEY),

  getHouseholdId: () => {
    const id = localStorage.getItem(HOUSEHOLD_KEY);
    return id ? parseInt(id, 10) : 1; // Default to 1 (Demo household)
  },
  setHouseholdId: (id) => localStorage.setItem(HOUSEHOLD_KEY, id.toString()),

  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),

  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(HOUSEHOLD_KEY);
  }
};
