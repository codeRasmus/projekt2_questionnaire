// Når admin.html indlæses, tjekkes for tokenet i localStorage
window.onload = function () {
  // Først sikres, at der er en token
  const token = localStorage.getItem("authToken");
  // Hvis token ikke findes, omdirigeres til login-siden
  if (!token) {
    window.location.href = "/login.html";
  }
};

async function fetchResponses(token) {
  if (!token) {
    console.error("❌ Ingen token tilgængelig. Kan ikke hente besvarelser.");
    return;
  }

  try {
    const res = await fetch("/admin/responses", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      const responseList = document.getElementById("responseList");
      responseList.innerHTML = ""; // Ryd tidligere liste

      // Hvis besvarelserne findes, tilføj dem til listen
      if (data.responses) {
        data.responses.forEach((response) => {
          const li = document.createElement("li");
          li.textContent = response;
          responseList.appendChild(li);
        });
      }
    } else {
      console.error("Fejl ved hentning af besvarelser:", await res.text());
    }
  } catch (error) {
    console.error("Fejl ved hentning af besvarelser:", error);
  }
}

// Funktion til at tjekke, om tokenet er udløbet
function isTokenExpired(token) {
  if (!token) return true; // Hvis ingen token, er den "udløbet"
  const payload = JSON.parse(atob(token.split(".")[1])); // Decode token payload
  return Date.now() >= payload.exp * 1000; // Sammenlign med nuværende tid
}

// Funktion til at tjekke auth-status og logge ud hvis token er udløbet
function checkAuth() {
  const token = localStorage.getItem("authToken");
  if (isTokenExpired(token)) {
    alert("Din session er udløbet. Du bliver sendt til login-siden.");
    logout(); // Kald logout
  }
}

// Funktion til at logge ud
function logout() {
  localStorage.removeItem("authToken"); // Fjern token
  window.location.href = "/login.html"; // Redirect til login-siden
}

// Kør tjekket ved indlæsning af admin.html
checkAuth();

// Tjek tokenet hvert sekund (automatisk log ud, hvis det udløber)
setInterval(checkAuth, 30000);

// Funktion til at downloade besvarelserne som en ZIP-fil
async function downloadResponses() {
  const token = localStorage.getItem("authToken");

  const res = await fetch("/admin/download-responses", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.ok) {
    // Konverterer svaret til en blob (binær data)
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    // Opretter et usynligt download-link
    const a = document.createElement("a");
    a.href = url;
    a.download = "responses.zip";
    document.body.appendChild(a);
    a.click();

    // Oprydning
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } else {
    alert("Fejl ved download af besvarelser");
  }
}

// Håndtering af xml upload
async function uploadXML() {
  const fileInput = document.getElementById("xmlFileInput");
  const statusText = document.getElementById("uploadStatus");
  const token = localStorage.getItem("authToken");

  if (!token) {
    alert("Du er ikke logget ind!");
    return;
  }

  if (fileInput.files.length === 0) {
    alert("Vælg en XML-fil først!");
    return;
  }

  const file = fileInput.files[0];

  if (file.type !== "text/xml") {
    alert("Kun XML-filer er tilladt!");
    return;
  }

  const formData = new FormData();
  formData.append("xmlFile", file);

  try {
    const res = await fetch("/admin/upload-xml", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await res.json();
    if (res.ok) {
      statusText.textContent = "✅ Filen blev uploadet!";
      statusText.style.color = "green";
    } else {
      statusText.textContent = "❌ Fejl: " + result.error;
      statusText.style.color = "red";
    }
  } catch (error) {
    console.error("Fejl ved upload:", error);
    statusText.textContent = "❌ En fejl opstod under upload.";
    statusText.style.color = "red";
  }
}

async function showStatistics() {
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("statistics").style.display = "flex";

  let res = await fetch("/admin/getStatistics", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  if (!res.ok) {
    throw new Error("Fejl ved hentning af data");
  }

  const result = await res.json();

  let answers = Object.values(result);
  console.log(answers);
  document.getElementById("totalAnswers").textContent = answers.length;

  let ages = [];
  let gender = [];
  let education = [];
  let work = [];

  for (let i = 0; i < answers.length; i++) {
    ages.push(answers[i].demografi.alder);
    gender.push(answers[i].demografi.køn);
    education.push(answers[i].demografi.uddannelse);
    work.push(answers[i].demografi.beskæftigelse);
  }

  function countOccurrences(array) {
    return array.reduce((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }
  let ageCounts = countOccurrences(ages);
  let genderCounts = countOccurrences(gender);
  let educationCounts = countOccurrences(education);
  let workCounts = countOccurrences(work);

  createChart(ageCounts, document.getElementById("ageChart").getContext("2d"));
  createChart(
    genderCounts,
    document.getElementById("genderChart").getContext("2d")
  );
  createChart(
    educationCounts,
    document.getElementById("educationChart").getContext("2d")
  );

  function createChart(data, canvas) {
    new Chart(canvas, {
      type: "bar",
      data: {
        labels: Object.keys(data),
        datasets: [
          {
            label: "Antal",
            data: Object.values(data),
            backgroundColor: "rgb(195, 58, 254)",
            borderColor: "rgb(255, 255, 255)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
      },
    });
  }
}

function showDashboard() {
  document.getElementById("dashboard").style.display = "flex";
  document.getElementById("statistics").style.display = "none";
}
