// ============================================
// FACILITIES MODULE (CRUD)
// ============================================

let allFacilities = [];

// READ - load all facilities
async function loadFacilities() {
  const { data, error } = await sb.from('facilities').select('*').order('id');
  if (error) {
    console.error(error);
    return;
  }
  allFacilities = data;
  renderFacilitiesTable(allFacilities);
  fillFacilityDropdown(allFacilities);
}

// Render facilities into the table
function renderFacilitiesTable(list) {
  const tbody = document.getElementById('facilitiesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  list.forEach(f => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${f.facility_code}</td>
      <td>${f.name}</td>
      <td>${f.type || ''}</td>
      <td>${f.condition || ''}</td>
      <td><span class="badge ${f.status === 'Active' ? 'badge-green' : 'badge-orange'}">${f.status}</span></td>
      <td>
        <button class="btn-small" onclick="openEditFacility('${f.id}')">Edit</button>
        <button class="btn-small btn-danger" onclick="deleteFacility('${f.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// CREATE / UPDATE facility
async function saveFacility(e) {
  e.preventDefault();
  const idField = document.getElementById('facilityId').value;
  const name = document.getElementById('facilityName').value.trim();
  const type = document.getElementById('facilityType').value.trim();
  const facilityCode = document.getElementById('facilityCode').value.trim();
  const condition = document.getElementById('facilityCondition').value;
  const status = document.getElementById('facilityStatus').value;
  const msg = document.getElementById('facilityMessage');

  if (!name) { msg.textContent = 'Facility name cannot be empty.'; return; }
  if (!facilityCode) { msg.textContent = 'Facility code cannot be empty.'; return; }

  if (idField) {
    const { error } = await sb.from('facilities')
      .update({ name, type, facility_code: facilityCode, condition, status })
      .eq('id', idField);
    if (error) { msg.textContent = 'Error: ' + error.message; return; }
  } else {
    const { error } = await sb.from('facilities')
      .insert([{ name, type, facility_code: facilityCode, condition, status: status || 'Active' }]);
    if (error) { msg.textContent = 'Error: ' + error.message; return; }
  }

  closeFacilityForm();
  loadFacilities();
}

function openEditFacility(id) {
  const f = allFacilities.find(x => x.id === id);
  if (!f) return;
  document.getElementById('facilityId').value = f.id;
  document.getElementById('facilityName').value = f.name;
  document.getElementById('facilityType').value = f.type || '';
  document.getElementById('facilityCode').value = f.facility_code;
  document.getElementById('facilityCondition').value = f.condition || 'Good';
  document.getElementById('facilityStatus').value = f.status;
  document.getElementById('facilityFormTitle').textContent = 'Edit Facility';
  document.getElementById('facilityFormBox').classList.remove('hidden');
}

function openAddFacility() {
  document.getElementById('facilityForm').reset();
  document.getElementById('facilityId').value = '';
  document.getElementById('facilityFormTitle').textContent = 'Add Facility';
  document.getElementById('facilityMessage').textContent = '';
  document.getElementById('facilityFormBox').classList.remove('hidden');
}

function closeFacilityForm() {
  document.getElementById('facilityFormBox').classList.add('hidden');
}

async function deleteFacility(id) {
  const confirmed = confirm('Are you sure you want to delete this facility?');
  if (!confirmed) return;
  const { error } = await sb.from('facilities').delete().eq('id', id);
  if (error) { alert('Error deleting: ' + error.message); return; }
  loadFacilities();
}

// Fill dropdown with ACTIVE facilities only (BR-B4-01, BR-B4-08)
function fillFacilityDropdown(list) {
  const select = document.getElementById('reservationFacilitySelect');
  if (!select) return;
  select.innerHTML = '';
  list.filter(f => f.status === 'Active').forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.textContent = `${f.name} (${f.facility_code})`;
    select.appendChild(opt);
  });
}