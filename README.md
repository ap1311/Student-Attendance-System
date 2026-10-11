# Student Attendance System

A lightweight, dependency-free web app for tracking daily student attendance. Add students, mark them present or absent, and watch live statistics update. Everything is saved automatically in the browser's `localStorage` — no server, no build step, no installation.

## Features

- **Add students** with full name, roll number, and class.
- **Mark attendance** per student with one click (Present / Absent).
- **Live summary cards** for total students, present, absent, and overall attendance rate.
- **Inline validation** for names, roll numbers, and classes, including duplicate roll number detection.
- **Delete individual records** or clear all records at once (with confirmation).
- **Automatic persistence** to `localStorage` — your data survives page reloads.
- **Responsive design** that collapses the table into readable cards on small screens.
- **Accessible** markup: labelled form fields, ARIA live regions, and keyboard-friendly controls.

## Tech Stack

- **HTML5** — semantic structure and native form controls.
- **CSS3** — custom properties (design tokens), CSS grid/flexbox layout, and media queries.
- **Vanilla JavaScript** — no frameworks or libraries, wrapped in a single IIFE.

## Getting Started

No dependencies or build tools are required.

1. Clone the repository:

   ```bash
   git clone https://github.com/ap1311/Student-Attendance-System.git
   cd Student-Attendance-System
   ```

2. Open `index.html` directly in your browser.

   Or, for a local dev server (optional), run any static file server in the project folder, for example:

   ```bash
   npx serve .
   ```

## Usage

1. Enter the student's **Full Name**, **Roll Number**, and **Class** in the form.
2. Choose an initial **Status** (Present or Absent).
3. Click **Add Student** — the record appears in the table and the statistics update.
4. Use the **Present**, **Absent**, and **Delete** buttons in each row to manage records.
5. Use **Clear All** in the header to remove every record.

Attendance rate is calculated as `present ÷ total × 100`, rounded to the nearest whole percent.

## Project Structure

```
Student-Attendance-System/
├── index.html    # Markup: header, stats, add-student form, records table
├── style.css     # Design tokens, layout, components, responsive rules
├── script.js     # State, persistence, validation, rendering, event handling
└── README.md
```

## How It Works

- **State** lives in a `students` array in memory, loaded from and saved to `localStorage` under the key `sas.students.v1`.
- **Validation** runs on submit; a field's error clears as soon as the user edits it.
- **Rendering** rebuilds the table from the current array and refreshes the stat cards. User-entered values are HTML-escaped before insertion.
- **Storage failures** (for example, private browsing) are caught and surfaced to the user as a non-blocking message.

## Data & Privacy

All data is stored locally in your own browser and is never transmitted anywhere. Clearing your browser's site data will erase saved records.

## License

No license has been added yet. Add one (for example, the MIT License) if you intend to distribute this project.
