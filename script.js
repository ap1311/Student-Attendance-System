/* =========================================================
   Student Attendance System — script.js
   Vanilla JavaScript: form handling, attendance tracking,
   localStorage persistence and live statistics.
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Constants ---------- */
  var STORAGE_KEY = "sas.students.v1";

  /* ---------- DOM references ---------- */
  var form = document.getElementById("student-form");
  var nameInput = document.getElementById("student-name");
  var rollInput = document.getElementById("student-roll");
  var classInput = document.getElementById("student-class");

  var errorName = document.getElementById("error-name");
  var errorRoll = document.getElementById("error-roll");
  var errorClass = document.getElementById("error-class");

  var tableBody = document.getElementById("student-tbody");
  var table = document.getElementById("student-table");
  var emptyState = document.getElementById("empty-state");
  var recordCount = document.getElementById("record-count");
  var formMessage = document.getElementById("form-message");

  var statTotal = document.getElementById("stat-total");
  var statPresent = document.getElementById("stat-present");
  var statAbsent = document.getElementById("stat-absent");
  var statRate = document.getElementById("stat-rate");

  var classSummaryBody = document.getElementById("class-summary-tbody");
  var classSummaryTable = document.getElementById("class-summary-table");
  var classSummaryEmpty = document.getElementById("class-summary-empty");
  var classCount = document.getElementById("class-count");

  var clearAllBtn = document.getElementById("clear-all-btn");

  /* ---------- State ---------- */
  var students = loadStudents();
  var messageTimer = null;

  /* =========================================================
     Persistence
     ========================================================= */

  function loadStudents() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      // Keep only well-formed records.
      return parsed.filter(function (s) {
        return s && typeof s.name === "string" && s.name.trim() !== "";
      });
    } catch (err) {
      console.warn("Could not read saved attendance data:", err);
      return [];
    }
  }

  function saveStudents() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch (err) {
      console.warn("Could not save attendance data:", err);
      showMessage("Storage is unavailable, changes may not be saved.", "error");
    }
  }

  /* =========================================================
     Helpers
     ========================================================= */

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function createId() {
    return "s_" + Date.now().toString(36) + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  function showMessage(text, type) {
    formMessage.textContent = text;
    formMessage.className = "form-message is-visible " +
      (type === "error" ? "is-error" : "is-success");

    if (messageTimer) clearTimeout(messageTimer);
    messageTimer = setTimeout(function () {
      formMessage.className = "form-message";
    }, 3000);
  }

  /* =========================================================
     Validation
     ========================================================= */

  function setFieldError(input, errorEl, message) {
    var field = input.closest(".form__field");
    errorEl.textContent = message || "";
    if (field) field.classList.toggle("has-error", Boolean(message));
  }

  function clearErrors() {
    setFieldError(nameInput, errorName, "");
    setFieldError(rollInput, errorRoll, "");
    setFieldError(classInput, errorClass, "");
  }

  /**
   * Validates the form. Returns true when every field is valid.
   */
  function validateForm() {
    var valid = true;
    var name = nameInput.value.trim();
    var roll = rollInput.value.trim();
    var className = classInput.value.trim();

    if (name.length < 2) {
      setFieldError(nameInput, errorName, "Please enter a name (at least 2 characters).");
      valid = false;
    } else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(name)) {
      setFieldError(nameInput, errorName, "Name may only contain letters, spaces, and . ' -");
      valid = false;
    } else {
      setFieldError(nameInput, errorName, "");
    }

    if (roll === "") {
      setFieldError(rollInput, errorRoll, "Roll number is required.");
      valid = false;
    } else if (!/^[A-Za-z0-9-]+$/.test(roll)) {
      setFieldError(rollInput, errorRoll, "Roll number may only contain letters, numbers, and hyphens.");
      valid = false;
    } else if (isDuplicateRoll(roll)) {
      setFieldError(rollInput, errorRoll, "This roll number already exists.");
      valid = false;
    } else {
      setFieldError(rollInput, errorRoll, "");
    }

    if (className.length < 1) {
      setFieldError(classInput, errorClass, "Class is required.");
      valid = false;
    } else {
      setFieldError(classInput, errorClass, "");
    }

    return valid;
  }

  function isDuplicateRoll(roll) {
    var target = roll.toLowerCase();
    return students.some(function (s) {
      return String(s.roll).toLowerCase() === target;
    });
  }

  /* =========================================================
     Statistics
     ========================================================= */

  function updateStats() {
    var total = students.length;
    var present = students.filter(function (s) { return s.status === "present"; }).length;
    var absent = total - present;
    var rate = total === 0 ? 0 : Math.round((present / total) * 100);

    statTotal.textContent = total;
    statPresent.textContent = present;
    statAbsent.textContent = absent;
    statRate.textContent = rate + "%";

    recordCount.textContent = total + (total === 1 ? " record" : " records");
  }

  /**
   * Groups the current students by class and returns a sorted summary
   * of totals, present and absent counts, and attendance rate per class.
   */
  function computeClassSummary() {
    var groups = Object.create(null);

    students.forEach(function (student) {
      var key = String(student.className || "").trim() || "Unassigned";

      if (!groups[key]) {
        groups[key] = { className: key, total: 0, present: 0, absent: 0 };
      }

      groups[key].total += 1;
      if (student.status === "present") {
        groups[key].present += 1;
      } else {
        groups[key].absent += 1;
      }
    });

    return Object.keys(groups).map(function (key) {
      var group = groups[key];
      group.rate = group.total === 0
        ? 0
        : Math.round((group.present / group.total) * 100);
      return group;
    }).sort(function (a, b) {
      return a.className.localeCompare(b.className, undefined, {
        numeric: true,
        sensitivity: "base"
      });
    });
  }

  /**
   * Renders the per-class attendance summary table.
   */
  function renderClassSummary() {
    var rows = computeClassSummary();

    classSummaryBody.innerHTML = "";

    if (rows.length === 0) {
      classSummaryTable.hidden = true;
      classSummaryEmpty.hidden = false;
      classCount.textContent = "0 classes";
      return;
    }

    classSummaryTable.hidden = false;
    classSummaryEmpty.hidden = true;

    rows.forEach(function (row) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        '<td class="class-summary__name" data-label="Class">' + escapeHtml(row.className) + '</td>' +
        '<td data-label="Total">' + row.total + '</td>' +
        '<td class="class-summary__present" data-label="Present">' + row.present + '</td>' +
        '<td class="class-summary__absent" data-label="Absent">' + row.absent + '</td>' +
        '<td class="class-summary__rate" data-label="Rate">' + row.rate + '%</td>';
      classSummaryBody.appendChild(tr);
    });

    classCount.textContent = rows.length + (rows.length === 1 ? " class" : " classes");
  }

  /* =========================================================
     Rendering
     ========================================================= */

  function render() {
    tableBody.innerHTML = "";

    if (students.length === 0) {
      table.hidden = true;
      emptyState.hidden = false;
    } else {
      table.hidden = false;
      emptyState.hidden = true;
      students.forEach(function (student, index) {
        tableBody.appendChild(buildRow(student, index));
      });
    }

    updateStats();
    renderClassSummary();
  }

  function buildRow(student, index) {
    var tr = document.createElement("tr");
    tr.dataset.id = student.id;

    var isPresent = student.status === "present";

    tr.innerHTML =
      '<td class="table__index" data-label="#">' + (index + 1) + '</td>' +
      '<td class="table__name" data-label="Name">' + escapeHtml(student.name) + '</td>' +
      '<td class="table__roll" data-label="Roll No.">' + escapeHtml(student.roll) + '</td>' +
      '<td data-label="Class">' + escapeHtml(student.className) + '</td>' +
      '<td data-label="Status">' +
        '<span class="pill ' + (isPresent ? "pill--present" : "pill--absent") + '">' +
          (isPresent ? "Present" : "Absent") +
        '</span>' +
      '</td>' +
      '<td data-label="Actions">' +
        '<div class="table__actions">' +
          '<button type="button" class="btn btn--sm btn--present" data-action="present">Present</button>' +
          '<button type="button" class="btn btn--sm btn--absent" data-action="absent">Absent</button>' +
          '<button type="button" class="btn btn--sm btn--danger" data-action="delete">Delete</button>' +
        '</div>' +
      '</td>';

    return tr;
  }

  /* =========================================================
     Event handlers
     ========================================================= */

  function handleSubmit(event) {
    event.preventDefault();
    clearErrors();

    if (!validateForm()) {
      showMessage("Please fix the highlighted fields.", "error");
      return;
    }

    var statusInput = form.querySelector('input[name="status"]:checked');

    students.push({
      id: createId(),
      name: nameInput.value.trim(),
      roll: rollInput.value.trim(),
      className: classInput.value.trim(),
      status: statusInput ? statusInput.value : "present"
    });

    saveStudents();
    render();

    form.reset();
    // reset() restores the default (Present) radio automatically.
    nameInput.focus();
    showMessage("Student added successfully.", "success");
  }

  function handleTableClick(event) {
    var button = event.target.closest("button[data-action]");
    if (!button) return;

    var row = button.closest("tr");
    if (!row) return;

    var id = row.dataset.id;
    var action = button.dataset.action;
    var student = students.find(function (s) { return s.id === id; });
    if (!student) return;

    if (action === "delete") {
      if (!window.confirm("Delete " + student.name + "'s record?")) return;
      students = students.filter(function (s) { return s.id !== id; });
      saveStudents();
      render();
      showMessage("Record deleted.", "success");
      return;
    }

    if (action === "present" || action === "absent") {
      if (student.status === action) return; // already set
      student.status = action;
      saveStudents();
      render();
      showMessage(
        student.name + " marked " + (action === "present" ? "present" : "absent") + ".",
        "success"
      );
    }
  }

  function handleClearAll() {
    if (students.length === 0) {
      showMessage("There are no records to clear.", "error");
      return;
    }
    if (!window.confirm("Remove all " + students.length + " student records? This cannot be undone.")) {
      return;
    }
    students = [];
    saveStudents();
    render();
    showMessage("All records cleared.", "success");
  }

  /* =========================================================
     Init
     ========================================================= */

  var initialized = false;

  function init() {
    if (initialized) return;
    initialized = true;

    form.addEventListener("submit", handleSubmit);
    tableBody.addEventListener("click", handleTableClick);
    clearAllBtn.addEventListener("click", handleClearAll);

    // Clear a field's error as soon as the user edits it.
    [nameInput, rollInput, classInput].forEach(function (input) {
      input.addEventListener("input", function () {
        var errorEl = input === nameInput ? errorName
          : input === rollInput ? errorRoll
          : errorClass;
        setFieldError(input, errorEl, "");
      });
    });

    render();
  }

  document.addEventListener("DOMContentLoaded", init);

  // In case the script is loaded after the DOM is already ready.
  if (document.readyState !== "loading") {
    init();
  }
})();
