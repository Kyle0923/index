let rowNumber = 1; // Counter for the row number
let rowsData = []; // Array to store rows data

function addRow() {
    const transactionInput = document.getElementById('transactionInput');
    const rowHistoryContainer = document.getElementById('rowHistoryContainer');

    let inputStr = transactionInput.value.trim();
    if (inputStr === '') {
        alert('Please enter transaction.');
        return;
    }

    let inputList = inputStr.split(',').map(str => str.trim())

    let [is_valid, msg] = validate_input(inputList);
    if (!is_valid) {
        alert(msg);
        return;
    }

    inputStr = inputList.join(', ')
    // Store row data in the array
    rowsData.push({ row: rowNumber, transaction: inputStr });

    // Display row in history with remove button
    const rowElement = createRowElement(rowNumber, inputStr);
    rowHistoryContainer.appendChild(rowElement);

    rowNumber++;
    transactionInput.value = ''; // Clear the input for the next row
}

function validate_input(inputList) {
    if (inputList.length === 1) {
        return [false, 'need to have at least 2 pariticipants in a transaction'];
    }
    const reg_user_paid = /\([\d\*.+-]+\)/;
    const reg_invalid_char = /[\(\)]/;
    let numOfPaid = 0;
    for (let idx = 0; idx < inputList.length; idx++) {
        value = inputList[idx];
        if (reg_user_paid.test(value))
        {
            if (value.match(/[\*.+-]/)) {
                inputList[idx] = eval_expr(value);
            }
            numOfPaid++;
            continue;
        }
        if (reg_invalid_char.test(value))
        {
            return [false, `Incorrect format: ${value}`];
        }
    }

    if (numOfPaid == 0)
    {
        return [false, 'At least one person need to pay for this transcation'];
    }
    return [true, ""];
}

function eval_expr(str) {
    const reg_expr = /\(([\d+-\\*]+)\)/;
    const matched = reg_expr.exec(str)[1];
    const numerical = eval(matched).toFixed(2);
    return str.replace(matched, numerical);
}

function createRowElement(row, transaction) {
    const rowElement = document.createElement('div');
    rowElement.classList.add('row-item');

    const rowText = document.createTextNode(`Transaction ${row}: ${transaction}`);
    rowElement.appendChild(rowText);

    const spacing1 = document.createTextNode('  '); // Add 2-space padding
    rowElement.appendChild(spacing1);

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit Row';
    editButton.addEventListener('click', () => editRow(row, transaction));
    rowElement.appendChild(editButton);

    const spacing2 = document.createTextNode('  '); // Add 2-space padding
    rowElement.appendChild(spacing2);

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', () => copyRow(transaction));
    rowElement.appendChild(copyButton);

    const spacing3 = document.createTextNode('  '); // Add 2-space padding
    rowElement.appendChild(spacing3);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove Row';
    removeButton.addEventListener('click', () => removeRow(rowElement, row));
    rowElement.appendChild(removeButton);

    rowElement.style.paddingBottom = '2px'

    return rowElement;
}

function editRow(row, transaction) {
    const editedTransaction = prompt(`Edit transaction (current: ${transaction}):`, transaction);

    if (editedTransaction !== null) {
        // Update the transaction in the array
        const index = rowsData.findIndex(rowData => rowData.row === row);
        if (index !== -1) {
            rowsData[index].transaction = editedTransaction;
        }

        // Update the displayed transaction in the DOM, including the row number
        const allRowElements = document.querySelectorAll('.row-item');
        allRowElements.forEach((element, index) => {
            const currentRow = index + 1;
            const rowText = element.firstChild;

            if (currentRow === row) {
                rowText.textContent = `Transaction ${currentRow}: ${editedTransaction}`;
            }
        });
    }
}

function copyRow(transaction) {
    if (rowsData.length > 0) {
        const transactionInput = document.getElementById('transactionInput');
        transactionInput.value = transaction;
    }
}

function removeRow(rowElement, row) {
    // Remove the row from the array
    rowsData = rowsData.filter(rowData => rowData.row !== row);

    // Remove the row element from the DOM
    rowElement.remove();

    // Correct the row numbers for the remaining rows
    const allRowElements = document.querySelectorAll('.row-item');
    allRowElements.forEach((element, index) => {
        const currentRow = index + 1;
        const rowText = element.firstChild;
        rowText.textContent = `Transaction ${currentRow}: ${rowText.textContent.slice(rowText.textContent.indexOf(':') + 2)}`;
    });

    // Update the global rowNumber variable
    rowNumber = allRowElements.length + 1;
}

function calculate() {
    let results = new Map();
    for (const row of rowsData) {
        let record = row.transaction;
        processTransaction(record, results);
    }
    printResult(results);
}

function processTransaction(record, results) {
    const regNum = /\([\d.]+\)/;
    let participants = record.split(',');
    let participants_copy = [];
    let payers = [];
    for (let participant of participants) {
        participant = participant.trim();
        const matched = participant.match(regNum);
        if (!matched) {
            participants_copy.push(participant);
            continue;
        }
        const amount_paid = Number(matched[0].replace('(', '').replace(')', ''));
        participant = participant.replace(regNum, "").trim();
        participants_copy.push(participant);
        payers.push({name: participant, amount: amount_paid});
    }

    participants = participants_copy;
    for (const payer of payers) {
        for (const participant of participants) {
            if (participant === payer.name) {
                continue;
            }
            updateTransfer(participant, payer.name, payer.amount / participants.length, results);
        }
    }
}

function updateTransfer(participant, payer, amount, results) {
    if (participant > payer) {
        let temp = participant;
        participant = payer;
        payer = temp;
        amount = -amount;
    }
    const transferId = `${participant}->${payer}`;
    if (results.has(transferId))
    {
        results.set(transferId, results.get(transferId) + amount);
    }
    else
    {
        results.set(transferId, amount);
    }
}

function printResult(results) {
    const resultDiv = document.getElementById('rowsResultContainer');
    resultDiv.innerHTML = "";
    let msgs = [];
    for (let [id, amount] of results) {
        let [from, to] = id.split('->');
        if (amount < 0) {
            let temp = from;
            from = to;
            to = temp;
            amount = -amount;
        }
        const msg = `${from} => ${to}: ${amount.toFixed(2)}`;
        msgs.push(msg);
    }

    for (const msg of msgs.sort()) {
        const rowElement = document.createElement('div');
        const rowText = document.createTextNode(msg);
        rowElement.appendChild(rowText);
        resultDiv.appendChild(rowElement);
    }
}

function clearRecord() {
    const transactionInput = document.getElementById('transactionInput');
    transactionInput.value = "";
    const rowHistoryContainer = document.getElementById('rowHistoryContainer');
    rowHistoryContainer.innerHTML = "";
    const resultDiv = document.getElementById('rowsResultContainer');
    resultDiv.innerHTML = "";
    rowNumber = 1;
    rowsData = [];
}

