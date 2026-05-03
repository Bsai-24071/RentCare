const BASE_URL = 'http://localhost:5000';

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
  if (!getToken()) {
    window.location.href = 'index.html';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  window.location.href = 'index.html';
}

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
    const data = await apiGet('/api/complaints');
    return data.complaints || [];
  } catch (error) {
    console.error('Error loading complaints:', error);
    throw error;
  }
}

// ─── Notification System ────────────────────────────────────────────────────

const _notifications = [];

function _getNotifBodyEl() {
  const panel = document.getElementById('notif-panel');
  if (!panel) return null;
  // Body is the second child (first is header)
  return panel.children[1] || null;
}

function _renderNotifPanel() {
  const body = _getNotifBodyEl();
  if (!body) return;
  if (!_notifications.length) {
    body.innerHTML = '<div style="padding:14px 16px;color:#888;font-size:13px;">No notifications yet</div>';
    return;
  }
  body.innerHTML = _notifications.map(n =>
    '<div style="padding:12px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;' +
    (n.read ? 'color:#999;' : 'color:#1a1a2e;font-weight:500;') + '">' +
    '<div>' + n.message + '</div>' +
    '<div style="font-size:11px;color:#aaa;margin-top:3px;">' + n.time + '</div>' +
    '</div>'
  ).join('');
}

function _addNotification(message) {
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  _notifications.unshift({ message, time, read: false });
  if (_notifications.length > 20) _notifications.pop();
  _updateNotifBadge();
  _renderNotifPanel();
  showToast(message);
}

function _updateNotifBadge() {
  const el = document.getElementById('notif-count');
  if (!el) return;
  const unread = _notifications.filter(n => !n.read).length;
  if (unread > 0) {
    el.textContent = unread;
    el.style.cssText = 'display:flex!important;position:absolute;top:-6px;right:-8px;background:#E24B4A;color:white;font-size:10px;font-weight:600;width:16px;height:16px;border-radius:50%;align-items:center;justify-content:center;';
  } else {
    el.style.display = 'none';
  }
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
  }
}

document.addEventListener('click', function(e) {
  const bell = document.getElementById('notif-bell-btn');
  const panel = document.getElementById('notif-panel');
  if (panel && bell && !bell.contains(e.target) && !panel.contains(e.target)) {
    panel.style.display = 'none';
  }
});

function injectNotifPanel() {
  const bellDiv = document.querySelector('.notif-bell');
  if (!bellDiv) return;
  bellDiv.id = 'notif-bell-btn';
  bellDiv.onclick = toggleNotifPanel;
  bellDiv.style.cursor = 'pointer';
  bellDiv.style.position = 'relative';

  const panel = document.createElement('div');
  panel.id = 'notif-panel';
  panel.style.cssText = 'display:none;position:absolute;top:36px;right:0;width:300px;background:white;border:1px solid #e0e0e0;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.12);z-index:9999;max-height:360px;overflow-y:auto;';

  const header = document.createElement('div');
  header.style.cssText = 'padding:12px 16px;border-bottom:1px solid #f0f0f0;font-weight:600;font-size:13px;color:#1a1a2e;position:sticky;top:0;background:white;';
  header.textContent = '🔔 Notifications';

  const body = document.createElement('div');
  body.innerHTML = '<div style="padding:14px 16px;color:#888;font-size:13px;">No notifications yet</div>';

  panel.appendChild(header);
  panel.appendChild(body);
  bellDiv.appendChild(panel);
}

function initSocket(userId) {
  injectNotifPanel();

  const script = document.createElement('script');
  script.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
  script.onload = function() {
    const socket = io(BASE_URL);
    socket.emit('join_room', userId);
    socket.on('notification', function(data) {
      _addNotification(data.message);
    });
  };
  document.head.appendChild(script);
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1a1a2e;color:white;padding:12px 20px;border-radius:8px;font-size:13px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.2);';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => { if (document.body.contains(toast)) document.body.removeChild(toast); }, 4000);
}

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