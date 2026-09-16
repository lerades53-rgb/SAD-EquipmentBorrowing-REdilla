// ============================================
// EQUIPMENT MODULE (CRUD + Search)
// ============================================

let allEquipment = []; // cache of last loaded equipment list

// READ - load all equipment from Supabase
async function loadEquipment() {
  const { data, error } = await sb.from('equipment').select('*').order('id');
  if (error) {
    console.error(error);
    return;
  }
  allEquipment = data;
  renderEquipmentTable(allEquipment);
  fillEquipmentDropdown(allEquipment);
  updateDashboardStats();
}

// Render equipment rows into the table
function renderEquipmentTable(list) {
  const tbody = document.getElementById('equipmentTableBody');
  tbody.innerHTML = '';
  list.forEach(eq => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${eq.asset_code}</td>
      <td>${eq.equipment_name}</td>
      <td>${eq.category}</td>
      <td>${eq.condition}</td>
      <td><span class="badge ${eq.availability === 'Available' ? 'badge-green' : 'badge-orange'}">${eq.availability}</span></td>
      <td>
        <button class="btn-small" onclick="openEditEquipment(${eq.id})">Edit</button>
        <button class="btn-small btn-danger" onclick="deleteEquipment(${eq.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// CREATE / UPDATE - Save equipment (add new or edit existing)
async function saveEquipment(e) {
  e.preventDefault();
  const idField = document.getElementById('equipmentId').value;
  const name = document.getElementById('equipmentName').value.trim();
  const category = document.getElementById('equipmentCategory').value.trim();
  const assetCode = document.getElementById('equipmentAssetCode').value.trim();
  const condition = document.getElementById('equipmentCondition').value;
  const msg = document.getElementById('equipmentMessage');

  // BR-01: Equipment name cannot be empty
  if (!name) {
    msg.textContent = 'Equipment name cannot be empty.';
    return;
  }
  if (!assetCode) {
    msg.textContent = 'Asset code cannot be empty.';
    return;
  }

  if (idField) {
    // UPDATE existing equipment
    const { error } = await sb.from('equipment')
      .update({ equipment_name: name, category, asset_code: assetCode, condition })
      .eq('id', idField);
    if (error) {
      // BR-02: Asset code must be unique -> unique constraint will trigger an error
      msg.textContent = 'Error: ' + error.message;
      return;
    }
  } else {
    // CREATE new equipment
    const { error } = await sb.from('equipment')
      .insert([{ equipment_name: name, category, asset_code: assetCode, condition, availability: 'Available' }]);
    if (error) {
      msg.textContent = 'Error: ' + error.message;
      return;
    }
  }

  closeEquipmentForm();
  loadEquipment();
}

// Open the form pre-filled for editing
function openEditEquipment(id) {
  const eq = allEquipment.find(e => e.id === id);
  if (!eq) return;
  document.getElementById('equipmentId').value = eq.id;
  document.getElementById('equipmentName').value = eq.equipment_name;
  document.getElementById('equipmentCategory').value = eq.category;
  document.getElementById('equipmentAssetCode').value = eq.asset_code;
  document.getElementById('equipmentCondition').value = eq.condition;
  document.getElementById('equipmentFormTitle').textContent = 'Edit Equipment';
  document.getElementById('equipmentFormBox').classList.remove('hidden');
}

// Open the form empty, for adding new equipment
function openAddEquipment() {
  document.getElementById('equipmentForm').reset();
  document.getElementById('equipmentId').value = '';
  document.getElementById('equipmentFormTitle').textContent = 'Add Equipment';
  document.getElementById('equipmentMessage').textContent = '';
  document.getElementById('equipmentFormBox').classList.remove('hidden');
}

function closeEquipmentForm() {
  document.getElementById('equipmentFormBox').classList.add('hidden');
}

// DELETE - with confirmation (BR-10)
async function deleteEquipment(id) {
  const confirmed = confirm('Are you sure you want to delete this equipment?');
  if (!confirmed) return;
  const { error } = await sb.from('equipment').delete().eq('id', id);
  if (error) {
    alert('Error deleting: ' + error.message);
    return;
  }
  loadEquipment();
}

// SEARCH - by name or asset code
function searchEquipment() {
  const term = document.getElementById('equipmentSearchInput').value.toLowerCase();
  const filtered = allEquipment.filter(eq =>
    eq.equipment_name.toLowerCase().includes(term) ||
    eq.asset_code.toLowerCase().includes(term)
  );
  renderEquipmentTable(filtered);
}

// FILTER - by availability
function filterEquipment() {
  const value = document.getElementById('equipmentFilterSelect').value;
  if (value === 'All') {
    renderEquipmentTable(allEquipment);
  } else {
    renderEquipmentTable(allEquipment.filter(eq => eq.availability === value));
  }
}

// Fill the equipment dropdown in the borrowing form with AVAILABLE equipment only
function fillEquipmentDropdown(list) {
  const select = document.getElementById('borrowEquipmentSelect');
  if (!select) return;
  select.innerHTML = '';
  list.filter(eq => eq.availability === 'Available').forEach(eq => {
    const opt = document.createElement('option');
    opt.value = eq.id;
    opt.textContent = `${eq.equipment_name} (${eq.asset_code})`;
    select.appendChild(opt);
  });
}
