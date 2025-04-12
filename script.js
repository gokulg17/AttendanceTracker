function getTodayKey() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

function getLogs() {
  return JSON.parse(localStorage.getItem("attendanceLogs")) || {};
}

function saveLogs(logs) {
  localStorage.setItem("attendanceLogs", JSON.stringify(logs));
}

function logAction(action) {
  const logs = getLogs();
  const todayKey = getTodayKey();
  logs[todayKey] = logs[todayKey] || [];

  const todayLogs = logs[todayKey];

  if (action === "Start Work" && todayLogs.find(log => log.action === "Start Work")) {
    showMessage("ഇന്ന് ഇതിനകം സ്റ്റാർട്ട് ചെയ്‌തു!", "danger");
    return;
  }

  if (action === "End Work") {
    if (!todayLogs.find(log => log.action === "Start Work")) {
      showMessage("ആദ്യം സ്റ്റാർട്ട് ചെയ്യണം!", "danger");
      return;
    }
    if (todayLogs.find(log => log.action === "End Work")) {
      showMessage("ഇന്ന് ഇതിനകം എന്റ് ചെയ്‌തു!", "danger");
      return;
    }
  }

  if (action === "Emergency Leave" && todayLogs.find(log => log.action === "Emergency Leave")) {
    showMessage("ഇന്ന് ഇതിനകം അവധി എടുത്തു!", "danger");
    return;
  }

  const now = new Date();
  todayLogs.push({
    action,
    time: now.toLocaleTimeString()
  });

  logs[todayKey] = todayLogs;
  saveLogs(logs);

  const actionMap = {
    "Start Work": "സ്റ്റാർട്ട് ചെയ്തു",
    "End Work": "എന്റ് ചെയ്തു",
    "Emergency Leave": "അവധിയിലായി"
  };

  showMessage(`${now.toLocaleTimeString()} - ${actionMap[action]}`, "success");
  updateStatus();
  renderTodayLog();
  renderAllDays();
  updateSummary();
}

function showMessage(msg, type) {
  const el = document.getElementById("message");
  el.innerText = msg;
  el.className = `text-${type}`;
  setTimeout(() => el.innerText = "", 4000);
}

function updateStatus() {
  const logs = getLogs();
  const todayKey = getTodayKey();
  const todayLogs = logs[todayKey] || [];
  const status = document.getElementById("status");

  const started = todayLogs.find(log => log.action === "Start Work");
  const ended = todayLogs.find(log => log.action === "End Work");

  if (started && !ended) {
    status.innerText = "ഇപ്പോൾ ജോലിയിൽ ആണ്.";
    status.classList.add("text-success");
  } else if (started && ended) {
    status.innerText = "ഇന്ന് ജോലി അവസാനിച്ചു.";
    status.classList.remove("text-success");
  } else {
    status.innerText = "ഇന്ന് ജോലി ആരംഭിച്ചിട്ടില്ല.";
    status.classList.remove("text-success");
  }
}

function renderTodayLog() {
  const logs = getLogs();
  const todayKey = getTodayKey();
  const todayLogs = logs[todayKey] || [];
  const list = document.getElementById("todayLog");
  list.innerHTML = "";

  const actionText = {
    "Start Work": "സ്റ്റാർട്ട് ചെയ്തു",
    "End Work": "എന്റ് ചെയ്തു",
    "Emergency Leave": "അവധിയിലായി"
  };

  todayLogs.forEach(log => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = `${log.time} - ${actionText[log.action]}`;
    list.appendChild(li);
  });
}

function renderAllDays() {
  const logs = getLogs();
  const dates = Object.keys(logs).sort();
  const list = document.getElementById("allDaysLog");
  list.innerHTML = "";

  dates.forEach(date => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = `${date}: ${logs[date].length} ലോഗുകൾ`;
    list.appendChild(li);
  });
}

function updateSummary() {
  const logs = getLogs();
  let workDays = 0;
  let leaveDays = 0;

  Object.values(logs).forEach(entries => {
    const hasStart = entries.some(e => e.action === "Start Work");
    const hasLeave = entries.some(e => e.action === "Emergency Leave");
    if (hasLeave) leaveDays++;
    else if (hasStart) workDays++;
  });

  document.getElementById("totalDays").textContent = workDays;
  document.getElementById("totalLeaves").textContent = leaveDays;
}

function clearLogs() {
  if (confirm("എല്ലാം മായ്ക്കണോ?")) {
    localStorage.removeItem("attendanceLogs");
    updateStatus();
    renderTodayLog();
    renderAllDays();
    updateSummary();
    showMessage("എല്ലാം മായ്ച്ചു.", "danger");
  }
}

function autoEndWorkIfMissed() {
  const logs = getLogs();
  const todayKey = getTodayKey();
  const todayLogs = logs[todayKey] || [];

  const hasStart = todayLogs.find(log => log.action === "Start Work");
  const hasEnd = todayLogs.find(log => log.action === "End Work");

  if (hasStart && !hasEnd) {
    todayLogs.push({
      action: "End Work",
      time: "00:00:00"
    });
    logs[todayKey] = todayLogs;
    saveLogs(logs);
    showMessage("മിഡ്നൈറ്റിൽ ജോലി അവസാനിച്ചു (ഓട്ടോമാറ്റിക്).", "warning");
  }
}

autoEndWorkIfMissed();
updateStatus();
renderTodayLog();
renderAllDays();
updateSummary();