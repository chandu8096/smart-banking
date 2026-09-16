package smartbanking.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import smartbanking.dto.CustomerResponse;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import smartbanking.dto.LoginRequest;
import smartbanking.dto.LoginResponse;
import smartbanking.entity.Account;
import smartbanking.entity.User;
import smartbanking.repository.AccountRepository;
import smartbanking.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;

    public UserService(
            UserRepository userRepository,
            AccountRepository accountRepository,
            PasswordEncoder passwordEncoder,
            JwtEncoder jwtEncoder) {

        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
    }

    public User registerUser(User user) {

        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        user.setRole("CUSTOMER");
        user.setStatus("ACTIVE");

        User savedUser = userRepository.save(user);

        Account account = new Account();

        account.setUserId(savedUser.getId());
        account.setAccountNumber("SB" + savedUser.getId());
        account.setBalance(new BigDecimal("10000"));
        account.setStatus("ACTIVE");

        accountRepository.save(account);

        return savedUser;
    }

    public LoginResponse login(LoginRequest request) {

        User user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new BadCredentialsException(
                                "Invalid email or password"
                        )
                );

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new BadCredentialsException(
                    "Invalid email or password"
            );
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {

            throw new BadCredentialsException(
                    "User account is not active"
            );
        }

        Instant now = Instant.now();

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("smart-banking")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(3600))
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("role", user.getRole())
                .build();

        String token = jwtEncoder
                .encode(JwtEncoderParameters.from(claims))
                .getTokenValue();

        return new LoginResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }
    public List<CustomerResponse> getAllCustomers() {

    return userRepository.findByRole("CUSTOMER")
            .stream()
            .map(CustomerResponse::new)
            .toList();
}

public CustomerResponse updateCustomerStatus(Long userId, String status) {

    if (status == null || status.isBlank()) {
        throw new RuntimeException("Status is required");
    }

    String newStatus = status.trim().toUpperCase();

    if (!newStatus.equals("ACTIVE") && !newStatus.equals("INACTIVE")) {
        throw new RuntimeException("Status must be ACTIVE or INACTIVE");
    }

    User user = userRepository.findById(userId)
            .orElseThrow(() ->
                    new RuntimeException("Customer not found"));

    if (!"CUSTOMER".equalsIgnoreCase(user.getRole())) {
        throw new RuntimeException(
                "Only customer accounts can be activated or deactivated");
    }

    user.setStatus(newStatus);

    User updatedUser = userRepository.save(user);

    return new CustomerResponse(updatedUser);
}
}