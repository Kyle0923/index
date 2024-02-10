"use strict";

let records = []; // Array to store rows data

function addRow() {
    const transactionInput = document.getElementById('transactionInput');
    const rowHistoryContainer = document.getElementById('rowHistoryContainer');

    let inputStr = transactionInput.value.trim();
    let title = "";
    console.log(`input idx:${records.length}, "${inputStr}"`);
    if (inputStr.includes(':')) {
        title = inputStr.split(':')[0].trim();
        inputStr = inputStr.split(':')[1].trim();
    }
    if (inputStr === '') {
        alert('Please enter transaction.');
        return;
    }

    let is_valid;
    [is_valid, inputStr] = validate_input(inputStr);
    if (!is_valid) {
        return;
    }

    records.push({ transaction: inputStr, title: title, enable: true });

    const rowElement = createRowElement(records.length - 1, inputStr, title);
    rowHistoryContainer.appendChild(rowElement);

    transactionInput.value = ''; // Clear the input for the next row
}

function validate_input(inputStr) {
    let inputList = inputStr.split(',').map(str => str.trim()).filter(Boolean);

    let [is_valid, msg] = validate_input_impl(inputList);
    if (!is_valid) {
        alert(msg);
        return [is_valid, undefined];
    }

    inputStr = inputList.join(', ');
    return [is_valid, inputStr];
}


function validate_input_impl(inputList) {
    if (inputList.length === 1) {
        return [false, 'need to have at least 2 pariticipants in a transaction'];
    }
    let numOfPaid = 0;
    let seen = new Set();
    for (let idx = 0; idx < inputList.length; idx++) {
        let record = inputList[idx];
        const [is_valid, pariticipant, value] = parse_participant(record);
        if (!is_valid) {
            return [false, `Incorrect format: ${record}`];
        }
        if (seen.has(pariticipant)) {
            return [false, `repeated participant: ${pariticipant}`];
        }
        seen.add(pariticipant);
        if (value !== undefined)
        {
            inputList[idx] = `${pariticipant}(${value})`;
            numOfPaid++;
        }
    }

    if (numOfPaid == 0)
    {
        return [false, 'At least one participant need to pay for this transcation'];
    }
    return [true, ""];
}

// returns [is_valid, pariticipant, value]
function parse_participant(record) {
    record = record.trim();
    const reg_user_paid = /\(([\d+-\\*\/\(\)]+)\)/;
    const reg_invalid_char = /[\(\)]/;
    if (!reg_invalid_char.test(record)) {
        return [true, record, undefined];
    }
    const matched = reg_user_paid.exec(record);
    if (!matched) {
        return [false, undefined, undefined];
    }
    const pariticipant = record.replace(matched[0], ""); // remove expression
    const expr = matched[1];
    let value;
    try {
        value = eval_expr(expr);
    } catch (e){
        return [false, undefined, undefined];
    }
    return [true, pariticipant, value];
}

function eval_expr(str) {
    const numerical = eval(str);
    if (Number.isInteger(numerical)) {
        return numerical;
    } else {
        return numerical.toFixed(2);
    }
}

function createRowElement(id, transaction, title) {
    const rowElement = document.createElement('div');
    rowElement.classList.add('row-item');
    rowElement.setAttribute("id", `row-item-${id}`);

    const rowText = document.createElement('span');
    rowText.textContent = title ? `${title}: ${transaction}` : `Transaction ${id+1}: ${transaction}`;
    rowText.setAttribute("id", `row-text-${id}`);
    rowElement.appendChild(rowText);

    const spacing1 = document.createTextNode('  '); // Add 2-space padding
    rowElement.appendChild(spacing1);

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => editRow(id));
    rowElement.appendChild(editButton);

    const spacing2 = document.createTextNode('  '); // Add 2-space padding
    rowElement.appendChild(spacing2);

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', () => copyRow(id));
    rowElement.appendChild(copyButton);

    const spacing3 = document.createTextNode('  '); // Add 2-space padding
    rowElement.appendChild(spacing3);

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.setAttribute('id', `row-rm-${id}`);
    removeButton.addEventListener('click', () => removeRow(id));
    rowElement.appendChild(removeButton);

    rowElement.style.paddingBottom = '2px'

    return rowElement;
}

function editRow(id) {
    let record = records[id];
    const transaction = record.transaction;
    let editedTransaction = prompt(`Edit ${record.title? record.title : "transaction"}, current: ${transaction}:`, transaction);
    console.log(`edit ${id}, old: "${transaction}", new: "${editedTransaction}"`);
    if (editedTransaction === null) {
        return;
    }

    let is_valid;
    [is_valid, editedTransaction] = validate_input(editedTransaction);
    if (!is_valid) {
        return;
    }

    // Update the transaction in the Map
    record.transaction = editedTransaction;

    // Update the displayed transaction in the DOM
    const rowText = document.getElementById(`row-text-${id}`);
    rowText.textContent = rowText.textContent.replace(transaction, editedTransaction);
}

function copyRow(id) {
    const transactionInput = document.getElementById('transactionInput');
    transactionInput.value = records[id].transaction;;
}

function removeRow(id) {
    console.log(`delete ${id}, value: "${records[id].transaction}"`);
    records[id].enable = false;

    // Remove the row element from the DOM
    const rowText = document.getElementById(`row-text-${id}`);
    rowText.classList.add('strikethrough');

    const removeButton = document.getElementById(`row-rm-${id}`);
    removeButton.classList.add('hidden');

    let restoreButton = document.getElementById(`row-restore-${id}`);
    if (restoreButton) {
        restoreButton.classList.remove('hidden');
    } else {
        let restoreButton = document.createElement('button');
        restoreButton.textContent = 'Restore';
        restoreButton.setAttribute('id', `row-restore-${id}`);
        restoreButton.addEventListener('click', () => restoreRow(id));
        const row = document.getElementById(`row-item-${id}`);
        row.appendChild(restoreButton);
    }
}

function restoreRow(id) {
    console.log(`restore ${id}, value: "${records[id].transaction}"`);
    records[id].enable = true;

    // Restore the row element from the DOM
    const rowText = document.getElementById(`row-text-${id}`);
    rowText.classList.remove('strikethrough');

    const removeButton = document.getElementById(`row-rm-${id}`);
    removeButton.classList.remove('hidden');

    const restoreButton = document.getElementById(`row-restore-${id}`);
    restoreButton.classList.add('hidden');
}

function calculate() {
    console.log("calculate()\n", records);
    let results = new Map();
    for (const record of records) {
        if (record.enable === true) {
            processTransaction(record.transaction, results);
        }
    }
    printResult(results);
}

function processTransaction(record, results) {
    let participants = [];
    let payers = [];
    for (let participant of record.split(',')) {
        const [, name, amount] = parse_participant(participant);
        participants.push(name);
        if (amount === undefined) {
            continue;
        }
        payers.push({name: name, amount: Number(amount)});
    }

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
    records.clear();
}

