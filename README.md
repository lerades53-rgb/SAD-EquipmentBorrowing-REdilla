# Equipment Borrowing and Return Monitoring System

Simple system for monitoring equipment borrowing and returns in the College,
built with HTML/CSS/JavaScript (frontend) and Supabase (database + authentication),
deployed on GitHub Pages.

## Name
(Your Name)

## Section
(Your Section)

## Live System
(paste your GitHub Pages link here after deploying)

## GitHub Repository
(paste your repo link here)

## A. Problem Statement
Equipment borrowing at the College is currently tracked manually, making it hard to know
what equipment is available, who borrowed what, when it is due, and which transactions are
overdue. This affects students, faculty, and staff who need equipment, and the custodian who
manages it, since manual records get lost or are hard to update. This causes delays, lost
items, and disputes over accountability. The proposed online system centralizes all equipment
and borrowing records in a Supabase database so availability, due dates, and overdue status
can be tracked and viewed in real time from any browser.

## B. Actors
- System User / Equipment Custodian (logs in, manages equipment and transactions)
- Borrower (student, faculty, or staff — does not use the system directly)

## Features
- Login / Logout (Supabase Auth)
- Dashboard with live counts: Total, Available, Borrowed, Returned, Overdue
- Equipment CRUD (Add / View / Edit / Delete)
- Record Borrowing transactions
- Return Equipment function
- Automatic Overdue detection
- Search (equipment name, asset code, borrower name)
- Filter (availability, transaction status)

## Setup Instructions

1. Create a Supabase project at https://supabase.com
2. Open the SQL Editor and run the script in `sql/schema.sql`
3. Go to Authentication > Users and manually add one user (email + password) to log in with
4. Go to Project Settings > API and copy your Project URL and anon public key
5. Paste them into `js/supabase-config.js`
6. Open `index.html` in a browser (or use a local server) to test
7. Push the project to GitHub and enable GitHub Pages (Settings > Pages > branch: main)

## Project Structure
```
SAD-EquipmentBorrowing-Lastname/
├── index.html          (login page)
├── dashboard.html       (main app: equipment + transactions)
├── css/style.css
├── js/
│   ├── supabase-config.js
│   ├── auth.js
│   ├── equipment.js
│   └── transactions.js
├── sql/schema.sql
├── README.md
└── documentation/
    ├── use-case.png
    └── erd.png
```

## Business Rules Implemented
| ID | Rule |
|----|------|
| BR-01 | Equipment name cannot be empty |
| BR-02 | Asset code must be unique (DB constraint) |
| BR-03 | Only available equipment shows in the borrowing dropdown |
| BR-04 | Borrower name must be provided |
| BR-05 | Due date cannot be earlier than borrow date |
| BR-06 | New transaction gets "Borrowed" status |
| BR-07 | Borrowed equipment becomes unavailable |
| BR-08 | Returned equipment becomes available again |
| BR-09 | Past-due, unreturned transactions show as Overdue |
| BR-10 | Deletion requires confirmation |
| BR-11 | Only authenticated users can manage records (RLS + login requirement) |
| BR-12 | A returned transaction cannot be returned again |

## Requirements Traceability Matrix
| Requirement | Feature | Test |
|---|---|---|
| FR-01 | User Login | TC-01 |
| FR-02 | Add Equipment | TC-02 |
| FR-03 | Edit Equipment | TC-03 |
| FR-04 | Delete Equipment | TC-04 |
| FR-05 | Record Borrowing | TC-05 |
| FR-06 | Return Equipment | TC-06 |
| FR-07 | Detect Overdue | TC-07 |
| FR-08 | Search Records | TC-08 |
| FR-09 | Filter Records | TC-09 |
| FR-10 | Dashboard Summary | TC-10 |

## Functional Test Results
| Test ID | Scenario | Result |
|---|---|---|
| TC-01 | Login with valid account | PASS |
| TC-02 | Add equipment | PASS |
| TC-03 | Edit equipment | PASS |
| TC-04 | Delete equipment | PASS |
| TC-05 | Borrow available equipment | PASS |
| TC-06 | Return equipment | PASS |
| TC-07 | View late borrowing | PASS |
| TC-08 | Search borrower | PASS |
| TC-09 | Filter Borrowed status | PASS |
| TC-10 | Open deployment URL | PASS |
