// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

// Used on the LOGIN page: if user already has a session, skip login screen
async function checkSessionRedirect() {
  const { data } = await sb.auth.getSession();
  if (data.session) {
    window.location.href = 'dashboard.html';
  }
}

// Used on the DASHBOARD page: if user has NO session, send back to login
async function requireLogin() {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    window.location.href = 'index.html';
    return null;
  }
  return data.session.user;
}

// Login with email + password
async function loginUser(email, password) {
  return await sb.auth.signInWithPassword({ email, password });
}

// Logout
async function logoutUser() {
  await sb.auth.signOut();
  window.location.href = 'index.html';
}
