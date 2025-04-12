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

  if (action === "Start Work") {
    if (todayLogs.find(log => log.action === "Start Work")) {
      showMessage("ഇന്ന് ഇതിനകം സ്റ്റാർട്ട് ചെയ്‌തു!", "danger");
      return;
    }
  }

  if (action === "End Work") {
    const hasStart = todayLogs.find(log => log.action === "Start Work");
    const hasEnd = todayLogs.find(log => log.action === "End Work");
    if (!hasStart) {
      showMessage("ആദ്യം സ്റ്റാർട്ട് ചെയ്യണം!", "danger");
      return;
    }
    if (hasEnd) {
      showMessage("ഇന്ന് ഇതിനകം എന്റ് ചെയ്‌തു!", "danger");
      return;
    }
  }

  if (action === "Emergency Leave") {
    if (todayLogs.find(log => log.action === "Emergency Leave")) {
      showMessage("ഇന്ന് ഇതിനകം അവധി എടുത്തിട്ടുണ്ട്!", "danger");
      return;
    }
  }

  const now = new Date();
  todayLogs.push({
    action,
    time: now.toLocaleTimeString()
  });

  logs[todayKey] = todayLogs;
  saveLogs(logs);

  const actionMap = {
    "Start Work": "സ്റ്റാർട്ട് ചെയ്തത്",
    "End Work": "എന്റ് ചെയ്തത്",
    "Emergency Leave": "അവധി രേഖപ്പെടുത്തി"
  };

  showMessage(`${now.toLocaleTimeString()} - ${actionMap[action]}`, "success");
  updateStatus();
  renderTodayLog();
  renderLast7Days();
  updateTotals();
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
    status.innerText = "ഇന്ന് ജോലി ആരംഭിച്ചില്ല.";
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
    "Start Work": "സ്റ്റാർട്ട് ചെയ്തത്",
    "End Work": "എന്റ് ചെയ്തത്",
    "Emergency Leave": "അപകട അവധി"
  };

  todayLogs.forEach(log => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = `${log.time} - ${actionText[log.action]}`;
    list.appendChild(li);
  });
}

function renderLast7Days() {
  const logs = getLogs();
  const last7Days = Object.keys(logs).sort().slice(-7);
  const list = document.getElementById("last7Days");
  list.innerHTML = "";

  last7Days.forEach(date => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = `${date}: ${logs[date].length} ലോഗുകൾ`;
    list.appendChild(li);
  });
}

function updateTotals() {
  const logs = getLogs();
  let totalWorked = 0;
  let totalLeaves = 0;

  for (let date in logs) {
    const dayLogs = logs[date];
    if (dayLogs.some(log => log.action === "Emergency Leave")) {
      totalLeaves++;
    } else if (dayLogs.some(log => log.action === "Start Work")) {
      totalWorked++;
    }
  }

  document.getElementById("totalDays").innerText = totalWorked;
  document.getElementById("totalLeaves").innerText = totalLeaves;
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const logs = getLogs();
  let y = 20;

  doc.setFontSize(16);
  doc.text("ഹാജർ രേഖ", 20, y);
  y += 10;
  doc.setFontSize(12);

  const actionMap = {
    "Start Work": "സ്റ്റാർട്ട് ചെയ്തു",
    "End Work": "എന്റ് ചെയ്തു",
    "Emergency Leave": "അവധിയിലായി"
  };

  const dates = Object.keys(logs).sort();

  dates.forEach(date => {
    doc.text(`${date}:`, 20, y);
    y += 8;

    logs[date].forEach(entry => {
      doc.text(`- ${entry.time} - ${actionMap[entry.action]}`, 25, y);
      y += 8;
    });

    y += 5;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save("attendance-log.pdf");
}

function clearLogs() {
  const confirmClear = confirm("എല്ലാം മായ്ക്കണോ?");
  if (confirmClear) {
    localStorage.removeItem("attendanceLogs");
    updateStatus();
    renderTodayLog();
    renderLast7Days();
    updateTotals();
    showMessage("എല്ലാ ലോഗുകളും മായ്ച്ചു.", "danger");
  }
}

updateStatus();
renderTodayLog();
renderLast7Days();
updateTotals();