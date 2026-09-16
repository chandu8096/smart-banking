const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

let allTransactions = [];
let currentPage = 1;
const rowsPerPage = 10;


// ======================================================
// ADMIN PROFILE
// ======================================================

function loadAdminProfile() {

    try {

        const payload =
            JSON.parse(
                atob(
                    token.split(".")[1]
                )
            );

        const adminProfile =
            document.createElement("div");

        adminProfile.id =
            "adminProfile";

        adminProfile.style.marginBottom = "20px";
        adminProfile.style.padding = "15px";
        adminProfile.style.borderRadius = "8px";
        adminProfile.style.background = "#f5f5f5";

        adminProfile.innerHTML = `

            <h2>Admin Profile</h2>

            <p>
                <strong>Admin ID:</strong>
                ${payload.userId || "Not available"}
            </p>

            <p>
                <strong>Email:</strong>
                ${payload.sub || "Not available"}
            </p>

            <p>
                <strong>Role:</strong>
                ${payload.role || "ADMIN"}
            </p>
        `;

        const header =
            document.querySelector(".admin-header");

        if (header) {

            header.insertAdjacentElement(
                "afterend",
                adminProfile
            );

        } else {

            const dashboard =
                document.querySelector(".dashboard");

            if (dashboard) {
                dashboard.prepend(adminProfile);
            }
        }

    }
    catch (error) {

        console.error(
            "Admin profile error:",
            error
        );
    }
}

loadAdminProfile();


// ======================================================
// LOAD ADMIN DASHBOARD
// ======================================================

function loadDashboard() {

    fetch("http://localhost:8080/api/admin/dashboard", {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        }
    })
    .then(response => {

        if (!response.ok) {
            throw new Error("Failed to load dashboard");
        }

        return response.json();
    })
    .then(data => {

        document.getElementById("totalUsers").textContent =
            data.totalUsers;

        document.getElementById("totalAccounts").textContent =
            data.totalAccounts;

        document.getElementById("totalTransactions").textContent =
            data.totalTransactions;

        document.getElementById("suspiciousTransactions").textContent =
            data.suspiciousTransactions;

        document.getElementById("rejectedTransactions").textContent =
            data.rejectedTransactions;

        document.getElementById("successfulTransactions").textContent =
            data.successfulTransactions;
    })
    .catch(error => {

        console.error(
            "Dashboard error:",
            error
        );

    });
}

loadDashboard();


// ======================================================
// LOAD SUSPICIOUS TRANSACTIONS
// ======================================================

fetch(
    "http://localhost:8080/api/admin/suspicious-transactions",
    {
        method: "GET",

        headers: {
            "Authorization": "Bearer " + token
        }
    }
)
.then(response => {

    if (!response.ok) {
        throw new Error(
            "Failed to load suspicious transactions"
        );
    }

    return response.json();
})
.then(transactions => {

    allTransactions = transactions;

    displayTransactions();

})
.catch(error => {

    console.error(
        "Transactions error:",
        error
    );

});


// ======================================================
// DISPLAY SUSPICIOUS TRANSACTIONS
// ======================================================

