const addRowButton = document.getElementById('addRow');
const calculateButton = document.getElementById('calculate');
const resetTableButton = document.getElementById('resetTable');
const algorithmSelect = document.getElementById('algorithmType');
const dataTable = document.getElementById('dataTable').querySelector('tbody');

let processCounter = 2;

// Add a new row
addRowButton.addEventListener('click', () => {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${processCounter}</td>
        <td contenteditable="true"></td>
        <td contenteditable="true"></td>
        <td class="hidden result"></td>
        <td class="hidden result"></td>
        <td class="hidden result"></td>
    `;
    dataTable.appendChild(row);
    processCounter++;
});


// Reset the table
resetTableButton.addEventListener('click', () => {
    const rows = dataTable.querySelectorAll('tr');
    rows.forEach((row, index) => {
        if (index !== 0) {  // Skip the first row (which is the default with process 1)
            row.remove();   // Remove all dynamic rows
        }
    });

    // Reset process counter to 2 (next process after the first row)
    processCounter = 2;

    // Optionally, reset the content of the first row (if needed)
    const firstRowCells = rows[0].querySelectorAll('td');
    firstRowCells[1].textContent = '';  // Clear Arrival Time cell
    firstRowCells[2].textContent = '';  // Clear Burst Time cell
    firstRowCells[3].textContent = '';  // Clear Priority cell (if applicable)


    // Hide result headers and columns
    document.querySelectorAll('.result-header').forEach(header => header.classList.add('hidden'));
    document.querySelectorAll('.result').forEach(cell => cell.classList.add('hidden'));

});

// Calculate CPU scheduling
calculateButton.addEventListener('click', () => {
    const algorithm = algorithmSelect.value;
    if (!algorithm) {
        alert('Please select an algorithm!');
        return;
    }

    const rows = Array.from(dataTable.querySelectorAll('tr'));
    const processes = rows.map((row, index) => ({
        processIndex: index, // Track the original index for sorting later
        process: row.cells[0].textContent.trim(),
        arrivalTime: parseFloat(row.cells[1].textContent.trim()),
        burstTime: parseFloat(row.cells[2].textContent.trim()),
        endTime: 0,
        turnAroundTime: 0,
        waitingTime: 0,
    })).filter(p => p.process && !isNaN(p.arrivalTime) && !isNaN(p.burstTime));

    if (processes.length === 0) {
        alert('Please enter valid process data!');
        return;
    }

    if (algorithm === 'fifo') {
        processes.sort((a, b) => a.arrivalTime - b.arrivalTime); // Sort by arrival time
        let currentTime = 0;

        processes.forEach(process => {
            process.endTime = Math.max(currentTime, process.arrivalTime) + process.burstTime;
            process.turnAroundTime = process.endTime - process.arrivalTime;
            process.waitingTime = process.turnAroundTime - process.burstTime;
            currentTime = process.endTime;
        });
    } else if (algorithm === 'sjf') {
        let currentTime = 0;

        while (processes.some(p => p.endTime === 0)) {
            const available = processes.filter(p => p.arrivalTime <= currentTime && p.endTime === 0);
            if (available.length === 0) {
                currentTime = Math.min(...processes.filter(p => p.endTime === 0).map(p => p.arrivalTime));
                continue;
            }

            available.sort((a, b) => a.burstTime - b.burstTime); // Sort by burst time
            const process = available[0];
            process.endTime = currentTime + process.burstTime;
            process.turnAroundTime = process.endTime - process.arrivalTime;
            process.waitingTime = process.turnAroundTime - process.burstTime;
            currentTime = process.endTime;
        }
    }

    // Sort back by original process index to maintain the correct row order
    processes.sort((a, b) => a.processIndex - b.processIndex);

    // Display results in the table
    rows.forEach((row, index) => {
        if (index < processes.length) {
            row.cells[3].textContent = processes[index].endTime;
            row.cells[4].textContent = processes[index].turnAroundTime;
            row.cells[5].textContent = processes[index].waitingTime;

            row.cells[3].classList.remove('hidden');
            row.cells[4].classList.remove('hidden');
            row.cells[5].classList.remove('hidden');
        }
    });

    // Show result headers
    document.querySelectorAll('.result-header').forEach(header => header.classList.remove('hidden'));
});