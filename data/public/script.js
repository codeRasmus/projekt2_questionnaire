function getPersistentId() {
    let runNr = localStorage.getItem("runNr");
    if (!runNr) {
        runNr = crypto.randomUUID();
        localStorage.setItem("runNr", runNr);
    }
    return runNr;
}

async function submitUser(event) {
    const userData = {
        alder: document.getElementById("alder").value,
        køn: document.getElementById("køn").value,
        uddannelse: document.getElementById("uddannelse").value,
        beskæftigelse: document.getElementById("beskæftigelse").value,
        runNr: getPersistentId()
    };

    try {
        const response = await fetch('http://localhost:3000/submitUser', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData)
        });

        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
            const json = await response.json();
            console.log("Server response:", json);

            if (json.redirect) {
                window.location.href = json.redirect;
            }
        } else {
            // Hvis det ikke er JSON, så log responsen
            const text = await response.text();
            console.error("Server returned non-JSON response:", text);
        }
    } catch (error) {
        console.error("Error:", error.message);
    }
}

document.querySelector("form").addEventListener("submit", submitUser);