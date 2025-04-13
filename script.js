function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getLogs() {
  return JSON.parse(localStorage.getItem("attendanceLogs")) || {};
}

function saveLogs(logs) {
  localStorage.setItem("attendanceLogs", JSON.stringify(logs));
}

function showMessage(msg, type) {
  const el = document.getElementById("message");
  el.innerText = msg;
  el.className = `text-${type}`;
  setTimeout(() => el.innerText = "", 4000);
}

function startWork() {
  const logs = getLogs();
  const today = getTodayKey();
  if (logs._started) {
    showMessage("Already started work!", "danger");
    return;
  }
  logs._started = true;
  logs[today] = logs[today] || [];
  logs[today].push({ action: "Start Work", time: new Date().toLocaleTimeString() });
  saveLogs(logs);
  showMessage("Work started!", "success");
  update();
}

function markLeave() {
  const logs = getLogs();
  const today = getTodayKey();
  logs[today] = [{ action: "Leave", time: new Date().toLocaleTimeString() }];
  saveLogs(logs);
  showMessage("Leave marked for today", "warning");
  update();
}

function clearLogs() {
  if (confirm("ലോഗുകൾ മായ്ക്കണോ?")) {
    localStorage.removeItem("attendanceLogs");
    update();
    showMessage("എല്ലാ ലോഗുകളും മായ്ച്ചു.", "danger");
  }
}

function update() {
  const logs = getLogs();
  const today = getTodayKey();

  // Auto-start for today if started previously
  if (logs._started && !logs[today]) {
    logs[today] = [];
    logs[today].push({ action: "Start Work", time: new Date().toLocaleTimeString() });
  }

  const todayLog = logs[today] || [];

  // Add End Work for previous days missing it
  Object.keys(logs).forEach(date => {
    if (date === "_started") return;
    const entries = logs[date];
    const hasStart = entries.some(e => e.action === "Start Work");
    const hasEnd = entries.some(e => e.action === "End Work");
    const isLeave = entries.some(e => e.action === "Leave");
    if (hasStart && !hasEnd && !isLeave && date !== today) {
      entries.push({ action: "End Work", time: "23:59:59" });
    }
  });

  saveLogs(logs);

  // Update status
  const status = document.getElementById("status");
  const started = todayLog.find(e => e.action === "Start Work");
  const ended = todayLog.find(e => e.action === "End Work");
  const isLeave = todayLog.find(e => e.action === "Leave");

  if (isLeave) {
    status.innerText = "ഇന്ന് അവധി.";
    status.className = "text-warning text-center fw-semibold";
  } else if (started && !ended) {
    status.innerText = "ഇപ്പോൾ ജോലിയിൽ ആണ്.";
    status.className = "text-success text-center fw-semibold";
  } else if (started && ended) {
    status.innerText = "ഇന്ന് ജോലി അവസാനിച്ചു.";
    status.className = "text-muted text-center fw-semibold";
  } else {
    status.innerText = "ജോലി ആരംഭിച്ചില്ല.";
    status.className = "text-danger text-center fw-semibold";
  }

  // Today log
  const todayList = document.getElementById("todayLog");
  todayList.innerHTML = "";
  todayLog.forEach(log => {
    const li = document.createElement("li");
    li.className = "list-group-item";
    li.textContent = `${log.time} - ${log.action}`;
    todayList.appendChild(li);
  });

  // All days log
  const allList = document.getElementById("allDaysLog");
  allList.innerHTML = "";

  let totalDays = 0;
  let totalLeaves = 0;

  Object.keys(logs).sort().forEach(date => {
    if (date === "_started") return;
    const dayLogs = logs[date];
    const isLeave = dayLogs.find(log => log.action === "Leave");
    const hasWork = dayLogs.find(log => log.action === "Start Work");
    if (hasWork) totalDays++;
    if (isLeave) totalLeaves++;

    const li = document.createElement("li");
    li.className = "list-group-item";
    if (date === today) li.classList.add("today");

    li.innerHTML = `<strong>${date}:</strong> ${dayLogs.map(log => `${log.time} - ${log.action}`).join(', ')}`;
    allList.appendChild(li);
  });

  document.getElementById("totalDays").innerText = totalDays;
  document.getElementById("totalLeaves").innerText = totalLeaves;
}

update();