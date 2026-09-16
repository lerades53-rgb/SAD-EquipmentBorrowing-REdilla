// ============================================
// BORROW TRANSACTIONS MODULE
// ============================================

let allTransactions = []; // cache of last loaded transactions (joined with equipment name)

// READ - load all transactions, joined with equipment info
async function loadTransactions() {
  const { data, error } = await sb
    .from('borrow_transactions')
    .select('*, equipment(equipment_name, asset_code)')
    .order('id', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  // BR-09: Overdue detection - runs on the client every time data loads
  const today = new Date().toISOString().split('T')[0];
  data.forEach(tx => {
    if (tx.status === 'Borrowed' && tx.due_date < today) {
      tx.status = 'Overdue'; // display-only flag, does not overwrite DB unless you want it to
    }
  });

  allTransactions = data;
  renderTransactionsTable(allTransactions);
  updateDashboardStats();
}

function renderTransactionsTable(list) {
  const tbody = document.getElementById('transactionsTableBody');
  tbody.innerHTML = '';
  list.forEach(tx => {
    const eqName = tx.equipment ? tx.equipment.equipment_name : '(deleted)';
    const eqCode = tx.equipment ? tx.equipment.asset_code : '';
    let badgeClass = 'badge-blue';
    if (tx.status === 'Returned') badgeClass = 'badge-green';
    if (tx.status === 'Overdue') badgeClass = 'badge-red';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${eqName} (${eqCode})</td>
      <td>${tx.borrower_name}</td>
      <td>${tx.borrower_type}</td>
      <td>${tx.department}</td>
      <td>${tx.date_borrowed}</td>
      <td>${tx.due_date}</td>
      <td>${tx.date_returned ?? '-'}</td>
      <td><span class="badge ${badgeClass}">${tx.status}</span></td>
      <td>
        ${tx.status !== 'Returned' ? `<button class="btn-small" onclick="returnEquipment(${tx.id})">Return</button>` : ''}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// CREATE - record a new borrowing transaction
async function recordBorrowing(e) {
  e.preventDefault();
  const equipmentId = document.getElementById('borrowEquipmentSelect').value;
  const borrowerName = document.getElementById('borrowerName').value.trim();
  const borrowerType = document.getElementById('borrowerType').value;
  const department = document.getElementById('borrowDepartment').value.trim();
  const dateBorrowed = document.getElementById('dateBorrowed').value;
  const dueDate = document.getElementById('dueDate').value;
  const msg = document.getElementById('borrowMessage');

  // BR-04: Borrower name must be provided
  if (!borrowerName) {
    msg.textContent = 'Borrower name is required.';
    return;
  }
  // BR-05: Due date cannot be earlier than the borrowing date
  if (dueDate < dateBorrowed) {
    msg.textContent = 'Due date cannot be earlier than the borrowing date.';
    return;
  }
  if (!equipmentId) {
    msg.textContent = 'No available equipment selected.';
    return;
  }

  const { data: { user } } = await sb.auth.getUser();

  // BR-06: New transaction gets "Borrowed" status (default in DB)
  const { error: insertError } = await sb.from('borrow_transactions').insert([{
    equipment_id: equipmentId,
    borrower_name: borrowerName,
    borrower_type: borrowerType,
    department: department,
    date_borrowed: dateBorrowed,
    due_date: dueDate,
    status: 'Borrowed',
    user_id: user.id
  }]);

  if (insertError) {
    msg.textContent = 'Error: ' + insertError.message;
    return;
  }

  // BR-07: Borrowed equipment becomes unavailable
  await sb.from('equipment').update({ availability: 'Borrowed' }).eq('id', equipmentId);

  closeBorrowForm();
  loadEquipment();
  loadTransactions();
}

// UPDATE (return function) - BR-08, BR-12
async function returnEquipment(transactionId) {
  const tx = allTransactions.find(t => t.id === transactionId);
  if (!tx) return;

  // BR-12: A returned transaction cannot be returned a second time
  if (tx.status === 'Returned') {
    alert('This transaction has already been returned.');
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  const { error } = await sb.from('borrow_transactions')
    .update({ date_returned: today, status: 'Returned' })
    .eq('id', transactionId);

  if (error) {
    alert('Error returning equipment: ' + error.message);
    return;
  }

  // BR-08: Returned equipment becomes available again
  await sb.from('equipment').update({ availability: 'Available' }).eq('id', tx.equipment_id);

  loadEquipment();
  loadTransactions();
}

function openBorrowForm() {
  document.getElementById('borrowForm').reset();
  document.getElementById('borrowMessage').textContent = '';
  document.getElementById('dateBorrowed').value = new Date().toISOString().split('T')[0];
  fillEquipmentDropdown(allEquipment);
  document.getElementById('borrowFormBox').classList.remove('hidden');
}

function closeBorrowForm() {
  document.getElementById('borrowFormBox').classList.add('hidden');
}

// SEARCH - by borrower name
function searchTransactions() {
  const term = document.getElementById('transactionSearchInput').value.toLowerCase();
  const filtered = allTransactions.filter(tx =>
    tx.borrower_name.toLowerCase().includes(term)
  );
  renderTransactionsTable(filtered);
}

// FILTER - by status
function filterTransactions() {
  const value = document.getElementById('transactionFilterSelect').value;
  if (value === 'All') {
    renderTransactionsTable(allTransactions);
  } else {
    renderTransactionsTable(allTransactions.filter(tx => tx.status === value));
  }
}

// DASHBOARD STATS
function updateDashboardStats() {
  const total = allEquipment.length;
  const available = allEquipment.filter(e => e.availability === 'Available').length;
  const borrowed = allEquipment.filter(e => e.availability === 'Borrowed').length;
  const returned = allTransactions.filter(t => t.status === 'Returned').length;
  const overdue = allTransactions.filter(t => t.status === 'Overdue').length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statAvailable').textContent = available;
  document.getElementById('statBorrowed').textContent = borrowed;
  document.getElementById('statReturned').textContent = returned;
  document.getElementById('statOverdue').textContent = overdue;
}
