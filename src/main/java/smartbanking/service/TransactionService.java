package smartbanking.service;

import smartbanking.dto.AdminDashboardResponse;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import smartbanking.entity.Account;
import smartbanking.entity.Transaction;
import smartbanking.repository.AccountRepository;
import smartbanking.repository.TransactionRepository;
import smartbanking.repository.UserRepository;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public TransactionService(
            TransactionRepository transactionRepository,
            AccountRepository accountRepository,
            UserRepository userRepository,
            NotificationService notificationService) {

        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public Transaction createTransaction(Transaction transaction) {

        transaction.setTransactionDate(LocalDateTime.now());

        // Validate amount
        if (transaction.getAmount() == null
                || transaction.getAmount().compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Transaction amount must be greater than zero");
        }

        // Find source account
        Account fromAccount = accountRepository
                .findById(transaction.getFromAccount())
                .orElseThrow(() ->
                        new RuntimeException("Source account not found"));

        // Get currently logged-in user
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String loggedInEmail = authentication.getName();

        Long loggedInUserId = userRepository
                .findByEmail(loggedInEmail)
                .orElseThrow(() ->
                        new RuntimeException("User not found"))
                .getId();

        // Check source account ownership
        if (!loggedInUserId.equals(fromAccount.getUserId())) {
            throw new RuntimeException(
                    "You are not authorized to use this source account");
        }

        // Find destination account
        Account toAccount = accountRepository
                .findById(transaction.getToAccount())
                .orElseThrow(() ->
                        new RuntimeException("Destination account not found"));

        // Check source account status
        if (!"ACTIVE".equalsIgnoreCase(fromAccount.getStatus())) {
            throw new RuntimeException("Source account is not active");
        }

        // Check destination account status
        if (!"ACTIVE".equalsIgnoreCase(toAccount.getStatus())) {
            throw new RuntimeException("Destination account is not active");
        }

        BigDecimal balance = fromAccount.getBalance();
        BigDecimal amount = transaction.getAmount();

        // ===============================
        // FRAUD RULE 1: HIGH AMOUNT
        // ===============================

        boolean highAmount =
                amount.compareTo(new BigDecimal("10000")) > 0;

        // ===============================
        // FRAUD RULE 2: INSUFFICIENT BALANCE
        // ===============================

        boolean insufficientBalance =
                balance != null && amount.compareTo(balance) > 0;

        // ===============================
        // FRAUD RULE 3: TOO MANY RECENT TRANSACTIONS
        // ===============================

        LocalDateTime cutoff =
                LocalDateTime.now().minusMinutes(1);

        long recentTransactions =
                transactionRepository.countRecentTransactions(
                        transaction.getFromAccount(),
                        cutoff);

        boolean tooManyTransactions =
                recentTransactions >= 2;

        // ===============================
        // FRAUD RULE 4: UNUSUAL AMOUNT
        // ===============================

        BigDecimal averageAmount =
                transactionRepository.findAverageTransactionAmount(
                        transaction.getFromAccount());

        boolean unusualAmount =
                averageAmount.compareTo(BigDecimal.ZERO) > 0
                && amount.compareTo(
                        averageAmount.multiply(new BigDecimal("5"))) > 0;

        // ===============================
        // BUILD FRAUD REASONS
        // ===============================

        List<String> fraudReasons = new ArrayList<>();

        if (highAmount) {
            fraudReasons.add("High transaction amount");
        }

        if (insufficientBalance) {
            fraudReasons.add("Insufficient account balance");
        }

        if (tooManyTransactions) {
            fraudReasons.add("Too many transactions in 1 minute");
        }

        if (unusualAmount) {
            fraudReasons.add("Unusual transaction amount");
        }

        // ===============================
        // MARK TRANSACTION
        // ===============================

        if (!fraudReasons.isEmpty()) {

            transaction.setIsSuspicious(1);
            transaction.setStatus("SUSPICIOUS");

            transaction.setFraudReason(
                    String.join(", ", fraudReasons));

        } else {

            transaction.setIsSuspicious(0);
            transaction.setStatus("SUCCESS");

            transaction.setFraudReason(null);
        }

        // ===============================
        // TRANSFER MONEY
        // ===============================

        if (!"SUSPICIOUS".equalsIgnoreCase(transaction.getStatus())) {

            fromAccount.setBalance(
                    balance.subtract(amount));

            toAccount.setBalance(
                    toAccount.getBalance().add(amount));

            accountRepository.save(fromAccount);
            accountRepository.save(toAccount);
        }

        // Save transaction
        Transaction savedTransaction =
                transactionRepository.save(transaction);

        // ===============================
        // CUSTOMER NOTIFICATION
        // ===============================

        if ("SUSPICIOUS".equalsIgnoreCase(savedTransaction.getStatus())) {

            notificationService.createNotification(
                    loggedInUserId,
                    "Transaction Under Review",
                    "Your transaction has been flagged as suspicious and is waiting for admin approval.",
                    "WARNING");

        } else {

            notificationService.createNotification(
                    loggedInUserId,
                    "Transaction Successful",
                    "Your transaction was completed successfully.",
                    "SUCCESS");
        }

        return savedTransaction;
    }


    // Get all transactions
    public List<Transaction> getAllTransactions() {

        return transactionRepository.findAll();
    }


    // Get transactions belonging to logged-in customer
    public List<Transaction> getTransactionHistory(Long userId) {

        return transactionRepository.findTransactionsByUserId(userId);
    }


    // Get suspicious transactions
    public List<Transaction> getSuspiciousTransactions() {

        return transactionRepository.findSuspiciousTransactions();
    }


    // Admin dashboard
    public AdminDashboardResponse getAdminDashboard() {

        long totalUsers = userRepository.count();

        long totalAccounts = accountRepository.count();

        long totalTransactions = transactionRepository.count();

        long suspiciousTransactions =
                transactionRepository.countByStatusAndIsSuspicious(
                        "SUSPICIOUS", 1);

        long rejectedTransactions =
                transactionRepository.countByStatus("REJECTED");

        long successfulTransactions =
                transactionRepository.countByStatus("SUCCESS");

        return new AdminDashboardResponse(
                totalUsers,
                totalAccounts,
                totalTransactions,
                suspiciousTransactions,
                rejectedTransactions,
                successfulTransactions);
    }


    // Admin approve transaction
    @Transactional
    public Transaction approveTransaction(Long transactionId) {

        Transaction transaction = transactionRepository
                .findById(transactionId)
                .orElseThrow(() ->
                        new RuntimeException("Transaction not found"));

        // Only suspicious transactions can be approved
        if (!"SUSPICIOUS".equalsIgnoreCase(transaction.getStatus())) {

            throw new RuntimeException(
                    "Transaction is not suspicious");
        }

        // Find source account
        Account fromAccount = accountRepository
                .findById(transaction.getFromAccount())
                .orElseThrow(() ->
                        new RuntimeException("Source account not found"));

        // Find destination account
        Account toAccount = accountRepository
                .findById(transaction.getToAccount())
                .orElseThrow(() ->
                        new RuntimeException("Destination account not found"));

        BigDecimal balance = fromAccount.getBalance();

        BigDecimal amount = transaction.getAmount();

        // Check balance again before approval
        if (balance == null || amount.compareTo(balance) > 0) {

            throw new RuntimeException(
                    "Insufficient account balance");
        }

        // Transfer money
        fromAccount.setBalance(
                balance.subtract(amount));

        toAccount.setBalance(
                toAccount.getBalance().add(amount));

        accountRepository.save(fromAccount);

        accountRepository.save(toAccount);

        // Mark transaction successful
        transaction.setStatus("SUCCESS");

        transaction.setIsSuspicious(0);

        Transaction approvedTransaction =
                transactionRepository.save(transaction);

        // ===============================
        // CUSTOMER NOTIFICATION
        // ===============================

        notificationService.createNotification(
                getTransactionUserId(approvedTransaction),
                "Transaction Approved",
                "Your suspicious transaction has been approved by the administrator and completed successfully.",
                "SUCCESS");

        return approvedTransaction;
    }


    // Admin reject transaction
    public Transaction rejectTransaction(Long transactionId) {

        Transaction transaction = transactionRepository
                .findById(transactionId)
                .orElseThrow(() ->
                        new RuntimeException("Transaction not found"));

        // Only suspicious transactions can be rejected
        if (!"SUSPICIOUS".equalsIgnoreCase(transaction.getStatus())) {

            throw new RuntimeException(
                    "Transaction is not suspicious");
        }

        // Reject transaction
        transaction.setStatus("REJECTED");

        transaction.setIsSuspicious(1);

        Transaction rejectedTransaction =
                transactionRepository.save(transaction);

        // ===============================
        // CUSTOMER NOTIFICATION
        // ===============================

        notificationService.createNotification(
                getTransactionUserId(rejectedTransaction),
                "Transaction Rejected",
                "Your suspicious transaction was rejected by the administrator.",
                "DANGER");

        return rejectedTransaction;
    }


    // Get customer ID who owns the transaction
    private Long getTransactionUserId(Transaction transaction) {

        Account fromAccount = accountRepository
                .findById(transaction.getFromAccount())
                .orElseThrow(() ->
                        new RuntimeException("Source account not found"));

        return fromAccount.getUserId();
    }
}