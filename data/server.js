const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const crypto = require("crypto");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  console.log("We are running");
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Håndter side-navigation og valider `runNr`
app.post("/validateRunNr", (req, res) => {
  console.log("✅ Modtaget data fra klient:", req.body);

  const { runNr, page } = req.body;

  if (!runNr) {
    console.error("❌ Fejl: runNr mangler");
    return res.status(400).json({ error: "runNr mangler" });
  }

  const jsonFilePath = path.join(__dirname, "users", `${runNr}.json`);

  // Opret mappen, hvis den ikke findes
  fs.mkdir(path.join(__dirname, "users"), { recursive: true }, (mkdirErr) => {
    if (mkdirErr) {
      console.error("❌ Fejl ved oprettelse af mappe:", mkdirErr);
      return res.status(500).json({ error: "Fejl ved oprettelse af mappe." });
    }

    // Tjek om filen allerede findes
    fs.access(jsonFilePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.warn(`⚠️ runNr ${runNr} eksisterer ikke - opretter ny JSON-fil.`);
        const newUserData = {
          demografi: {
            alder: null,
            køn: null,
            uddannelse: null,
            beskæftigelse: null
          },
          undersøgelser: {}
        };

        fs.writeFile(jsonFilePath, JSON.stringify(newUserData, null, 2), (writeErr) => {
          if (writeErr) {
            console.error("❌ Fejl ved oprettelse af JSON-fil:", writeErr);
            return res.status(500).json({ error: "Fejl ved oprettelse af brugerfil." });
          }
          console.log(`✅ Ny brugerfil oprettet: ${jsonFilePath}`);
          return res.json({ message: "Ny bruger oprettet", runNr: runNr });
        });
      } else {
        console.log(`✅ Bruger ${runNr} tilgik ${page}`);
        res.json({ message: "Valid runNr" });
      }
    });
  });
});

app.get("/:page", (req, res) => {
  const { page } = req.params;
  res.sendFile(path.join(__dirname, "public", page));
});

app.post("/submitUser", (req, res) => {
  console.log("Modtaget POST-request fra klienten:", req.body);

  if (!req.body.alder || !req.body.køn || !req.body.uddannelse || !req.body.beskæftigelse) {
    return res.status(400).json({ error: "Manglende data i request body" });
  }

  const userData = {
    demografi: {
      alder: req.body.alder,
      køn: req.body.køn,
      uddannelse: req.body.uddannelse,
      beskæftigelse: req.body.beskæftigelse,
    },
    undersøgelser: {},
  };

  const jsonFilePath = path.join(__dirname, "users", `${req.body.runNr}.json`);

  fs.mkdir(path.join(__dirname, "users"), { recursive: true }, (err) => {
    if (err) {
      console.error("Error creating users directory:", err);
      return res.status(500).send("Error creating user directory.");
    }

    fs.writeFile(jsonFilePath, JSON.stringify(userData, null, 2), (err) => {
      if (err) {
        console.error("Error writing to file:", err);
        return res.status(500).json({ error: "Error saving user data." });
      }
      console.log("User data saved successfully:", jsonFilePath);
    });
  });

  res.redirect(`/page1.html?runNr=${req.body.runNr}`);
});

app.post("/submitAnswer", (req, res) => {
  console.log("📥 Received data:", req.body); // Debugging - Se hvad der kommer ind

  const { runNr, page, answers } = req.body;

  if (!runNr || !page || !answers) {
    return res.status(400).json({ error: "Missing required data" });
  }

  const jsonFilePath = path.join(__dirname, "users", `${runNr}.json`);
  const backupFilePath = path.join(__dirname, "users", `${runNr}.bak`);

  fs.access(jsonFilePath, fs.constants.F_OK, (err) => {
    if (!err) {
      // 🔹 Filen findes → Lav backup og opdater data
      fs.rename(jsonFilePath, backupFilePath, (renameErr) => {
        if (renameErr) {
          console.error("❌ Error creating backup file:", renameErr);
          return res.status(500).json({ error: "Error creating backup file." });
        }
        console.log(`🔹 Backup created: ${backupFilePath}`);

        updateUserData()
          .then(() => {
            // 🔹 Slet backup-filen EFTER data er gemt
            fs.unlink(backupFilePath, (unlinkErr) => {
              if (unlinkErr) console.warn("⚠️ Could not delete backup file:", unlinkErr);
            });

            res.json({ message: "Survey data saved!", next: "/nextPage.html" });
          })
          .catch((error) => {
            console.error("❌ Error updating data:", error);
            res.status(500).json({ error: "Error saving survey data." });
          });
      });
    } else {
      // 🔹 Filen findes ikke → Opret en ny JSON-fil og gem data direkte
      updateUserData()
        .then(() => {
          res.json({ message: "Survey data saved!", next: "/nextPage.html" });
        })
        .catch((error) => {
          console.error("❌ Error creating new data:", error);
          res.status(500).json({ error: "Error saving survey data." });
        });
    }
  });

  function updateUserData() {
    return new Promise((resolve, reject) => {
      let userData = { demografi: {}, undersøgelser: {} };

      if (fs.existsSync(backupFilePath)) {
        try {
          const backupData = fs.readFileSync(backupFilePath, "utf8");
          userData = JSON.parse(backupData);
        } catch (readErr) {
          console.error("❌ Error reading backup file:", readErr);
        }
      }

      if (!userData.undersøgelser) {
        userData.undersøgelser = {};
      }

      userData.undersøgelser[page] = answers;

      fs.writeFile(jsonFilePath, JSON.stringify(userData, null, 2), (writeErr) => {
        if (writeErr) {
          console.error("❌ Error updating file:", writeErr);
          reject(writeErr);
        } else {
          console.log(`✅ Survey data for ${page} saved successfully.`);
          resolve();
        }
      });
    });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
