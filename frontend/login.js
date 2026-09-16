function login() {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("message");

    if (!email || !password) {
        message.textContent = "Please enter email and password.";
        return;
    }

    fetch("http://localhost:8080/api/users/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
    .then(async response => {

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Login failed"
            );
        }

        return data;
    })
    .then(data => {

        // Save JWT token
        localStorage.setItem("token", data.token);

        // Read the JWT payload
        const payload = JSON.parse(
            atob(
                data.token
                    .split(".")[1]
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
            )
        );

        // Check user role
        if (payload.role === "ADMIN") {

            window.location.href =
                "admin-dashboard.html";

        } else {

            window.location.href =
                "customer-dashboard.html";
        }
    })
    .catch(error => {

        console.error(
            "Login error:",
            error
        );

        message.textContent =
            "Login failed: " + error.message;
    });
}