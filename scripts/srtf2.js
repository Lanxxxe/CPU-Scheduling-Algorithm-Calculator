let processes = [];
let processId = 2;

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
        return '#f0f0f0'; // Gray
    }

    // Subtract 1 from processId since arrays are 0-based
    // Use modulo to cycle through colors if there are more processes than colors
    return colors[(processId - 1) % colors.length];
}

const handleAddRow = () => {
    const table = document.getElementById("dataTable").getElementsByTagName('tbody')[0];
    const row = table.insertRow();
    const processId = table.rows.length; // Use the number of rows as the process ID

    row.innerHTML = `
        <td>${processId}</td>
        <td><input type="number" class="arrivalTime" placeholder="AT" min="0" /></td>
        <td><input type="number" class="burstTime" placeholder="BT" min="0" /></td>
        <td class="endTime">-</td>
        <td class="turnaroundTime">-</td>
        <td class="waitingTime">-</td>
        <td><button onclick="removeRow(this)" class="button remove">Remove</button></td>
    `;
};

const handleReset = () => {
    const table = document.getElementById("dataTable");
    const rows = table.querySelectorAll("tbody tr");

    // Remove all rows except the first one
    rows.forEach((row, index) => {
        if (index !== 0) row.remove();
    });

    // Reset the process counter
    processId = 2;

    // Reset the first row's inputs and results
    const firstRow = table.querySelector("tbody tr");
    if (firstRow) {
        const firstRowCells = firstRow.querySelectorAll("td");
        firstRowCells[1].innerHTML = '<input type="number" class="arrivalTime" placeholder="AT" min="0">';
        firstRowCells[2].innerHTML = '<input type="number" class="burstTime" placeholder="BT" min="0">';
        ["3", "4", "5"].forEach(i => (firstRowCells[i].textContent = "-"));
    }

    // Reset formula results
    document.getElementById("totalTurnaroundTime").textContent = "Total TT";
    document.getElementById("totalProcessesTT").textContent = "Processes";
    document.getElementById("attResult").textContent = "0";
    document.getElementById("totalWaitingTime").textContent = "Total WT";
    document.getElementById("totalProcessesWT").textContent = "Processes";
    document.getElementById("awtResult").textContent = "0";
    document.getElementById("cpuBusy").textContent = "Sum (BT)";
    document.getElementById("totalTime").textContent = "Total End Time";
    document.getElementById("cpuUtilizationResult").textContent = "0%";
}

