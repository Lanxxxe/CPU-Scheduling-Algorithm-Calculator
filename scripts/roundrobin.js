// Add process functionality
const addRowButton = document.getElementById("addRow");
const resetButton = document.getElementById("resetTable");
const dataTable = document.getElementById("dataTable").getElementsByTagName("tbody")[0];
let processCount = 1;


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
  processCount++;
  const row = dataTable.insertRow();
  row.innerHTML = `
    <td>${processCount}</td>
    <td><input type="number" class="arrivalTime" placeholder="AT" min="0" /></td>
    <td><input type="number" class="burstTime" placeholder="BT" min="0" /></td>
    <td class="endTime">-</td>
    <td class="turnaroundTime">-</td>
    <td class="waitingTime">-</td>
    <td><button onclick="removeRow(this)" class="button remove">Remove</button></td>
  `;
}

const handleResetButton = () => {
  // Clear table
  dataTable.innerHTML = `
    <tr>
      <td>1</td>
      <td><input type="number" class="arrivalTime" placeholder="AT" min="0" /></td>
      <td><input type="number" class="burstTime" placeholder="BT" min="0" /></td>
      <td class="endTime">-</td>
      <td class="turnaroundTime">-</td>
      <td class="waitingTime">-</td>
      <td><button onclick="removeRow(this)" class="button remove">Remove</button></td>
    </tr>
  `;
  processCount = 1;

  // Clear quantum and results
  document.getElementById("timeQuantum").value = "";

  document.getElementById("totalTurnaroundTime").textContent = "Total TT";
  document.getElementById("totalProcessesTT").textContent = "Processes";
  document.getElementById("attResult").textContent = " 0";

  document.getElementById("totalWaitingTime").textContent = "Total WT";
  document.getElementById("totalProcessesWT").textContent = "processes";
  document.getElementById("awtResult").textContent = " 0";

  document.getElementById("cpuBusy").textContent = "Sum (BT)";
  document.getElementById("totalTime").textContent = "Total End Time";
  document.getElementById("cpuUtilizationResult").textContent = " 0%";

  const ganttDiv = document.querySelector('.gantt.chart');
    ganttDiv.innerHTML = '<h2>Gantt Chart</h2>';
}

const removeRow = (button) => {
  const row = button.closest("tr"); // Get the row containing the clicked button
  row.remove(); // Remove the row from the table
  processCount--;
  updateProcessIds(); // Update Process IDs for remaining rows
};


const updateProcessIds = () => {
  const rows = document.querySelectorAll("#dataTable tbody tr"); // Target rows in tbody
  let counter = 1; // Start process ID from 1

  rows.forEach((row) => {
      const processIdCell = row.querySelector("td:first-child"); // First cell in the row
      if (processIdCell) {
          processIdCell.textContent = counter; // Update process ID
          counter++;
      }
  });
};
// Calculate Round Robin Scheduling
const calculateSchedule = () => {
    const timeQuantum = parseInt(document.getElementById("timeQuantum").value);
    if (isNaN(timeQuantum) || timeQuantum <= 0) {
      alert("Please enter a valid time quantum.");
      return;
    }
  
    const tableRows = document.querySelectorAll("#dataTable tbody tr");
    let processes = [];
  
    // Collect input data
    tableRows.forEach((row, index) => {
      const arrivalTime = parseInt(row.querySelector(".arrivalTime").value);
      const burstTime = parseInt(row.querySelector(".burstTime").value);
      if (!isNaN(arrivalTime) && !isNaN(burstTime)) {
        processes.push({
          process: index + 1,
          arrivalTime,
          burstTime,
          remainingTime: burstTime,
          endTime: 0,
          turnaroundTime: 0,
          waitingTime: 0,
        });
      }
    });
  
    if (processes.length === 0) {
      alert("Please enter valid process data.");
      return;
    }
  
    // Sort processes by arrival time
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
  
    let time = 0;
    let queue = [];
    let ganttData = [];
  
    while (processes.some(p => p.remainingTime > 0) || queue.length > 0) {
      // Add processes to the queue that arrive at or before the current time
      processes.forEach(p => {
        if (p.arrivalTime <= time && p.remainingTime > 0 && !queue.includes(p)) {
          queue.push(p);
        }
      });
  
      if (queue.length === 0) {
        // Idle time
        ganttData.push({ process: "Idle", burstTime: 1, endTime: time + 1 });
        time++;
        continue;
      }
  
      const currentProcess = queue.shift();
      const executionTime = Math.min(currentProcess.remainingTime, timeQuantum);
  
      ganttData.push({
        process: currentProcess.process,
        burstTime: executionTime,
        endTime: time + executionTime,
      });
  
      time += executionTime;
      currentProcess.remainingTime -= executionTime;
  
      // Add newly arrived processes during this time slice
      processes.forEach(p => {
        if (p.arrivalTime > time - executionTime && p.arrivalTime <= time && p.remainingTime > 0 && !queue.includes(p)) {
          queue.push(p);
        }
      });
  
      // Re-add the current process to the queue if it's not yet finished
      if (currentProcess.remainingTime > 0) {
        queue.push(currentProcess);
      } else {
        currentProcess.endTime = time;
        currentProcess.turnaroundTime = currentProcess.endTime - currentProcess.arrivalTime;
        currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
      }
    }
  
    // Update table with calculated values
    tableRows.forEach((row, index) => {
      const process = processes.find(p => p.process === index + 1);
      if (process) {
        row.querySelector(".endTime").textContent = process.endTime;
        row.querySelector(".turnaroundTime").textContent = process.turnaroundTime;
        row.querySelector(".waitingTime").textContent = process.waitingTime;
      }
    });
  
    // Calculate CPU Utilization, Average Turnaround Time, and Average Waiting Time
    const totalBurstTime = processes.reduce((sum, p) => sum + p.burstTime, 0);
    const totalEndTime = Math.max(...processes.map(p => p.endTime));
    const totalTurnaroundTime = processes.reduce((sum, p) => sum + p.turnaroundTime, 0);
    const totalWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0);
  
    document.getElementById("cpuBusy").textContent = totalBurstTime;
    document.getElementById("totalTime").textContent = totalEndTime;
    document.getElementById("cpuUtilizationResult").textContent = `${((totalBurstTime / totalEndTime) * 100).toFixed(2)}%`;
  
    document.getElementById("totalTurnaroundTime").textContent = totalTurnaroundTime;
    document.getElementById("totalProcessesTT").textContent = processes.length;
    document.getElementById("attResult").textContent = (totalTurnaroundTime / processes.length).toFixed(2);
  
    document.getElementById("totalWaitingTime").textContent = totalWaitingTime;
    document.getElementById("totalProcessesWT").textContent = processes.length;
    document.getElementById("awtResult").textContent = (totalWaitingTime / processes.length).toFixed(2);
  
    // Render Gantt Chart
    renderGanttChart(ganttData);
  }
  
const renderGanttChart = (processes) => {
const ganttDiv = document.querySelector('.gantt.chart');
ganttDiv.innerHTML = '<h2>Gantt Chart - Round Robin</h2>';

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
    
    bar.textContent = `${process.process}`;
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

addRowButton.addEventListener("click", handleAddRow);
resetButton.addEventListener("click", handleResetButton);



