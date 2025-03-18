// document.addEventListener("DOMContentLoaded", () => { // Sikrer at DOM'en er loaded
//     console.log("DOM loaded, tilføjer event listener...");

//     const form = document.querySelector("form");
//     if (!form) {
//         console.error("Formularen blev ikke fundet i DOM'en!");
//         return;
//     }

//     form.addEventListener("submit", submitUser);
// });

// function getPersistentId() {
//     let runNr = localStorage.getItem("runNr");
//     if (!runNr) {
//         runNr = crypto.randomUUID();
//         localStorage.setItem("runNr", runNr);
//     }
//     return runNr;
// }

// async function submitUser(event) {
//     event.preventDefault(); // 🚀 STOP standard GET-request!

//     console.log("DEBUG: submitUser() kaldt, event.preventDefault() eksekveret!");

//     // Test: Er eventet korrekt?
//     if (!event) {
//         console.error("❌ FEJL: event er ikke defineret!");
//         return;
//     }

//     // Hent formularværdier korrekt fra DOM
//     const alder = document.getElementById("alder").value;
//     const køn = document.getElementById("køn").value;
//     const uddannelse = document.getElementById("uddannelse").value;
//     const beskæftigelse = document.getElementById("beskæftigelse").value;
//     const runNr = getPersistentId();

//     // Test: Er værdierne korrekte?
//     console.log("DEBUG: Indsamlet brugerdata:", { alder, køn, uddannelse, beskæftigelse, runNr });

//     try {
//         const response = await fetch('http://localhost:3000/submitUser', {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({ alder, køn, uddannelse, beskæftigelse, runNr })
//         });

//         console.log("DEBUG: Fetch anmodning sendt, venter på serverens svar...");

//         if (!response.ok) {
//             throw new Error(`❌ FEJL: Response status: ${response.status}`);
//         }

//         const json = await response.json();
//         console.log("✅ DEBUG: Server response:", json);
//     } catch (error) {
//         console.error("❌ ERROR:", error.message);
//     }
// }