function displayTransactions() {

    const tableBody =
        document.getElementById("transactionsBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    const start =
        (currentPage - 1) * rowsPerPage;

    const end =
        start + rowsPerPage;

    const pageTransactions =
        allTransactions.slice(
            start,
            end
        );

    if (pageTransactions.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="10">
                    No suspicious transactions found.
                </td>
            </tr>
        `;

        updatePagination();

        return;
    }

    pageTransactions.forEach(transaction => {

        const row =
            document.createElement("tr");

        const status =
            transaction.status || "UNKNOWN";

        row.innerHTML = `

            <td>
                ${transaction.transactionId}
            </td>

            <td>
                ${transaction.fromAccount}
            </td>

            <td>
                ${transaction.toAccount}
            </td>

            <td>
                ₹${transaction.amount}
            </td>

            <td>
                ${transaction.transactionType}
            </td>

            <td>
                ${transaction.transactionDate}
            </td>

            <td>

                <span
                    class="status-badge ${status.toLowerCase()}"
                >
                    ${status}
                </span>

            </td>

            <td>
                ${transaction.isSuspicious}
            </td>

            <td>
                ${transaction.fraudReason || "Not available"}
            </td>

            <td>

                <button
                    onclick="viewTransactionDetails(${transaction.transactionId})"
                >
                    View Details
                </button>

                <button
                    onclick="approveTransaction(${transaction.transactionId})"
                >
                    Approve
                </button>

                <button
                    onclick="rejectTransaction(${transaction.transactionId})"
                >
                    Reject
                </button>

            </td>
        `;

        tableBody.appendChild(row);

    });

    updatePagination();
}


// ======================================================
// PAGINATION
// ======================================================

function updatePagination() {

    const pagination =
        document.getElementById("pagination");

    if (!pagination) {
        return;
    }

    const totalPages =
        Math.ceil(
            allTransactions.length /
            rowsPerPage
        );

    pagination.innerHTML = "";

    if (totalPages <= 1) {
        return;
    }

    const previousButton =
        document.createElement("button");

    previousButton.textContent =
        "Previous";

    previousButton.disabled =
        currentPage === 1;

    previousButton.onclick =
        function () {

            if (currentPage > 1) {

                currentPage--;

                displayTransactions();
            }
        };

    pagination.appendChild(
        previousButton
    );


    const pageText =
        document.createElement("span");

    pageText.textContent =
        ` Page ${currentPage} of ${totalPages} `;

    pagination.appendChild(
        pageText
    );


    const nextButton =
        document.createElement("button");

    nextButton.textContent =
        "Next";

    nextButton.disabled =
        currentPage === totalPages;

    nextButton.onclick =
        function () {

            if (
                currentPage <
                totalPages
            ) {

                currentPage++;

                displayTransactions();
            }
        };

    pagination.appendChild(
        nextButton
    );
}


// ======================================================
// SEARCH SUSPICIOUS TRANSACTIONS
// ======================================================

const searchInput =
    document.getElementById("transactionSearch");

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            const searchText =
                searchInput.value
                    .toLowerCase()
                    .trim();

            const filteredTransactions =
                allTransactions.filter(
                    transaction => {

                        const transactionText = `

                            ${transaction.transactionId}

                            ${transaction.fromAccount}

                            ${transaction.toAccount}

                            ${transaction.amount}

                            ${transaction.transactionType}

                            ${transaction.transactionDate}

                            ${transaction.status}

                            ${transaction.isSuspicious}

                            ${transaction.fraudReason || ""}

                        `.toLowerCase();

                        return transactionText.includes(
                            searchText
                        );
                    }
                );

            const originalTransactions =
                allTransactions;

            allTransactions =
                filteredTransactions;

            currentPage = 1;

            displayTransactions();

            allTransactions =
                originalTransactions;
        }
    );
}


// ======================================================
// FIND TRANSACTION
// ======================================================

function findTransactionById(transactionId) {

    const id =
        Number(transactionId);

    let transaction =
        allAdminTransactions.find(
            item =>
                Number(item.transactionId) === id
        );

    if (!transaction) {

        transaction =
            allTransactions.find(
                item =>
                    Number(item.transactionId) === id
            );
    }

    return transaction;
}


// ======================================================
// VIEW TRANSACTION DETAILS
// ======================================================

function viewTransactionDetails(transactionId) {

    const transaction =
        findTransactionById(transactionId);

    if (!transaction) {

        alert(
            "Transaction details not found."
        );

        return;
    }

    showTransactionModal(
        transaction
    );
}


// ======================================================
// CREATE TRANSACTION DETAILS MODAL
// ======================================================

function showTransactionModal(transaction) {

    closeTransactionModal();

    const status =
        transaction.status || "UNKNOWN";

    const suspicious =
        Number(transaction.isSuspicious) === 1
            || transaction.isSuspicious === true
            || String(transaction.isSuspicious).toLowerCase() === "true";

    let riskLevel =
        "LOW";

    if (suspicious) {
        riskLevel = "HIGH";
    }

    if (
        status === "REJECTED"
        && suspicious
    ) {
        riskLevel = "HIGH";
    }

    if (
        status === "SUCCESS"
        && !suspicious
    ) {
        riskLevel = "LOW";
    }

    const modal =
        document.createElement("div");

    modal.id =
        "transactionDetailsModal";

    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.background = "rgba(0, 0, 0, 0.65)";
    modal.style.display = "flex";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.zIndex = "9999";
    modal.style.padding = "20px";
    modal.style.boxSizing = "border-box";

    modal.innerHTML = `

        <div
            style="
                background:white;
                width:100%;
                max-width:700px;
                max-height:90vh;
                overflow-y:auto;
                border-radius:12px;
                padding:25px;
                box-sizing:border-box;
                box-shadow:0 10px 30px rgba(0,0,0,0.3);
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-bottom:20px;
                "
            >

                <h2 style="margin:0;">
                    Transaction Details
                </h2>

                <button
                    type="button"
                    onclick="closeTransactionModal()"
                    style="
                        font-size:20px;
                        border:none;
                        background:none;
                        cursor:pointer;
                    "
                >
                    ✕
                </button>

            </div>


            <div
                style="
                    padding:15px;
                    margin-bottom:20px;
                    border-radius:8px;
                    background:#f5f5f5;
                "
            >

                <h3>
                    Fraud Analysis
                </h3>

                <p>
                    <strong>Risk Level:</strong>
                    ${riskLevel}
                </p>

                <p>
                    <strong>Suspicious:</strong>
                    ${suspicious ? "YES" : "NO"}
                </p>

                <p>
                    <strong>Fraud Reason:</strong>
                    ${transaction.fraudReason || "No fraud reason recorded"}
                </p>

            </div>


            <table
                style="
                    width:100%;
                    border-collapse:collapse;
                    margin-bottom:20px;
                "
            >

                <tr>
                    <td style="padding:10px;border-bottom:1px solid #ddd;">
                        <strong>Transaction ID</strong>
                    </td>

                    <td style="padding:10px;border-bottom:1px solid #ddd;">
                        ${transaction.transactionId}
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px;border-bottom:1px solid #ddd;">
                        <strong>From Account</strong>
                    </td>

                    <td style="padding:10px;border-bottom:1px solid #ddd;">
                        ${transaction.fromAccount}
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px;border-bottom:1px solid #ddd;">
                        <strong>To Account</strong>
                    </td>

                    <td style="padding:10px;border-bottom:1px solid #ddd;">
                        ${transaction.toAccount}
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px;border-bottom:1px solid #ddd;">
                        <strong>Amount</strong>
                    </td>

                    <td style="padding:10px;border-bottom:1px solid #ddd;">
                        ₹${transaction.amount}
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px;border-bottom:1px solid #ddd;">
                        <strong>Transaction Type</strong>
                    </td>

                    <td style="padding:10px;border-bottom:1px solid #ddd;">
                        ${transaction.transactionType}
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px;border-bottom:1px solid #ddd;">
                        <strong>Transaction Date</strong>
                    </td>

                    <td style="padding:10px;border-bottom:1px solid #ddd;">
                        ${transaction.transactionDate}
                    </td>
                </tr>

                <tr>
                    <td style="padding:10px;border-bottom:1px solid #ddd;">
                        <strong>Status</strong>
                    </td>

                    <td style="padding:10px;border-bottom:1px solid #ddd;">
                        ${status}
                    </td>
                </tr>

            </table>


            <div
                style="
                    display:flex;
                    gap:10px;
                    flex-wrap:wrap;
                    justify-content:flex-end;
                "
            >

                ${
                    suspicious &&
                    status !== "SUCCESS" &&
                    status !== "REJECTED"

                    ? `

                        <button
                            type="button"
                            onclick="approveTransaction(${transaction.transactionId}); closeTransactionModal();"
                        >
                            Approve
                        </button>

                        <button
                            type="button"
                            onclick="rejectTransaction(${transaction.transactionId}); closeTransactionModal();"
                        >
                            Reject
                        </button>

                    `

                    : ""
                }

                <button
                    type="button"
                    onclick="closeTransactionModal()"
                >
                    Close
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    modal.addEventListener(
        "click",
        function(event) {

            if (event.target === modal) {
                closeTransactionModal();
            }

        }
    );
}


// ======================================================
// CLOSE TRANSACTION MODAL
// ======================================================

function closeTransactionModal() {

    const modal =
        document.getElementById(
            "transactionDetailsModal"
        );

    if (modal) {
        modal.remove();
    }
}


// ======================================================
// APPROVE TRANSACTION
// ======================================================

function approveTransaction(transactionId) {

    fetch(
        `http://localhost:8080/api/admin/transactions/${transactionId}/approve`,
        {
            method: "PUT",

            headers: {
                "Authorization":
                    "Bearer " + token
            }
        }
    )
    .then(async response => {

        const message =
            await response.text();

        console.log(
            "Approve status:",
            response.status
        );

        console.log(
            "Approve response:",
            message
        );

        if (!response.ok) {

            throw new Error(
                message ||
                "Failed to approve transaction"
            );
        }

        alert(
            "Transaction approved successfully"
        );

        location.reload();

    })
    .catch(error => {

        console.error(
            "Approve error:",
            error
        );

        alert(
            "Approve failed: " +
            error.message
        );
    });
}


// ======================================================
// REJECT TRANSACTION
// ======================================================

function rejectTransaction(transactionId) {

    fetch(
        `http://localhost:8080/api/admin/transactions/${transactionId}/reject`,
        {
            method: "PUT",

            headers: {
                "Authorization":
                    "Bearer " + token
            }
        }
    )
    .then(async response => {

        const message =
            await response.text();

        console.log(
            "Reject status:",
            response.status
        );

        console.log(
            "Reject response:",
            message
        );

        if (!response.ok) {

            throw new Error(
                message ||
                "Failed to reject transaction"
            );
        }

        alert(
            "Transaction rejected successfully"
        );

        location.reload();

    })
    .catch(error => {

        console.error(
            "Reject error:",
            error
        );

        alert(
            "Reject failed: " +
            error.message
        );
    });
}


// ======================================================
// CUSTOMER MANAGEMENT
// ======================================================

let allCustomers = [];


// ======================================================
// LOAD CUSTOMERS
// ======================================================

function loadCustomers() {

    fetch(
        "http://localhost:8080/api/admin/customers",
        {
            method: "GET",

            headers: {
                "Authorization":
                    "Bearer " + token
            }
        }
    )
    .then(response => {

        if (!response.ok) {

            throw new Error(
                "Failed to load customers"
            );
        }

        return response.json();
    })
    .then(customers => {

        allCustomers =
            customers;

        displayCustomers(
            allCustomers
        );

    })
    .catch(error => {

        console.error(
            "Customer loading error:",
            error
        );

        const message =
            document.getElementById(
                "customerMessage"
            );

        if (message) {

            message.textContent =
                "Failed to load customers.";
        }
    });
}


// ======================================================
// DISPLAY CUSTOMERS
// ======================================================

function displayCustomers(customers) {

    const tableBody =
        document.getElementById(
            "customersBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (customers.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    No customers found.
                </td>
            </tr>
        `;

        return;
    }

    customers.forEach(customer => {

        const row =
            document.createElement("tr");

        const status =
            customer.status
                ? customer.status.toUpperCase()
                : "UNKNOWN";

        const actionButton =
            status === "ACTIVE"

                ? `
                    <button
                        onclick="updateCustomerStatus(
                            ${customer.id},
                            'INACTIVE'
                        )"
                    >
                        Deactivate
                    </button>
                  `

                : `
                    <button
                        onclick="updateCustomerStatus(
                            ${customer.id},
                            'ACTIVE'
                        )"
                    >
                        Activate
                    </button>
                  `;

        row.innerHTML = `

            <td>
                ${customer.id}
            </td>

            <td>
                ${customer.name}
            </td>

            <td>
                ${customer.email}
            </td>

            <td>
                ${customer.role}
            </td>

            <td>

                <span
                    class="status-badge ${status.toLowerCase()}"
                >
                    ${status}
                </span>

            </td>

            <td>
                ${actionButton}
            </td>
        `;

        tableBody.appendChild(row);
    });
}


// ======================================================
// SEARCH CUSTOMERS
// ======================================================

const customerSearch =
    document.getElementById(
        "customerSearch"
    );

if (customerSearch) {

    customerSearch.addEventListener(
        "input",
        function () {

            const searchText =
                customerSearch.value
                    .toLowerCase()
                    .trim();

            const filteredCustomers =
                allCustomers.filter(
                    customer => {

                        const customerText = `

                            ${customer.id}

                            ${customer.name}

                            ${customer.email}

                            ${customer.role}

                            ${customer.status}

                        `.toLowerCase();

                        return customerText.includes(
                            searchText
                        );
                    }
                );

            displayCustomers(
                filteredCustomers
            );
        }
    );
}


// ======================================================
// ACTIVATE / DEACTIVATE CUSTOMER
// ======================================================

function updateCustomerStatus(
    userId,
    newStatus
) {

    const action =
        newStatus === "ACTIVE"
            ? "activate"
            : "deactivate";

    const confirmed =
        confirm(
            `Are you sure you want to ${action} this customer?`
        );

    if (!confirmed) {
        return;
    }

    fetch(
        `http://localhost:8080/api/admin/customers/${userId}/status`,
        {
            method: "PUT",

            headers: {

                "Authorization":
                    "Bearer " + token,

                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                status: newStatus
            })
        }
    )
    .then(async response => {

        const message =
            await response.text();

        console.log(
            "Customer status response:",
            response.status,
            message
        );

        if (!response.ok) {

            throw new Error(
                message ||
                "Failed to update customer status"
            );
        }

        alert(
            newStatus === "ACTIVE"

                ? "Customer activated successfully."

                : "Customer deactivated successfully."
        );

        loadCustomers();

        loadDashboard();

    })
    .catch(error => {

        console.error(
            "Customer status update error:",
            error
        );

        alert(
            "Customer status update failed: " +
            error.message
        );
    });
}


