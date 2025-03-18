document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch("/admin/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            // Gem token i localStorage 
            localStorage.setItem("authToken", data.token);
            alert("Login successful!");
            window.location.href = "/admin.html"; // Redirect til admin.html
        } else {
            alert("Login failed!");
        }
    })
    .catch(err => console.error("Error during login:", err));
});