const removeRow = (button) => {
    const row = button.closest("tr"); // Get the row containing the clicked button
    row.remove(); // Remove the row from the table
    
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


const srtfCalculation = (processes) => {
    let time = 0;
    let completed = 0;
    const n = processes.length;
    const results = [];
    let totalIdleTime = 0;
    const totalBurstTime = processes.reduce((sum, p) => sum + p.burstTime, 0);
    
    // Add this array to track the execution sequence for Gantt chart
    const executionSequence = [];
    let currentProcess = null;
    
    processes.sort((a, b) => a.arrivalTime - b.arrivalTime);

    while (completed < n) {
        let idx = -1;
        let minRemaining = Infinity;

        for (let i = 0; i < n; i++) {
            if (processes[i].arrivalTime <= time && processes[i].remainingTime > 0) {
                if (processes[i].remainingTime < minRemaining) {
                    minRemaining = processes[i].remainingTime;
                    idx = i;
                }
            }
        }

        if (idx === -1) {
            // Idle time
            if (currentProcess !== 'idle') {
                executionSequence.push({ processId: 'idle', startTime: time });
                currentProcess = 'idle';
            }
            totalIdleTime++;
            time++;
            continue;
        }

        // Process execution
        if (currentProcess !== processes[idx].id) {
            executionSequence.push({ processId: processes[idx].id, startTime: time });
            currentProcess = processes[idx].id;
        }

        processes[idx].remainingTime--;
        time++;

        if (processes[idx].remainingTime === 0) {
            completed++;
            const endTime = time;
            const turnaroundTime = endTime - processes[idx].arrivalTime;
            const waitingTime = turnaroundTime - processes[idx].burstTime;

            results.push({
                id: processes[idx].id,
                endTime,
                turnaroundTime,
                waitingTime,
            });
        }
    }

    // Add end times to execution sequence
    for (let i = 0; i < executionSequence.length; i++) {
        executionSequence[i].endTime = i < executionSequence.length - 1 
            ? executionSequence[i + 1].startTime 
            : time;
    }

    results.sort((a, b) => a.id - b.id);
    return { results, totalIdleTime, totalBurstTime, executionSequence };
}

// Add this function to render the Gantt chart
const renderGanttChart = (executionSequence) => {
    const ganttDiv = document.querySelector('.gantt.chart');
    ganttDiv.innerHTML = '<h2>Gantt Chart - SRTF(Shortest Remaining Time First)</h2>';
    
    // Create legend
    const legendContainer = document.createElement('div');
    legendContainer.className = 'gantt-legend';
    legendContainer.style.cssText = 'margin-bottom: 15px; display: flex; flex-wrap: wrap; gap: 10px;';

    // Get unique process IDs
    const uniqueProcessIds = [...new Set(executionSequence.map(entry => entry.processId))];
    uniqueProcessIds.sort((a, b) => {
        if (a === 'idle') return 1;
        if (b === 'idle') return -1;
        return a - b;
    });

    // Create legend items
    
    const chartContainer = document.createElement('div');
    chartContainer.className = 'gantt-container';
    chartContainer.style.cssText = 'position: relative; margin-top: 20px; padding: 10px;';

    const totalDuration = executionSequence[executionSequence.length - 1].endTime;
    const containerWidth = 800;
    const scale = containerWidth / totalDuration;

    executionSequence.forEach(entry => {
        const bar = document.createElement('div');
        const width = (entry.endTime - entry.startTime) * scale;
        const left = entry.startTime * scale;
        
        bar.style.cssText = `
            position: absolute;
            height: 40px;
            width: ${width}px;
            left: ${left}px;
            top: 20px;
            background-color: ${getProcessColor(entry.processId)};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: ${entry.processId === 'idle' ? '#666' : 'white'};
        `;
        
        bar.textContent = entry.processId === 'idle' ? 'Idle' : `P${entry.processId}`;
        chartContainer.appendChild(bar);
    });

    const timelineContainer = document.createElement('div');
    timelineContainer.style.cssText = 'position: relative; height: 20px; margin-top: 70px;';

    for (let t = 0; t <= totalDuration; t++) {
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
    ganttDiv.appendChild(chartContainer);
}

const calculate = () => {
    const table = document.getElementById("dataTable");
    const rows = table.querySelectorAll("tbody tr");

    processes = [];

    rows.forEach((row, index) => {
        const arrivalTime = parseInt(row.querySelector(".arrivalTime").value);
        const burstTime = parseInt(row.querySelector(".burstTime").value);

        if (!isNaN(arrivalTime) && !isNaN(burstTime)) {
            processes.push({
                id: index + 1,
                arrivalTime,
                burstTime,
                remainingTime: burstTime,
            });
        }
    });

    const { results, totalIdleTime, totalBurstTime, executionSequence } = srtfCalculation(processes);

    let totalTurnaroundTime = 0;
    let totalWaitingTime = 0;

    rows.forEach((row, index) => {
        const result = results.find(r => r.id === index + 1);
        if (result) {
            row.querySelector(".endTime").textContent = result.endTime;
            row.querySelector(".turnaroundTime").textContent = result.turnaroundTime;
            row.querySelector(".waitingTime").textContent = result.waitingTime;

            totalTurnaroundTime += result.turnaroundTime;
            totalWaitingTime += result.waitingTime;
        }
    });

    const avgTurnaroundTime = totalTurnaroundTime / processes.length;
    const avgWaitingTime = totalWaitingTime / processes.length;
    const cpuUtilization = ((totalBurstTime / (totalBurstTime + totalIdleTime)) * 100).toFixed(2);

    document.getElementById("cpuBusy").textContent = totalBurstTime.toFixed(2);
    document.getElementById("totalTime").textContent = (totalBurstTime + totalIdleTime).toFixed(2);
    document.getElementById("cpuUtilizationResult").textContent = `${cpuUtilization}%`;

    document.getElementById("totalTurnaroundTime").textContent = totalTurnaroundTime.toFixed(2);
    document.getElementById("totalProcessesTT").textContent = processes.length;
    document.getElementById("attResult").textContent = avgTurnaroundTime.toFixed(2);

    document.getElementById("totalWaitingTime").textContent = totalWaitingTime.toFixed(2);
    document.getElementById("totalProcessesWT").textContent = processes.length;
    document.getElementById("awtResult").textContent = avgWaitingTime.toFixed(2);

    renderGanttChart(executionSequence);
};


// Add new row to the table
document.getElementById("addRow").addEventListener("click", handleAddRow);
document.getElementById("calculate").addEventListener("click", calculate);
// Reset Table Event
document.getElementById("resetTable").addEventListener("click", handleReset);

