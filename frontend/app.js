const BASE_URL = 'http://localhost:5000';

// ── Auth helpers (unchanged) ──────────────────────────────────────────────────

function getToken() {
  return sessionStorage.getItem('token') || localStorage.getItem('token');
}

function getUser() {
  const raw = sessionStorage.getItem('user') || localStorage.getItem('user') || '{}';
  const u = JSON.parse(raw);
  if (u && u._id && !u.id) u.id = u._id;
  return u;
}

function saveAuth(token, user) {
  if (user._id && !user.id) user.id = user._id;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('user', JSON.stringify(user));
}

function showError(elementId, msg) {
  const element = document.getElementById(elementId);
  element.textContent = msg;
  element.style.display = 'block';
}

function requireAuth() {
  if (!getToken()) window.location.href = 'index.html';
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  window.location.href = 'index.html';
}

// ── API helpers (unchanged) ───────────────────────────────────────────────────

async function loginUser() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!email || !password) { showError('error-msg', 'Please fill all fields'); return; }
  try {
    const res = await fetch(BASE_URL + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { showError('error-msg', data.message); return; }
    saveAuth(data.token, data.user);
    if (data.user.role === 'tenant') window.location.href = 'tenant.html';
    else if (data.user.role === 'landlord') window.location.href = 'landlord.html';
    else if (data.user.role === 'contractor') window.location.href = 'contractor.html';
  } catch (error) {
    showError('error-msg', 'Cannot connect to server');
  }
}

async function registerUser() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  if (!name || !email || !password || !role) { showError('error-msg', 'Please fill all fields'); return; }
  try {
    const res = await fetch(BASE_URL + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (!res.ok) { showError('error-msg', data.message); return; }
    saveAuth(data.token, data.user);
    if (data.user.role === 'tenant') window.location.href = 'tenant.html';
    else if (data.user.role === 'landlord') window.location.href = 'landlord.html';
    else if (data.user.role === 'contractor') window.location.href = 'contractor.html';
  } catch (error) {
    showError('error-msg', 'Cannot connect to server');
  }
}

async function apiGet(path) {
  const res = await fetch(BASE_URL + path, {
    headers: { 'Authorization': 'Bearer ' + getToken() }
  });
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function apiPut(path, body) {
  const res = await fetch(BASE_URL + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + getToken() },
    body: JSON.stringify(body)
  });
  return res.json();
}

function statusBadge(status) {
  return '<span class="badge badge-' + status + '">' + status + '</span>';
}

async function loadComplaints() {
  try {
    const user = getUser();
    let endpoint = '/api/complaints';
    if (user && user.role === 'tenant') {
      endpoint = '/api/complaints/my/tenant';
    } else if (user && user.role === 'contractor') {
      endpoint = '/api/complaints/my/contractor';
    }
    const data = await apiGet(endpoint);
    return data.complaints || [];
  } catch (error) {
    console.error('Error loading complaints:', error);
    throw error;
  }
}

// ── Notification System ───────────────────────────────────────────────────────

const _notifications = [];

function _updateNotifBadge() {
  const el = document.getElementById('notif-count');
  if (!el) return;
  const unread = _notifications.filter(n => !n.read).length;
  if (unread > 0) {
    el.textContent = unread > 99 ? '99+' : unread;
    el.style.setProperty('display', 'flex', 'important');
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.lineHeight = '1';
  } else {
    el.style.display = 'none';
  }
}

function _renderNotifPanel() {
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  const body = panel.querySelector('.notif-panel-body');
  if (!body) return;
  if (!_notifications.length) {
    body.innerHTML = '<div class="notif-empty">No notifications yet</div>';
    return;
  }
  body.innerHTML = _notifications.map(n =>
    '<div class="notif-item' + (n.read ? '' : ' unread') + '">' +
    '<div class="notif-item-msg">' + n.message + '</div>' +
    '<div class="notif-item-time">' + n.time + '</div>' +
    '</div>'
  ).join('');
}

function _addNotification(message, time, read) {
  const t = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  _notifications.unshift({ message, time: t, read: !!read });
  if (_notifications.length > 30) _notifications.pop();
  _updateNotifBadge();
  _renderNotifPanel();
  if (!read) showToast(message);
}

// Load existing notifications from DB on page load
async function _loadNotificationsFromDB(userId) {
  try {
    const data = await apiGet('/api/notifications/user/' + userId);
    const notifs = data.notifications || [];
    notifs.forEach(n => {
      const time = new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      _notifications.push({ message: n.message, time, read: n.isRead });
    });
    _updateNotifBadge();
    _renderNotifPanel();
  } catch (err) { console.warn('Could not load notifications from DB'); }
}

async function _markAllRead(userId) {
  try { await apiPut('/api/notifications/read/' + userId, {}); } catch (err) { }
}

function toggleNotifPanel() {
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  const isVisible = panel.style.display === 'block';
  panel.style.display = isVisible ? 'none' : 'block';
  if (!isVisible) {
    _notifications.forEach(n => n.read = true);
    _updateNotifBadge();
    _renderNotifPanel();
    // Mark all read in DB (fire and forget)
    const u = getUser();
    if (u && u.id) _markAllRead(u.id);
  }
}


// Close panel on outside click
document.addEventListener('click', function (e) {
  const bell = document.getElementById('notif-bell-btn');
  const panel = document.getElementById('notif-panel');
  if (panel && bell && !bell.contains(e.target) && !panel.contains(e.target)) {
    panel.style.display = 'none';
  }
});

function injectNotifPanel() {
  const bellDiv = document.getElementById('notif-bell-btn');
  if (!bellDiv) return;
  // Already has the onclick set in HTML, just inject the dropdown panel
  if (document.getElementById('notif-panel')) return; // already injected

  const panel = document.createElement('div');
  panel.id = 'notif-panel';

  const header = document.createElement('div');
  header.className = 'notif-panel-header';
  header.textContent = '🔔 Notifications';

  const body = document.createElement('div');
  body.className = 'notif-panel-body';
  body.innerHTML = '<div class="notif-empty">No notifications yet</div>';

  panel.appendChild(header);
  panel.appendChild(body);
  bellDiv.appendChild(panel);
}

function initSocket(userId) {
  injectNotifPanel();
  // Load existing notifications from DB immediately (badge shows without refresh)
  _loadNotificationsFromDB(userId);

  const script = document.createElement('script');
  script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
  script.onload = function () {
    const socket = io(BASE_URL);
    socket.emit('join_room', userId);
    socket.on('notification', function (data) {
      _addNotification(data.message);
    });
  };
  document.head.appendChild(script);
}

// ── Toast Notifications ───────────────────────────────────────────────────────

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(120%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => { if (document.body.contains(toast)) document.body.removeChild(toast); }, 350);
  }, 3800);
}

// ── PDF Download (unchanged) ──────────────────────────────────────────────────

async function downloadPDF(type) {
  try {
    const res = await fetch(BASE_URL + '/api/reports/' + type, {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    });
    if (!res.ok) { showToast('Failed to generate PDF'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rentcare-' + type + '-report.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } catch (err) {
    showToast('Error downloading PDF');
  }
}