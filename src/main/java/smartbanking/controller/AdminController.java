package smartbanking.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import smartbanking.dto.AdminDashboardResponse;
import smartbanking.dto.CustomerResponse;
import smartbanking.dto.StatusUpdateRequest;
import smartbanking.entity.Transaction;
import smartbanking.service.TransactionService;
import smartbanking.service.UserService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final TransactionService transactionService;
    private final UserService userService;

    public AdminController(
            TransactionService transactionService,
            UserService userService) {

        this.transactionService = transactionService;
        this.userService = userService;
    }

    // ================================
    // ADMIN DASHBOARD
    // ================================

    @GetMapping("/dashboard")
    public AdminDashboardResponse getAdminDashboard() {
        return transactionService.getAdminDashboard();
    }


    // ================================
    // ALL TRANSACTIONS
    // ================================

    @GetMapping("/transactions")
    public List<Transaction> getAllTransactions() {
        return transactionService.getAllTransactions();
    }


    // ================================
    // SUSPICIOUS TRANSACTIONS
    // ================================

    @GetMapping("/suspicious-transactions")
    public List<Transaction> getSuspiciousTransactions() {
        return transactionService.getSuspiciousTransactions();
    }


    // ================================
    // APPROVE TRANSACTION
    // ================================

    @PutMapping("/transactions/{transactionId}/approve")
    public Transaction approveTransaction(
            @PathVariable Long transactionId) {

        return transactionService.approveTransaction(transactionId);
    }


    // ================================
    // REJECT TRANSACTION
    // ================================

    @PutMapping("/transactions/{transactionId}/reject")
    public Transaction rejectTransaction(
            @PathVariable Long transactionId) {

        return transactionService.rejectTransaction(transactionId);
    }


    // ================================
    // CUSTOMER MANAGEMENT
    // ================================

    @GetMapping("/customers")
    public List<CustomerResponse> getAllCustomers() {
        return userService.getAllCustomers();
    }


    @PutMapping("/customers/{userId}/status")
    public CustomerResponse updateCustomerStatus(
            @PathVariable Long userId,
            @RequestBody StatusUpdateRequest request) {

        return userService.updateCustomerStatus(
                userId,
                request.getStatus()
        );
    }


    // ================================
    // ERROR HANDLING
    // ================================

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(
            RuntimeException ex) {

        return ResponseEntity
                .badRequest()
                .body(ex.getMessage());
    }
}