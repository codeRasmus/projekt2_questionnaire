document.addEventListener("DOMContentLoaded", async () => {
  let runNr = localStorage.getItem("runNr");
  const page = window.location.pathname.split("/").pop();

  if (
    window.location.pathname === "/" ||
    window.location.pathname.endsWith("/index.html")
  ) {
    console.log("✅ Indsætter Demografi form");
    insertDemografiFormFromXML();
  } else {
    if (!runNr) {
      alert("Fejl: Du skal først udfylde demografi-formularen.");
      window.location.href = "/";
      return;
    }

    console.log("✅ Validerer runNr:", runNr);
    const isValid = await validateRunNr(runNr, page);
    if (!isValid) {
      alert("Fejl: Dit runNr er ugyldigt. Prøv at starte forfra.");
      localStorage.removeItem("runNr");
      window.location.href = "/";
      return;
    }

    console.log("✅ Indsætter Undersøgelse form");
    document.getElementById("showSurveyBtn").addEventListener("click", () => {
      insertUndersøgelseForm();
    });
  }
});

function getPersistentId() {
  let runNr = localStorage.getItem("runNr");
  if (!runNr) {
    runNr = crypto.randomUUID();
    localStorage.setItem("runNr", runNr);
  }
  return runNr;
}

async function validateRunNr(runNr, page) {
  console.log("📤 Validerer runNr:", runNr, "på siden:", page);

  try {
    const response = await fetch("http://localhost:3000/validateRunNr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runNr, page }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("❌ Fejl:", data.error);
      return false; // runNr er ugyldigt
    } else {
      console.log("✅ Server respons:", data.message);
      return true; // runNr er valid
    }
  } catch (error) {
    console.error("❌ Netværksfejl:", error.message);
    return false;
  }
}

// Inser Demografi form
function insertDemografiFormFromXML() {
  fetch("spørgeskema.xml")
    .then((response) => response.text())
    .then((xmlText) => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      // Select the first spørgesmålsgruppe (Demografi)
      const group = xmlDoc.querySelector("spørgsmålsgruppe");
      if (!group) return;

      // Create form
      const form = document.createElement("form");
      form.setAttribute("id", "demografiForm");

      // Create fieldset
      const fieldset = document.createElement("fieldset");

      // Array to store question containers
      const questionContainers = [];

      // Process questions
      group.querySelectorAll("spørgsmål").forEach((question, index) => {
        const idElement = question.querySelector("id");
        const typeElement = question.querySelector("type");
        const labelTextElement = question.querySelector("tekst");

        if (!idElement || !typeElement || !labelTextElement) return;

        const id = idElement.textContent;
        const type = typeElement.textContent;
        const labelText = labelTextElement.textContent;

        // Create question container
        const questionDiv = document.createElement("div");
        questionDiv.classList.add("question_container");
        if (index === 0) questionDiv.classList.add("active");

        // Create label
        const label = document.createElement("label");
        label.setAttribute("for", id);
        label.textContent = labelText;
        questionDiv.appendChild(label);

        // Create input field based on type
        let inputElement;
        if (type === "integer") {
          inputElement = document.createElement("input");
          inputElement.setAttribute("type", "number");
          inputElement.setAttribute("id", id);
          inputElement.setAttribute("name", id);
          inputElement.setAttribute("required", "true");

          const minElement = question.querySelector("min");
          if (minElement) {
            inputElement.setAttribute("min", minElement.textContent);
          }
        } else if (type === "dropdown") {
          inputElement = document.createElement("select");
          inputElement.setAttribute("id", id);
          inputElement.setAttribute("name", id);

          question.querySelectorAll("option").forEach((option) => {
            const optionElement = document.createElement("option");
            optionElement.setAttribute("value", option.textContent);
            optionElement.textContent = option.textContent;
            inputElement.appendChild(optionElement);
          });
        } else if (type === "tekst") {
          inputElement = document.createElement("textarea");
          inputElement.setAttribute("id", id);
          inputElement.setAttribute("name", id);
        } else {
          inputElement = document.createElement("input");
          inputElement.setAttribute("type", "text");
        }

        questionDiv.appendChild(inputElement);
        fieldset.appendChild(questionDiv);
        questionContainers.push(questionDiv);
      });

      // Navigation buttons
      const buttonContainer = document.createElement("div");
      buttonContainer.classList.add("buttons");

      const prevBtn = document.createElement("button");
      prevBtn.setAttribute("type", "button");
      prevBtn.textContent = "Tilbage";
      prevBtn.style.display = "none";

      const nextBtn = document.createElement("button");
      nextBtn.setAttribute("type", "button");
      nextBtn.textContent = "Næste";

      const submitButton = document.createElement("button");
      // submitButton.setAttribute("type", "submit");
      submitButton.textContent = "Send";
      submitButton.style.display = "none"; // Initially hidden
      submitButton.addEventListener("click", submitUser);

      buttonContainer.appendChild(prevBtn);
      buttonContainer.appendChild(nextBtn);
      buttonContainer.appendChild(submitButton);
      fieldset.appendChild(buttonContainer);
      form.appendChild(fieldset);
      document.body.appendChild(form);

      let currentIndex = 0;

      function showQuestion(index) {
        questionContainers.forEach((q, i) => {
          q.classList.toggle("active", i === index);
        });

        prevBtn.style.display = index === 0 ? "none" : "inline-block";

        // If last question, show submit button and hide "Next"
        if (index === questionContainers.length - 1) {
          nextBtn.style.display = "none";
          submitButton.style.display = "inline-block";
        } else {
          nextBtn.style.display = "inline-block";
          submitButton.style.display = "none";
        }
      }

      nextBtn.addEventListener("click", () => {
        if (currentIndex < questionContainers.length - 1) {
          currentIndex++;
          showQuestion(currentIndex);
        }
      });

      prevBtn.addEventListener("click", () => {
        if (currentIndex > 0) {
          currentIndex--;
          showQuestion(currentIndex);
        }
      });
      showQuestion(currentIndex);
    })
    .catch((error) => console.error("Error loading XML:", error));
}

