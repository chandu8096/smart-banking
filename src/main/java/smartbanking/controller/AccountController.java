package smartbanking.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import smartbanking.entity.Account;
import smartbanking.repository.AccountRepository;
import smartbanking.repository.UserRepository;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public AccountController(
            AccountRepository accountRepository,
            UserRepository userRepository) {

        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Account> getMyAccounts(Authentication authentication) {

        String email = authentication.getName();

        Long userId = userRepository
                .findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"))
                .getId();

        return accountRepository.findByUserId(userId);
    }
}