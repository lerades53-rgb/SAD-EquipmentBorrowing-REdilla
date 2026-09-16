// ============================================
// RESERVATIONS MODULE (Submit, Approve, Status, Conflict)
// ============================================

let allReservations = [];
let currentUserRole = 'requester'; // default, will be set after login
let currentUserId = null;

// Get current logged-in user's role from profiles table
async function loadCurrentUserRole() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  currentUserId = user.id;

  const { data, error } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (error || !data) {
    currentUserRole = 'requester';
  } else {
    currentUserRole = data.role;
  }
  applyRoleUI();
}

// Show/hide buttons based on role
function applyRoleUI() {
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = (currentUserRole === 'admin') ? '' : 'none';
  });
  document.querySelectorAll('.staff-only').forEach(el => {
    el.style.display = (currentUserRole === 'admin' || currentUserRole === 'staff') ? '' : 'none';
  });
  document.querySelectorAll('.requester-only').forEach(el => {
    el.style.display = (currentUserRole === 'requester') ? '' : 'none';
  });
}

// READ - load reservations (RLS already limits what each role sees)
async function loadReservations() {
  const { data, error } = await sb.from('reservations')
    .select('*, facilities(name, facility_code)')
    .order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    return;
  }
  allReservations = data;
  renderReservationsTable(allReservations);
}

// Render reservations table
function renderReservationsTable(list) {
  const tbody = document.getElementById('reservationsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  list.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.facilities ? r.facilities.name : r.facility_id}</td>
      <td>${r.purpose || ''}</td>
      <td>${new Date(r.start_time).toLocaleString()}</td>
      <td>${new Date(r.end_time).toLocaleString()}</td>
      <td><span class="badge">${r.status}</span></td>
      <td>${renderReservationActions(r)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Different action buttons depending on role + status
function renderReservationActions(r) {
  let buttons = '';

  // Admin: approve/reject pending
  if (currentUserRole === 'admin' && r.status === 'Pending') {
    buttons += `<button class="btn-small" onclick="approveReservation('${r.id}')">Approve</button>`;
    buttons += `<button class="btn-small btn-danger" onclick="rejectReservation('${r.id}')">Reject</button>`;
  }

  // Staff: mark In Use / Completed
  if ((currentUserRole === 'staff' || currentUserRole === 'admin') && r.status === 'Scheduled') {
    buttons += `<button class="btn-small" onclick="markInUse('${r.id}')">Mark In Use</button>`;
  }
  if ((currentUserRole === 'staff' || currentUserRole === 'admin') && r.status === 'In Use') {
    buttons += `<button class="btn-small" onclick="markCompleted('${r.id}')">Complete</button>`;
  }

  // Requester: cancel own pending
  if (currentUserRole === 'requester' && r.status === 'Pending' && r.requester_id === currentUserId) {
    buttons += `<button class="btn-small btn-danger" onclick="cancelReservation('${r.id}')">Cancel</button>`;
  }

  return buttons || '-';
}

// CREATE - submit new reservation (Requester)
async function submitReservation(e) {
  e.preventDefault();
  const facilityId = document.getElementById('reservationFacilitySelect').value;
  const purpose = document.getElementById('reservationPurpose').value.trim();
  const startTime = document.getElementById('reservationStart').value;
  const endTime = document.getElementById('reservationEnd').value;
  const msg = document.getElementById('reservationMessage');

  // BR-B4-02: start must precede end
  if (new Date(startTime) >= new Date(endTime)) {
    msg.textContent = 'Start time must be before end time.';
    return;
  }

  const { data: { user } } = await sb.auth.getUser();

  const { error } = await sb.from('reservations').insert([{
    facility_id: facilityId,
    requester_id: user.id,
    purpose,
    start_time: startTime,
    end_time: endTime,
    status: 'Pending'
  }]);

  if (error) {
    // Conflict trigger error (BR-B4-03) will show up here
    msg.textContent = 'Error: ' + error.message;
    return;
  }

  closeReservationForm();
  loadReservations();
}

// Admin approves -> becomes Scheduled directly (per workflow)
async function approveReservation(id) {
  const { error } = await sb.from('reservations').update({ status: 'Scheduled' }).eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  loadReservations();
}

async function rejectReservation(id) {
  const { error } = await sb.from('reservations').update({ status: 'Rejected' }).eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  loadReservations();
}

async function markInUse(id) {
  const { error } = await sb.from('reservations').update({ status: 'In Use' }).eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  loadReservations();
}

async function markCompleted(id) {
  const { error } = await sb.from('reservations').update({ status: 'Completed' }).eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  loadReservations();
}

async function cancelReservation(id) {
  const confirmed = confirm('Cancel this reservation?');
  if (!confirmed) return;
  const { error } = await sb.from('reservations').update({ status: 'Cancelled' }).eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  loadReservations();
}

function openAddReservation() {
  document.getElementById('reservationForm').reset();
  document.getElementById('reservationMessage').textContent = '';
  document.getElementById('reservationFormBox').classList.remove('hidden');
}

function closeReservationForm() {
  document.getElementById('reservationFormBox').classList.add('hidden');
}

// Load audit logs (admin/staff view)
async function loadAuditLogs() {
  const { data, error } = await sb.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
  if (error) { console.error(error); return; }
  const tbody = document.getElementById('auditLogsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  data.forEach(log => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(log.created_at).toLocaleString()}</td>
      <td>${log.action}</td>
      <td>${log.table_name || ''}</td>
    `;
    tbody.appendChild(tr);
  });
}