// Insert Undersøgelse form
function insertUndersøgelseForm() {
  fetch("spørgeskema.xml")
    .then((response) => response.text())
    .then((xmlText) => {
      document.querySelector(".btnContainer").style.display = "none";
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      const group = xmlDoc.querySelectorAll("spørgsmålsgruppe")[1];
      if (!group) return;

      const form = document.createElement("form");
      form.setAttribute("id", "surveyForm");

      const fieldset = document.createElement("fieldset");
      const questions = Array.from(group.querySelectorAll("spørgsmål"));
      shuffleArray(questions);

      const questionContainers = [];

      questions.forEach((question, index) => {
        const idElement = question.querySelector("id");
        const typeElement = question.querySelector("type");
        const labelTextElement = question.querySelector("tekst");

        if (!idElement || !typeElement || !labelTextElement) return;

        const id = idElement.textContent;
        const type = typeElement.textContent;
        let labelText = labelTextElement.textContent;

        if (type === "Likert") {
          labelText =
            "På en skala fra 1 til 6, hvor enig er du i følgende udsagn: <br><br>" +
            "<i>" +
            labelTextElement.textContent +
            "</i>";
        }

        const questionDiv = document.createElement("div");
        questionDiv.classList.add("question_container");
        if (index === 0) questionDiv.classList.add("active");

        const label = document.createElement("label");
        label.setAttribute("for", id);
        label.innerHTML = labelText;
        questionDiv.appendChild(label);

        let inputElement;
        if (type === "skala") {
          inputElement = document.createElement("input");
          inputElement.setAttribute("type", "range");
          inputElement.setAttribute("min", "1");
          inputElement.setAttribute("max", "5");
        } else if (type === "tekst") {
          inputElement = document.createElement("textarea");
        } else if (type === "Likert") {
          inputElement = document.createElement("div");
          for (let i = 1; i <= 6; i++) {
            const radioLabel = document.createElement("label");
            radioLabel.textContent = `${i}`;
            const radio = document.createElement("input");
            radio.setAttribute("type", "radio");
            radio.setAttribute("name", id);
            radio.setAttribute("value", i);
            radioLabel.appendChild(radio);
            inputElement.appendChild(radioLabel);
          }
        } else {
          inputElement = document.createElement("input");
          inputElement.setAttribute("type", "text");
        }

        inputElement.setAttribute("id", id);
        inputElement.setAttribute("name", id);
        questionDiv.appendChild(inputElement);
        fieldset.appendChild(questionDiv);
        questionContainers.push(questionDiv);
      });

      // Navigation buttons
      const buttonContainer = document.createElement("div");
      buttonContainer.classList.add("buttons");

      const prevBtn = document.createElement("button");
      prevBtn.setAttribute("type", "button");
      prevBtn.textContent = "Tilbage";
      prevBtn.style.display = "none";

      const nextBtn = document.createElement("button");
      nextBtn.setAttribute("type", "button");
      nextBtn.textContent = "Næste";

      const submitButton = document.createElement("button");
      submitButton.setAttribute("type", "submit");
      submitButton.textContent = "Send";
      submitButton.style.display = "none";

      buttonContainer.appendChild(prevBtn);
      buttonContainer.appendChild(nextBtn);
      buttonContainer.appendChild(submitButton);
      fieldset.appendChild(buttonContainer);
      form.appendChild(fieldset);
      document.body.appendChild(form);

      let currentIndex = 0;

      function showQuestion(index) {
        questionContainers.forEach((q, i) => {
          q.classList.toggle("active", i === index);
        });

        prevBtn.style.display = index === 0 ? "none" : "inline-block";

        if (index === questionContainers.length - 1) {
          nextBtn.style.display = "none";
          checkAllQuestionsAnswered();
        } else {
          nextBtn.style.display = "inline-block";
          submitButton.style.display = "none";
        }
      }

      function checkAllQuestionsAnswered() {
        const allAnswered = questionContainers.every((q) => {
          const input = q.querySelector("input, textarea");
          if (!input) return false;
          if (input.type === "radio") {
            return q.querySelector("input:checked") !== null;
          }
          return input.value.trim() !== "";
        });
        submitButton.style.display = allAnswered ? "inline-block" : "none";
      }

      nextBtn.addEventListener("click", () => {
        if (currentIndex < questionContainers.length - 1) {
          currentIndex++;
          showQuestion(currentIndex);
        }
      });

      prevBtn.addEventListener("click", () => {
        if (currentIndex > 0) {
          currentIndex--;
          showQuestion(currentIndex);
        }
      });

      questionContainers.forEach((q) => {
        q.addEventListener("input", checkAllQuestionsAnswered);
      });

      // Attach submitSurvey to submit button
      submitButton.addEventListener("click", submitSurvey);

      showQuestion(currentIndex);
    })
    .catch((error) => console.error("Error loading XML:", error));
}