// ======================================================
// INITIAL CUSTOMER LOAD
// ======================================================

loadCustomers();


// ======================================================
// ADMIN TRANSACTION HISTORY
// ======================================================

let allAdminTransactions = [];


// ======================================================
// LOAD ALL TRANSACTIONS
// ======================================================

function loadAllAdminTransactions() {

    fetch(
        "http://localhost:8080/api/admin/transactions",
        {
            method: "GET",

            headers: {
                "Authorization":
                    "Bearer " + token
            }
        }
    )
    .then(response => {

        if (!response.ok) {

            throw new Error(
                "Failed to load transaction history"
            );
        }

        return response.json();
    })
    .then(transactions => {

        allAdminTransactions =
            transactions;

        addTransactionDetailsHeader();

        displayAdminTransactions();

    })
    .catch(error => {

        console.error(
            "Transaction history error:",
            error
        );
    });
}


// ======================================================
// ADD DETAILS COLUMN TO TRANSACTION HISTORY
// ======================================================

function addTransactionDetailsHeader() {

    const table =
        document.getElementById(
            "allTransactionsTable"
        );

    if (!table) {
        return;
    }

    const headerRow =
        table.querySelector("thead tr");

    if (!headerRow) {
        return;
    }

    const existingHeader =
        headerRow.querySelector(
            ".transaction-details-header"
        );

    if (existingHeader) {
        return;
    }

    const header =
        document.createElement("th");

    header.className =
        "transaction-details-header";

    header.textContent =
        "Action";

    headerRow.appendChild(
        header
    );
}


