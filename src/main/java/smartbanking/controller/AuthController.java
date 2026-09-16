package smartbanking.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import smartbanking.dto.LoginRequest;
import smartbanking.dto.LoginResponse;
import smartbanking.dto.UserResponse;
import smartbanking.entity.User;
import smartbanking.service.UserService;

@RestController
@RequestMapping("/api/users")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public UserResponse register(@RequestBody User user) {
        User savedUser = userService.registerUser(user);
        return new UserResponse(savedUser);
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return userService.login(request);
    }
}