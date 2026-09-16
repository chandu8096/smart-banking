package smartbanking.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import smartbanking.entity.User;
import smartbanking.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import smartbanking.entity.Transaction;
import smartbanking.service.TransactionService;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;
     private final UserRepository userRepository;

    public TransactionController(TransactionService transactionService, UserRepository userRepository) {
        this.transactionService = transactionService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<Transaction> createTransaction(
            @RequestBody Transaction transaction) {

        return ResponseEntity.ok(
                transactionService.createTransaction(transaction)
        );
    }
    @GetMapping("/history")
    public List<Transaction> getMyTransactionHistory(
        Authentication authentication) {

    String email = authentication.getName();

    User user = userRepository
            .findByEmail(email)
            .orElseThrow(() ->
                    new RuntimeException("User not found"));

    return transactionService
            .getTransactionHistory(user.getId());
     }


    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(RuntimeException ex) {
    return ResponseEntity
            .badRequest()
            .body(ex.getMessage());
    }
}