// Shuffle function to randomize the order of questions
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
}

async function submitUser(event) {
  event.preventDefault(); // Prevent standard GET request
  console.log("Submitting user data...");
  const runNr = getPersistentId();
  const userData = {
    runNr: runNr,
    alder: document.getElementById("alder").value,
    køn: document.getElementById("køn").value,
    uddannelse: document.getElementById("uddannelse").value,
    beskæftigelse: document.getElementById("beskæftigelse").value,
  };
  console.log("User data:", userData);

  try {
    const response = await fetch("http://localhost:3000/submitUser", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      // Håndter redirect ved at følge serverens anvisning
      nextPage();
    } else {
      console.error("Error: Server responded with status", response.status);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

async function submitSurvey(event) {
  event.preventDefault(); // Forhindrer standard formular-submission

  const runNr = getPersistentId();
  const page = window.location.pathname.split("/").pop();

  const answers = {};
  document.querySelectorAll("input, textarea, select").forEach((input) => {
    if (input.type === "radio") {
      if (input.checked) {
        answers[input.name] = input.value;
      }
    } else {
      answers[input.name] = input.value;
    }
  });

  try {
    const response = await fetch("http://localhost:3000/submitAnswer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runNr, page, answers }),
    });

    if (response.ok) {
      const data = await response.json();
      nextPage();
    } else {
      console.error("❌ Fejl: Server svarede med status", response.status);
    }
  } catch (error) {
    console.error("❌ Netværksfejl:", error.message);
  }
}

function nextPage() {
  let pagesArr = [
    "page1.html",
    "page2.html",
    "page3.html",
    "page4.html",
    "page5.html",
  ];
  let visitedPages = JSON.parse(localStorage.getItem("visitedPages")) || [];

  let unvisitedPages = pagesArr.filter((page) => !visitedPages.includes(page));
  if (!unvisitedPages.length) {
    window.location.href = "thanks.html";
  } else {
    let randomPage =
      unvisitedPages[Math.floor(Math.random() * unvisitedPages.length)];
    visitedPages.push(randomPage);
    localStorage.setItem("visitedPages", JSON.stringify(visitedPages));

    window.location.href = randomPage; // Ingen runNr i URL!
  }
}
