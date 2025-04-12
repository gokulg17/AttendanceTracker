function logAction(action) {
  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString();
  const log = { action, date, time };

  let logs = JSON.parse(localStorage.getItem("attendanceLogs")) || [];
  logs.push(log);
  localStorage.setItem("attendanceLogs", JSON.stringify(logs));

  const msg = document.getElementById("message");
  msg.innerText = `${action} logged at ${time} on ${date}`;
  setTimeout(() => (msg.innerText = ""), 4000);
}

async function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const logs = JSON.parse(localStorage.getItem("attendanceLogs")) || [];

  if (logs.length === 0) {
    alert("No logs to download.");
    return;
  }

  doc.setFontSize(16);
  doc.text("Attendance Log", 20, 20);
  doc.setFontSize(12);

  let y = 30;
  logs.forEach((log, index) => {
    const line = `${index + 1}. ${log.action} at ${log.time} on ${log.date}`;
    doc.text(line, 20, y);
    y += 10;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save("attendance-log.pdf");
}