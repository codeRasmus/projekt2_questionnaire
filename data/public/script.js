document.addEventListener("DOMContentLoaded", () => {
  if (
    window.location.pathname.endsWith("index.html") ||
    window.location.pathname === "/"
  ) {
    // Indsæt Demografi form
    insertDemografiFormFromXML();
  } else {
    // On other pages, insert the Undersøgelse form
    insertUndersøgelseForm();
  }
});

// Insert Demografi form
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
      // form.setAttribute("action", "../submitUser");
      // form.setAttribute("method", "post");

      // Create fieldset for Demografi
      const fieldset = document.createElement("fieldset");
      const legend = document.createElement("legend");
      legend.textContent = "Demografi";
      fieldset.appendChild(legend);

      // Process questions in the first group
      group.querySelectorAll("spørgsmål").forEach((question) => {
        const idElement = question.querySelector("id");
        const typeElement = question.querySelector("type");
        const labelTextElement = question.querySelector("tekst");

        if (!idElement || !typeElement || !labelTextElement) return;

        const id = idElement.textContent;
        const type = typeElement.textContent;
        const labelText = labelTextElement.textContent;

        // Create label
        const label = document.createElement("label");
        label.setAttribute("for", id);
        label.textContent = labelText;
        fieldset.appendChild(label);

        // Create input field based on question type
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
        }

        fieldset.appendChild(inputElement);
        fieldset.appendChild(document.createElement("br"));
      });

      // Submit button
      const submitButton = document.createElement("button");
      // submitButton.setAttribute("type", "submit");
      submitButton.textContent = "Send";
      fieldset.appendChild(submitButton);

      // Append everything to the form and then to the body
      form.appendChild(fieldset);
      document.body.appendChild(form);
      submitButton.addEventListener("click", submitUser);
    })
    .catch((error) => console.error("Error loading XML:", error));
}

// Insert Undersøgelse form
function insertUndersøgelseForm() {
  fetch("spørgeskema.xml")
    .then((response) => response.text())
    .then((xmlText) => {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      // Select the second spørgesmålsgruppe (Undersøgelse)
      const group = xmlDoc.querySelectorAll("spørgsmålsgruppe")[1]; // Get the second group
      console.log(xmlDoc.querySelectorAll("spørgsmålsgruppe"));
      console.log(group);
      if (!group) return;

      // Create form
      const form = document.createElement("form");
      form.setAttribute("action", "../submitAnswer");
      form.setAttribute("method", "post");

      const fieldset = document.createElement("fieldset");

      // Legend for the form
      const legend = document.createElement("legend");
      legend.textContent = "Undersøgelse";
      fieldset.appendChild(legend);

      // Get all questions in the second group
      const questions = Array.from(group.querySelectorAll("spørgsmål"));

      // Shuffle the questions array
      shuffleArray(questions);

      // Process shuffled questions
      questions.forEach((question) => {
        const idElement = question.querySelector("id");
        const typeElement = question.querySelector("type");
        const labelTextElement = question.querySelector("tekst");

        if (!idElement || !typeElement || !labelTextElement) {
          console.warn("Missing element in question, skipping...");
          return;
        }

        const id = idElement.textContent;
        console.log(id);
        const type = typeElement.textContent;
        console.log(type);
        const labelText = labelTextElement.textContent;
        console.log(labelText);

        // Create label
        const label = document.createElement("label");
        label.setAttribute("for", id);
        label.textContent = labelText;
        console.log(label);
        fieldset.appendChild(label);

        // Create input element based on type
        let inputElement;
        if (type === "integer") {
          inputElement = document.createElement("input");
          inputElement.setAttribute("type", "number");
        } else if (type === "skala") {
          inputElement = document.createElement("input");
          inputElement.setAttribute("type", "range");
          inputElement.setAttribute("min", "1");
          inputElement.setAttribute("max", "5");
        } else if (type === "tekst") {
          inputElement = document.createElement("textarea");
        } else if (type === "dropdown") {
          inputElement = document.createElement("select");
          question.querySelectorAll("option").forEach((option) => {
            const optionElement = document.createElement("option");
            optionElement.setAttribute("value", option.textContent);
            optionElement.textContent = option.textContent;
            inputElement.appendChild(optionElement);
          });
        } else if (type === "Likert") {
          inputElement = document.createElement("div");
          for (let i = 1; i <= 5; i++) {
            const label = document.createElement("label");
            label.textContent = `${i}`;
            const radio = document.createElement("input");
            radio.setAttribute("type", "radio");
            radio.setAttribute("name", id);
            radio.setAttribute("value", i);
            label.appendChild(radio);
            inputElement.appendChild(label);
          }
        }

        inputElement.setAttribute("id", id);
        inputElement.setAttribute("name", id);
        fieldset.appendChild(inputElement);
        fieldset.appendChild(document.createElement("br"));
      });

      // Submit button
      const submitButton = document.createElement("button");
      submitButton.setAttribute("type", "submit");
      submitButton.textContent = "Send";
      fieldset.appendChild(submitButton);

      // Append form to the body
      form.appendChild(fieldset);
      document.body.appendChild(form);
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
function getPersistentId() {
  let runNr = localStorage.getItem("runNr");
  if (!runNr) {
    runNr = crypto.randomUUID();
    localStorage.setItem("runNr", runNr);
  }
  return runNr;
}

async function submitUser(event) {
  event.preventDefault(); // Prevent standard GET request
  console.log("Submitting user data...");
  const userData = {
    alder: document.getElementById("alder").value,
    køn: document.getElementById("køn").value,
    uddannelse: document.getElementById("uddannelse").value,
    beskæftigelse: document.getElementById("beskæftigelse").value,
    runNr: getPersistentId(),
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
      window.location.href = "page1.html";
    } else {
      console.error("Error: Server responded with status", response.status);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}
