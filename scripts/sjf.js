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
    const table = document.getElementById('processTable').getElementsByTagName('tbody')[0];
    
    // Check if there are rows in the table
    const lastRow = table.rows[table.rows.length - 1]; // Get the last row
    const lastProcessId = lastRow ? parseInt(lastRow.cells[0].innerText) : 0; // Get the last process ID or 0 if no rows
    const newProcessId = lastProcessId + 1; // Auto-increment the process ID
    
    // Insert a new row at the end of the table
    const newRow = table.insertRow(table.rows.length);

    // Populate the new row with cells
    newRow.innerHTML = `
        <td>${newProcessId}</td>
        <td><input type="number" placeholder="AT" min="0"></td>
        <td><input type="number" placeholder="BT" min="0"></td>
        <td class="endTime">-</td>
        <td class="turnaroundTime">-</td>
        <td class="waitingTime">-</td>
        <td><button onclick="removeRow(this)" class="button remove">Remove</button></td>
    `;
};

const handleResetButton = () => {
    // Reference to the data table
    const dataTable = document.querySelector("#processTable tbody");
    const rows = dataTable.querySelectorAll("tr");
    
    // Remove all rows except the first one
    rows.forEach((row, index) => {
        if (index !== 0) {
            row.remove();
        }
    });

    // Reset first row inputs
    const firstRow = rows[0];
    if (firstRow) {
        const firstRowCells = firstRow.querySelectorAll("td");
        firstRowCells[1].innerHTML = '<input type="number" class="arrivalTime" placeholder="AT">';
        firstRowCells[2].innerHTML = '<input type="number" class="burstTime" placeholder="BT">';
        firstRowCells[3].textContent = "-"; // End Time
        firstRowCells[4].textContent = "-"; // Turnaround Time
        firstRowCells[5].textContent = "-"; // Waiting Time
    }

    // Reset process counter
    let processCounter = 2; // Adjust this variable based on its scope in your code

    // Hide result headers and cells
    document.querySelectorAll(".result-header").forEach(header => header.classList.add("hidden"));
    document.querySelectorAll(".result").forEach(cell => cell.classList.add("hidden"));

    // Reset result fields
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
    const ganttDiv = document.querySelector(".gantt.chart");
    if (ganttDiv) {
        ganttDiv.innerHTML = "<h2>Gantt Chart</h2>";
    }
};

const removeRow = (button) => {
    const row = button.closest("tr"); // Get the row containing the clicked button
    row.remove(); // Remove the row from the table

    updateProcessIds(); // Update Process IDs for remaining rows
};

const updateProcessIds = () => {
    const rows = document.querySelectorAll("#processTable tbody tr"); // Target rows in tbody
    let counter = 1; // Start process ID from 1

    rows.forEach((row) => {
        const processIdCell = row.querySelector("td:first-child"); // First cell in the row
        if (processIdCell) {
            processIdCell.textContent = counter; // Update process ID
            counter++;
        }
    });
};

const renderGanttChart = (processes) => {
    const ganttDiv = document.querySelector('.gantt.chart');
    ganttDiv.innerHTML = '<h2>Gantt Chart - SJF (Shortest Job First)</h2>';
    
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

const calculateSJF = () => {
    const rows = Array.from(document.querySelectorAll("#processTable tbody tr"));
    const processes = rows.map((row, index) => ({
        id: index + 1,
        arrivalTime: parseInt(row.querySelector("td:nth-child(2) input").value || 0),
        burstTime: parseInt(row.querySelector("td:nth-child(3) input").value || 0),
        remainingTime: parseInt(row.querySelector("td:nth-child(3) input").value || 0),
        endTime: 0,
        turnaroundTime: 0,
        waitingTime: 0,
        rowElement: row,
        completed: false,
    }));

    // Sort processes by arrival time
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

    let currentTime = 0;
    let completedProcesses = 0;
    const ganttChartData = [];

    while (completedProcesses < processes.length) {
        // Find the next process with the shortest burst time that has arrived
        let selectedProcess = null;

        for (const process of processes) {
            if (
                !process.completed &&
                process.arrivalTime <= currentTime &&
                (selectedProcess === null || process.burstTime < selectedProcess.burstTime)
            ) {
                selectedProcess = process;
            }
        }

        if (selectedProcess) {
            // Process the selected task
            const startTime = currentTime;
            const endTime = startTime + selectedProcess.burstTime;

            selectedProcess.endTime = endTime;
            selectedProcess.turnaroundTime = endTime - selectedProcess.arrivalTime;
            selectedProcess.waitingTime = selectedProcess.turnaroundTime - selectedProcess.burstTime;
            selectedProcess.completed = true;

            ganttChartData.push({
                process: selectedProcess.id,
                burstTime: selectedProcess.burstTime,
                endTime: selectedProcess.endTime,
            });

            currentTime = endTime;
            completedProcesses++;
        } else {
            // If no process is available, CPU is idle
            currentTime++;
            ganttChartData.push({
                process: "idle",
                burstTime: 1,
                endTime: currentTime,
            });
        }
    }

    // Calculate totals
    const totalTurnaroundTime = processes.reduce((sum, p) => sum + p.turnaroundTime, 0);
    const totalWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0);
    const totalBurstTime = processes.reduce((sum, p) => sum + p.burstTime, 0); // CPU busy time
    const totalTime = currentTime; // Total time includes idle + processing time
    const idleTime = totalTime - totalBurstTime;
    const cpuUtilization = ((totalBurstTime / totalTime) * 100).toFixed(2);

    // Display results
    document.getElementById("cpuBusy").textContent = totalBurstTime;
    document.getElementById("totalTime").textContent = totalTime;
    document.getElementById("cpuUtilizationResult").textContent = `${cpuUtilization}%`;

    document.getElementById("totalTurnaroundTime").textContent = totalTurnaroundTime;
    document.getElementById("totalProcessesTT").textContent = processes.length;
    document.getElementById("attResult").textContent = (totalTurnaroundTime / processes.length).toFixed(3);

    document.getElementById("totalWaitingTime").textContent = totalWaitingTime;
    document.getElementById("totalProcessesWT").textContent = processes.length;
    document.getElementById("awtResult").textContent = (totalWaitingTime / processes.length).toFixed(3);

    processes.forEach(process => {
        process.rowElement.querySelector("td:nth-child(4)").textContent = process.endTime;
        process.rowElement.querySelector("td:nth-child(5)").textContent = process.turnaroundTime;
        process.rowElement.querySelector("td:nth-child(6)").textContent = process.waitingTime;
    });

    // Render Gantt Chart
    renderGanttChart(ganttChartData);
};


