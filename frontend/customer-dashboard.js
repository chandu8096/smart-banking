  const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}


// Decode JWT
function decodeTokenPayload(jwt) {

    try {

        const parts = jwt.split(".");

        if (parts.length !== 3) {
            return null;
        }

        let base64 = parts[1];

        base64 = base64
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        while (base64.length % 4 !== 0) {
            base64 += "=";
        }

        return JSON.parse(atob(base64));

    } catch (error) {

        console.error("JWT decode error:", error);
        return null;

    }
}


// Load customer profile
function loadCustomerProfile(accounts) {

    const payload = decodeTokenPayload(token);

    if (!payload) {
        return;
    }

    document.getElementById("profileUserId").textContent =
        payload.userId || "N/A";

    document.getElementById("profileEmail").textContent =
        payload.sub || "N/A";

    document.getElementById("profileRole").textContent =
        payload.role || "CUSTOMER";

    let status = "ACTIVE";

    if (accounts && accounts.length > 0) {

        const activeAccount = accounts.find(
            account => account.status === "ACTIVE"
        );

        if (!activeAccount) {
            status = "INACTIVE";
        }
    }

    document.getElementById("profileStatus").textContent = status;
}


// Load accounts
async function loadAccounts() {

    try {

        const response = await fetch(
            "http://localhost:8080/api/accounts",
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (response.status === 401) {

            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load accounts");
        }

        const accounts = await response.json();

        loadCustomerProfile(accounts);

        const container =
            document.getElementById("accountsContainer");

        const select =
            document.getElementById("fromAccount");

        container.innerHTML = "";

        select.innerHTML =
            '<option value="">Select account</option>';

        if (!accounts || accounts.length === 0) {

            container.innerHTML =
                "<p>No accounts found.</p>";

            return;
        }

        accounts.forEach(account => {

            const card =
                document.createElement("div");

            card.className = "account-card";

            card.innerHTML = `
                <p>
                    <strong>Account ID:</strong>
                    ${account.accountId ?? account.id ?? "N/A"}
                </p>

                <p>
                    <strong>Account Number:</strong>
                    ${account.accountNumber ?? "N/A"}
                </p>

                <p>
                    <strong>Balance:</strong>
                    ₹${account.balance ?? "0"}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${account.status ?? "N/A"}
                </p>
            `;

            container.appendChild(card);

            const accountId =
                account.accountId ?? account.id;

            if (accountId != null) {

                const option =
                    document.createElement("option");

                option.value = accountId;

                option.textContent =
                    `${account.accountNumber ?? "Account"} - ID ${accountId}`;

                select.appendChild(option);
            }

        });

    } catch (error) {

        console.error(error);

        document.getElementById("accountsContainer").innerHTML =
            "<p>Unable to load account information.</p>";
    }
}


// Add notification to screen
function addNotification(title, message, type) {

    const container =
        document.getElementById("notificationsContainer");

    const noMessage =
        document.getElementById("noNotificationsMessage");

    if (noMessage) {
        noMessage.remove();
    }

    const notification =
        document.createElement("div");

    notification.className =
        "notification notification-" + type;

    notification.innerHTML = `

        <div class="notification-title">
            ${title}
        </div>

        <div>
            ${message}
        </div>

        <div class="notification-date">
            ${new Date().toLocaleString()}
        </div>

    `;

    container.prepend(notification);
}


// Load saved notifications from backend
async function loadNotifications() {

    const container =
        document.getElementById("notificationsContainer");

    try {

        const response = await fetch(
            "http://localhost:8080/api/notifications",
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (response.status === 401) {

            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load notifications");
        }

        const notifications = await response.json();

        container.innerHTML = "";

        if (!notifications || notifications.length === 0) {

            container.innerHTML =
                '<p id="noNotificationsMessage">No notifications yet.</p>';

            return;
        }

        notifications.forEach(notification => {

            const notificationDiv =
                document.createElement("div");

            const type =
                String(notification.type || "INFO").toLowerCase();

            notificationDiv.className =
                "notification notification-" + type;

            const isRead =
                Number(notification.isRead) === 1;

            notificationDiv.innerHTML = `

                <div class="notification-title">
                    ${notification.title ?? "Notification"}
                </div>

                <div>
                    ${notification.message ?? ""}
                </div>

                <div class="notification-date">
                    ${formatDate(notification.createdAt)}
                </div>

                <div class="notification-action">

                    ${
                        isRead
                            ? `
                                <span class="notification-read">
                                    ✓ Read
                                </span>
                              `
                            : `
                                <button
                                    class="mark-read-btn"
                                    onclick="markNotificationAsRead(${notification.notificationId})">
                                    Mark as Read
                                </button>
                              `
                    }

                </div>

            `;

            container.appendChild(notificationDiv);
        });

    } catch (error) {

        console.error("Notification error:", error);

        container.innerHTML =
            '<p id="noNotificationsMessage">Unable to load notifications.</p>';
    }
}


// Mark notification as read
async function markNotificationAsRead(notificationId) {

    try {

        const response = await fetch(
            `http://localhost:8080/api/notifications/${notificationId}/read`,
            {
                method: "PUT",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        if (response.status === 401) {

            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) {

            const errorText = await response.text();

            throw new Error(
                errorText || "Failed to mark notification as read"
            );
        }

        await loadNotifications();

    } catch (error) {

        console.error(
            "Mark notification as read error:",
            error
        );

        alert(
            "Could not mark notification as read."
        );
    }
}


// Make transfer
async function makeTransfer() {

    const fromAccount =
        document.getElementById("fromAccount").value;

    const toAccount =
        document.getElementById("toAccount").value;

    const amount =
        document.getElementById("amount").value;

    const transactionType =
        document.getElementById("transactionType").value;

    const message =
        document.getElementById("message");


    message.textContent = "";
    message.style.color = "";


    if (!fromAccount || !toAccount || !amount) {

        message.textContent =
            "Please fill all transfer details.";

        message.style.color = "#dc3545";

        return;
    }


    if (Number(amount) <= 0) {

        message.textContent =
            "Amount must be greater than zero.";

        message.style.color = "#dc3545";

        return;
    }


    if (Number(fromAccount) === Number(toAccount)) {

        message.textContent =
            "Source and destination accounts cannot be the same.";

        message.style.color = "#dc3545";

        return;
    }


    try {

        const response = await fetch(
            "http://localhost:8080/api/transactions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },

                body: JSON.stringify({
                    fromAccount: Number(fromAccount),
                    toAccount: Number(toAccount),
                    amount: Number(amount),
                    transactionType: transactionType
                })
            }
        );


        if (response.status === 401) {

            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }


        const data = await response.json();


        if (!response.ok) {

            message.textContent =
                data.message ||
                data.error ||
                "Transfer failed.";

            message.style.color = "#dc3545";

            addNotification(
                "Transaction Failed",
                data.message ||
                data.error ||
                "Your transaction could not be completed.",
                "danger"
            );

            return;
        }


        if (data.status === "SUSPICIOUS") {

            message.textContent =
                "Transaction submitted and marked suspicious. Waiting for admin approval.";

            message.style.color = "#d97706";


            addNotification(
                "Transaction Under Review",
                "Your transaction has been flagged as suspicious and is waiting for admin approval.",
                "warning"
            );

        } else {

            message.textContent =
                "Transaction completed successfully.";

            message.style.color = "#198754";


            addNotification(
                "Transaction Successful",
                "Your transaction was completed successfully.",
                "success"
            );
        }


        document.getElementById("amount").value = "";

        await loadAccounts();
        await loadTransactionHistory();
        await loadNotifications();

    } catch (error) {

        console.error(error);

        message.textContent =
            "Unable to complete transfer.";

        message.style.color = "#dc3545";


        addNotification(
            "Transaction Error",
            "Unable to complete the transaction. Please try again.",
            "danger"
        );
    }
}


// Load transaction history
async function loadTransactionHistory() {

    const body =
        document.getElementById("transactionHistoryBody");

    try {

        const response = await fetch(
            "http://localhost:8080/api/transactions/history",
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );


        if (response.status === 401) {

            localStorage.removeItem("token");
            window.location.href = "login.html";
            return;
        }


        if (!response.ok) {
            throw new Error("Failed to load transaction history");
        }


        const transactions =
            await response.json();


        const selectedStatus =
            document.getElementById("statusFilter").value;


        let filteredTransactions =
            transactions;


        if (selectedStatus !== "ALL") {

            filteredTransactions =
                transactions.filter(
                    transaction =>
                        String(transaction.status).toUpperCase() ===
                        selectedStatus
                );
        }


        body.innerHTML = "";


        if (
            !filteredTransactions ||
            filteredTransactions.length === 0
        ) {

            body.innerHTML = `
                <tr>
                    <td colspan="8">
                        No transactions found.
                    </td>
                </tr>
            `;

            return;
        }


        filteredTransactions.forEach(transaction => {

            const row =
                document.createElement("tr");


            const status =
                String(transaction.status || "").toUpperCase();


            let statusClass = "status-default";


            if (status === "SUCCESS") {
                statusClass = "status-success";
            } else if (status === "SUSPICIOUS") {
                statusClass = "status-suspicious";
            } else if (status === "REJECTED") {
                statusClass = "status-rejected";
            }


            row.innerHTML = `

                <td>
                    ${transaction.transactionId ?? "N/A"}
                </td>

                <td>
                    ${transaction.fromAccount ?? "N/A"}
                </td>

                <td>
                    ${transaction.toAccount ?? "N/A"}
                </td>

                <td>
                    ₹${transaction.amount ?? "0"}
                </td>

                <td>
                    ${transaction.transactionType ?? "N/A"}
                </td>

                <td>
                    ${formatDate(transaction.transactionDate)}
                </td>

                <td class="${statusClass}">
                    ${transaction.status ?? "N/A"}
                </td>

                <td>
                    <button
                        class="details-btn"
                        onclick="viewTransactionDetails(${transaction.transactionId})">
                        View Details
                    </button>
                </td>
            `;


            body.appendChild(row);

        });

    } catch (error) {

        console.error(error);

        body.innerHTML = `
            <tr>
                <td colspan="8">
                    Unable to load transaction history.
                </td>
            </tr>
        `;
    }
}


// Format transaction date
function formatDate(dateValue) {

    if (!dateValue) {
        return "N/A";
    }

    try {

        const date = new Date(dateValue);

        if (isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleString();

    } catch (error) {

        return dateValue;
    }
}


// Find transaction by ID
async function findTransactionById(transactionId) {

    try {

        const response = await fetch(
            "http://localhost:8080/api/transactions/history",
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );


        if (!response.ok) {
            throw new Error("Unable to retrieve transaction");
        }


        const transactions =
            await response.json();


        return transactions.find(
            transaction =>
                Number(transaction.transactionId) ===
                Number(transactionId)
        );


    } catch (error) {

        console.error(error);

        return null;
    }
}


// View transaction details
async function viewTransactionDetails(transactionId) {

    const transaction =
        await findTransactionById(transactionId);


    if (!transaction) {

        alert("Unable to load transaction details.");

        return;
    }


    createTransactionModal(transaction);
}


// Create transaction details modal
function createTransactionModal(transaction) {

    const oldModal =
        document.getElementById("transactionDetailsModal");

    if (oldModal) {
        oldModal.remove();
    }


    const status =
        String(transaction.status || "").toUpperCase();


    const suspicious =
        transaction.isSuspicious === 1 ||
        transaction.isSuspicious === true ||
        status === "SUSPICIOUS";


    let securityClass = "security-safe";

    let securityTitle = "Transaction Secure";

    let securityMessage =
        "This transaction was processed successfully.";


    if (suspicious) {

        securityClass = "security-warning";

        securityTitle = "Transaction Under Review";

        securityMessage =
            "This transaction has been flagged by the fraud detection system and is waiting for review by an administrator.";

    } else if (status === "REJECTED") {

        securityClass = "security-danger";

        securityTitle = "Transaction Rejected";

        securityMessage =
            "This transaction was rejected and was not completed.";

    } else if (status === "SUCCESS") {

        securityClass = "security-safe";

        securityTitle = "Transaction Successful";

        securityMessage =
            "This transaction was completed successfully.";

    }


    const fraudReason =
        transaction.fraudReason ||
        transaction.fraud_reason ||
        "No fraud reason available";


    const overlay =
        document.createElement("div");

    overlay.id =
        "transactionDetailsModal";

    overlay.className =
        "modal-overlay";


    overlay.innerHTML = `

        <div class="transaction-modal">

            <div class="modal-header">

                <h2>Transaction Details</h2>

                <button
                    class="close-modal"
                    onclick="closeTransactionModal()">
                    &times;
                </button>

            </div>


            <div class="modal-body">

                <div class="detail-grid">

                    <div class="detail-item">
                        <strong>Transaction ID</strong>
                        <span>
                            ${transaction.transactionId ?? "N/A"}
                        </span>
                    </div>


                    <div class="detail-item">
                        <strong>Status</strong>
                        <span>
                            ${transaction.status ?? "N/A"}
                        </span>
                    </div>


                    <div class="detail-item">
                        <strong>From Account</strong>
                        <span>
                            ${transaction.fromAccount ?? "N/A"}
                        </span>
                    </div>


                    <div class="detail-item">
                        <strong>To Account</strong>
                        <span>
                            ${transaction.toAccount ?? "N/A"}
                        </span>
                    </div>


                    <div class="detail-item">
                        <strong>Amount</strong>
                        <span>
                            ₹${transaction.amount ?? "0"}
                        </span>
                    </div>


                    <div class="detail-item">
                        <strong>Transaction Type</strong>
                        <span>
                            ${transaction.transactionType ?? "N/A"}
                        </span>
                    </div>


                    <div class="detail-item">
                        <strong>Transaction Date</strong>
                        <span>
                            ${formatDate(transaction.transactionDate)}
                        </span>
                    </div>


                    <div class="detail-item">
                        <strong>Fraud Detection</strong>
                        <span>
                            ${suspicious ? "Flagged" : "Not Flagged"}
                        </span>
                    </div>

                </div>


                <div class="security-box ${securityClass}">

                    <h3>
                        ${securityTitle}
                    </h3>

                    <p>
                        ${securityMessage}
                    </p>

                    ${
                        suspicious
                        ?
                        `
                        <p>
                            <strong>Fraud Reason:</strong>
                            ${fraudReason}
                        </p>
                        `
                        :
                        ""
                    }

                </div>

            </div>


            <div class="modal-footer">

                <button
                    class="close-btn"
                    onclick="closeTransactionModal()">
                    Close
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(overlay);


    overlay.addEventListener("click", function(event) {

        if (event.target === overlay) {
            closeTransactionModal();
        }

    });
}


// Close transaction modal
function closeTransactionModal() {

    const modal =
        document.getElementById("transactionDetailsModal");

    if (modal) {
        modal.remove();
    }
}


// Logout
function logout() {

    const confirmed =
        confirm("Are you sure you want to logout?");

    if (!confirmed) {
        return;
    }

    localStorage.removeItem("token");

    window.location.href = "login.html";
}


// Initial page load
loadAccounts();
loadTransactionHistory();
loadNotifications();