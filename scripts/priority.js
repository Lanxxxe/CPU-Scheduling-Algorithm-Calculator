const addRowButton = document.getElementById("addRow");
const calculateButton = document.getElementById("calculate");
const resetButton = document.getElementById("resetTable");
const dataTable = document.getElementById("dataTable").querySelector("tbody");
let processCounter = 2;

// Function to get color for each process
const getProcessColor = (processId) => {
  const colors = [
      '#2196F3', // Blue
      '#F44336', // Red
      '#4CAF50', // Green
      '#FF9800', // Orange
      '#9C27B0', // Purple
      '#009688', // Teal
      '#E91E63', // Pink
      '#673AB7', // Deep Purple
      '#3F51B5', // Indigo
      '#00BCD4', // Cyan
      '#8BC34A', // Light Green
      '#FFC107', // Amber
      '#795548', // Brown
      '#607D8B', // Blue Grey
      '#FF5722'  // Deep Orange
  ];

  if (processId === 'idle') {
      return '#f0f0f0';
  }

  return colors[(processId - 1) % colors.length];
}

const handleAddRow = () => {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${processCounter}</td>
    <td><input type="number" class="arrivalTime" placeholder="AT" min="0"></td>
    <td><input type="number" class="burstTime" placeholder="BT" min="0"></td>
    <td><input type="number" class="priority" placeholder="Priority" min="0"></td>
    <td class="endTime">-</td>
    <td class="turnaroundTime">-</td>
    <td class="waitingTime">-</td>
    <td><button onclick="removeRow(this)" class="button remove">Remove</button></td>
  `;
  dataTable.appendChild(row);
  processCounter++;
}

const handleResetButton = () => {
  const rows = dataTable.querySelectorAll('tr');
  rows.forEach((row, index) => {
    if (index !== 0) {
      row.remove();
    }
  });
  processCounter = 2;

  // Reset first row
  const firstRowCells = rows[0].querySelectorAll('td');
  firstRowCells[1].innerHTML = '<input type="number" class="arrivalTime" placeholder="AT">';
  firstRowCells[2].innerHTML = '<input type="number" class="burstTime" placeholder="BT">';
  firstRowCells[3].innerHTML = '<input type="number" class="priority" placeholder="Priority">';
  ["4", "5", "6"].forEach(i => (firstRowCells[i].textContent = "-"));
  
  // Reset results
  document.getElementById("totalTurnaroundTime").textContent = "Total TT";
  document.getElementById("totalProcessesTT").textContent = "Processes";
  document.getElementById("attResult").textContent = "0";
  document.getElementById("totalWaitingTime").textContent = "Total WT";
  document.getElementById("totalProcessesWT").textContent = "Processes";
  document.getElementById("awtResult").textContent = "0";
  document.getElementById("cpuBusy").textContent = "Sum (BT)";
  document.getElementById("totalTime").textContent = "Total End Time";
  document.getElementById("cpuUtilizationResult").textContent = "0%";

  // Clear Gantt chart
  const ganttDiv = document.querySelector('.gantt.chart');
  ganttDiv.innerHTML = '<h2>Gantt Chart</h2>';
}

function removeRow(button) {
  const row = button.closest('tr');
  row.remove();
  
  // Update Process IDs after removal
  processCounter--; // Increment the Process
  updateProcessIds();
}

// Function to update Process IDs after removal
function updateProcessIds() {
  const rows = document.getElementById('dataTable').getElementsByTagName('tr');
  let counter = 1;
  
  for (let row of rows) {
      const cells = row.getElementsByTagName('td');
      if (cells.length > 0) { // Skip the header row
          cells[0].textContent = counter; // Update Process ID
          counter++;
      }
  }
}

// Function to render Gantt chart
const renderGanttChart = (processes) => {
  const ganttDiv = document.querySelector('.gantt.chart');
  ganttDiv.innerHTML = '<h2>Gantt Chart - Priority</h2>';
  
  // Create legend
  const legendContainer = document.createElement('div');
  legendContainer.className = 'gantt-legend';
  legendContainer.style.cssText = 'margin-bottom: 15px; display: flex; flex-wrap: wrap; gap: 10px;';

  // Get unique processes for legend
  const uniqueProcesses = [...new Set(processes.map(p => p.process))];
  uniqueProcesses.sort((a, b) => a - b);

  // Create legend items
  uniqueProcesses.forEach(processId => {
      const legendItem = document.createElement('div');
      legendItem.style.cssText = 'display: flex; align-items: center; margin-right: 15px;';
      
      const colorBox = document.createElement('div');
      colorBox.style.cssText = `
          width: 20px;
          height: 20px;
          margin-right: 5px;
          background-color: ${getProcessColor(parseInt(processId))};
          border: 1px solid #666;
      `;
      
      const label = document.createElement('span');
      label.textContent = `Process ${processId}`;
      
      legendItem.appendChild(colorBox);
      legendItem.appendChild(label);
      legendContainer.appendChild(legendItem);
  });
  
  const chartContainer = document.createElement('div');
  chartContainer.className = 'gantt-container';
  chartContainer.style.cssText = 'position: relative; margin-top: 20px; padding: 10px;';

  const totalTime = Math.max(...processes.map(p => p.endTime));
  const containerWidth = 800;
  const scale = containerWidth / totalTime;

  // Create process bars
  processes.forEach(process => {
      const startTime = process.endTime - process.burstTime;
      if (startTime > 0) {
          // Add idle time bar if there's a gap
          const idleBar = document.createElement('div');
          const prevEndTime = processes[processes.indexOf(process) - 1]?.endTime || 0;
          if (startTime > prevEndTime) {
              const idleWidth = (startTime - prevEndTime) * scale;
              idleBar.style.cssText = `
                  position: absolute;
                  height: 40px;
                  width: ${idleWidth}px;
                  left: ${prevEndTime * scale}px;
                  top: 20px;
                  background-color: #f0f0f0;
                  border: 1px solid #666;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 12px;
                  color: #666;
              `;
              idleBar.textContent = 'Idle';
              chartContainer.appendChild(idleBar);
          }
      }

      const bar = document.createElement('div');
      const width = process.burstTime * scale;
      const left = startTime * scale;
      
      bar.style.cssText = `
          position: absolute;
          height: 40px;
          width: ${width}px;
          left: ${left}px;
          top: 20px;
          background-color: ${getProcessColor(parseInt(process.process))};
          border: 1px solid #666;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
      `;
      
      bar.textContent = `P${process.process}`;
      bar.title = `Process ${process.process}
      Start Time: ${startTime}
      End Time: ${process.endTime}
      Burst Time: ${process.burstTime}`;
            
      chartContainer.appendChild(bar);
  });

  // Create time markers
  const timelineContainer = document.createElement('div');
  timelineContainer.style.cssText = 'position: relative; height: 20px; margin-top: 70px;';

  for (let t = 0; t <= totalTime; t++) {
      const marker = document.createElement('div');
      marker.style.cssText = `
          position: absolute;
          left: ${t * scale}px;
          top: 0;
          transform: translateX(-50%);
          font-size: 12px;
      `;
      marker.textContent = t;
      timelineContainer.appendChild(marker);
  }

  chartContainer.appendChild(timelineContainer);
  // ganttDiv.appendChild(legendContainer);
  ganttDiv.appendChild(chartContainer);
}


const handleCalculateButton = () => {
  const rows = Array.from(dataTable.querySelectorAll("tr"));
  const processes = rows.map(row => {
    return {
      process: row.querySelector("td:first-child").textContent,
      arrivalTime: parseInt(row.querySelector(".arrivalTime").value || 0),
      burstTime: parseInt(row.querySelector(".burstTime").value || 0),
      priority: parseInt(row.querySelector(".priority").value || 0),
      endTime: 0,
      rowElement: row
    };
  });

  // Sort processes by arrival time first, then priority
  processes.sort((a, b) => {
    if (a.arrivalTime === b.arrivalTime) {
      return a.priority - b.priority; // Lower priority number = higher priority
    }
    return a.arrivalTime - b.arrivalTime;
  });

  let currentTime = 0;
  let totalTurnaroundTime = 0;
  let totalWaitingTime = 0;
  let cpuBusyTime = 0;  // Initialize CPU busy time

  processes.forEach((process, index) => {
    if (currentTime < process.arrivalTime) {
      currentTime = process.arrivalTime; // CPU idle until process arrives
    }

    const startTime = currentTime;
    const endTime = startTime + process.burstTime;
    const turnaroundTime = endTime - process.arrivalTime;
    const waitingTime = turnaroundTime - process.burstTime;

    process.endTime = endTime;

    // Update the table rows with calculated values
    process.rowElement.querySelector(".endTime").textContent = endTime;
    process.rowElement.querySelector(".turnaroundTime").textContent = turnaroundTime;
    process.rowElement.querySelector(".waitingTime").textContent = waitingTime;

    totalTurnaroundTime += turnaroundTime;
    totalWaitingTime += waitingTime;
    cpuBusyTime += process.burstTime;  // Accumulate CPU busy time
    currentTime = endTime; // Update current time to the end of the current process
  });

  // Calculate final results
  const totalProcesses = processes.length;
  const averageTurnaroundTime = (totalTurnaroundTime / totalProcesses).toFixed(2);
  const averageWaitingTime = (totalWaitingTime / totalProcesses).toFixed(2);
  const cpuUtilization = ((cpuBusyTime / currentTime) * 100).toFixed(2); // Correct CPU utilization

  // Display final results
  document.getElementById("totalTurnaroundTime").textContent = totalTurnaroundTime;
  document.getElementById("totalProcessesTT").textContent = totalProcesses;
  document.getElementById("attResult").textContent = averageTurnaroundTime;

  document.getElementById("totalWaitingTime").textContent = totalWaitingTime;
  document.getElementById("totalProcessesWT").textContent = totalProcesses;
  document.getElementById("awtResult").textContent = averageWaitingTime;

  document.getElementById("cpuBusy").textContent = cpuBusyTime;
  document.getElementById("totalTime").textContent = currentTime;
  document.getElementById("cpuUtilizationResult").textContent = `${cpuUtilization}%`;

  renderGanttChart(processes);
}

// Calculate Button Event
calculateButton.addEventListener("click", handleCalculateButton);
// Add Row Event
addRowButton.addEventListener("click", handleAddRow);
// Reset Table Event
resetButton.addEventListener('click', handleResetButton);