// ======================================================
// DISPLAY ADMIN TRANSACTIONS
// ======================================================

function displayAdminTransactions() {

    const tableBody =
        document.getElementById(
            "allTransactionsBody"
        );

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    const filterElement =
        document.getElementById(
            "transactionStatusFilter"
        );

    const searchElement =
        document.getElementById(
            "allTransactionSearch"
        );

    const filter =
        filterElement
            ? filterElement.value
            : "ALL";

    const searchText =
        searchElement
            ? searchElement.value
                .toLowerCase()
                .trim()
            : "";


    const filteredTransactions =
        allAdminTransactions.filter(
            transaction => {

                if (
                    filter !== "ALL"
                    &&
                    transaction.status !== filter
                ) {

                    return false;
                }

                const transactionText = `

                    ${transaction.transactionId}

                    ${transaction.fromAccount}

                    ${transaction.toAccount}

                    ${transaction.amount}

                    ${transaction.transactionType}

                    ${transaction.transactionDate}

                    ${transaction.status}

                    ${transaction.isSuspicious}

                    ${transaction.fraudReason || ""}

                `.toLowerCase();

                return transactionText.includes(
                    searchText
                );
            }
        );


    if (
        filteredTransactions.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="10">
                    No transactions found.
                </td>
            </tr>
        `;

        return;
    }


    filteredTransactions.forEach(
        transaction => {

            const row =
                document.createElement("tr");

            const status =
                transaction.status ||
                "UNKNOWN";

            row.innerHTML = `

                <td>
                    ${transaction.transactionId}
                </td>

                <td>
                    ${transaction.fromAccount}
                </td>

                <td>
                    ${transaction.toAccount}
                </td>

                <td>
                    ₹${transaction.amount}
                </td>

                <td>
                    ${transaction.transactionType}
                </td>

                <td>
                    ${transaction.transactionDate}
                </td>

                <td>

                    <span
                        class="status-badge ${status.toLowerCase()}"
                    >
                        ${status}
                    </span>

                </td>

                <td>
                    ${transaction.isSuspicious}
                </td>

                <td>
                    ${transaction.fraudReason || "Not available"}
                </td>

                <td>

                    <button
                        onclick="viewTransactionDetails(${transaction.transactionId})"
                    >
                        View Details
                    </button>

                </td>

            `;

            tableBody.appendChild(row);
        }
    );
}


// ======================================================
// TRANSACTION STATUS FILTER
// ======================================================

const transactionStatusFilter =
    document.getElementById(
        "transactionStatusFilter"
    );

if (transactionStatusFilter) {

    transactionStatusFilter.addEventListener(
        "change",
        displayAdminTransactions
    );
}


// ======================================================
// TRANSACTION SEARCH FILTER
// ======================================================

const allTransactionSearch =
    document.getElementById(
        "allTransactionSearch"
    );

if (allTransactionSearch) {

    allTransactionSearch.addEventListener(
        "input",
        displayAdminTransactions
    );
}


// ======================================================
// INITIAL TRANSACTION HISTORY LOAD
// ======================================================

loadAllAdminTransactions();


// ======================================================
// EXPORT TRANSACTION HISTORY TO CSV
// ======================================================

function exportTransactionsToCSV() {

    if (
        !allAdminTransactions ||
        allAdminTransactions.length === 0
    ) {

        alert(
            "No transaction data available to export."
        );

        return;
    }


    const headers = [
        "Transaction ID",
        "From Account",
        "To Account",
        "Amount",
        "Transaction Type",
        "Transaction Date",
        "Status",
        "Suspicious",
        "Fraud Reason"
    ];


    const rows =
        allAdminTransactions.map(
            transaction => [

                transaction.transactionId,

                transaction.fromAccount,

                transaction.toAccount,

                transaction.amount,

                transaction.transactionType,

                transaction.transactionDate,

                transaction.status,

                transaction.isSuspicious,

                transaction.fraudReason || ""
            ]
        );


    const csvContent = [
        headers,
        ...rows
    ]
    .map(row =>
        row
            .map(value =>
                `"${String(value ?? "")
                    .replace(/"/g, '""')}"`
            )
            .join(",")
    )
    .join("\n");


    const blob =
        new Blob(
            [csvContent],
            {
                type: "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "smart-banking-transactions.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}


// ======================================================
// CREATE EXPORT BUTTON
// ======================================================

function createExportButton() {

    const table =
        document.getElementById(
            "allTransactionsTable"
        );

    if (!table) {
        return;
    }

    if (
        document.getElementById(
            "exportTransactionsButton"
        )
    ) {
        return;
    }

    const button =
        document.createElement("button");

    button.id =
        "exportTransactionsButton";

    button.textContent =
        "Export Transactions CSV";

    button.type =
        "button";

    button.style.marginBottom =
        "10px";

    button.style.padding =
        "8px 14px";

    button.style.cursor =
        "pointer";

    button.addEventListener(
        "click",
        exportTransactionsToCSV
    );

    table.parentNode.insertBefore(
        button,
        table
    );
}

createExportButton();


// ======================================================
// TRANSACTION STATUS CHART
// ======================================================

function loadTransactionChart() {

    fetch(
        "http://localhost:8080/api/admin/dashboard",
        {
            method: "GET",

            headers: {
                "Authorization":
                    "Bearer " + token
            }
        }
    )
    .then(response => {

        if (!response.ok) {

            throw new Error(
                "Failed to load chart data"
            );
        }

        return response.json();
    })
    .then(data => {

        const canvas =
            document.getElementById(
                "transactionChart"
            );

        if (!canvas) {
            return;
        }


        new Chart(
            canvas,
            {
                type: "doughnut",

                data: {

                    labels: [
                        "Successful",
                        "Suspicious",
                        "Rejected"
                    ],

                    datasets: [
                        {
                            data: [

                                data.successfulTransactions,

                                data.suspiciousTransactions,

                                data.rejectedTransactions
                            ]
                        }
                    ]
                },

                options: {

                    responsive: true,

                    plugins: {

                        legend: {
                            position: "bottom"
                        },

                        title: {

                            display: true,

                            text:
                                "Transaction Status Distribution"
                        }
                    }
                }
            }
        );

    })
    .catch(error => {

        console.error(
            "Transaction chart error:",
            error
        );

    });
}


// ======================================================
// LOAD CHART
// ======================================================

loadTransactionChart();