require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();
const adminRoutes = require("./admin/adminRoutes"); // Importér admin routes

// Opsætning af Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/admin", adminRoutes);

// Default routing til index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Håndter side-navigation og valider runNr op imod der findes en .json med samme navn
app.post("/validateRunNr", (req, res) => {
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
        console.warn(
          `⚠️ runNr ${runNr} eksisterer ikke - opretter ny JSON-fil.`
        );
        const newUserData = {
          demografi: {
            alder: null,
            køn: null,
            uddannelse: null,
            beskæftigelse: null,
          },
          undersøgelser: {},
        };

        fs.writeFile(
          jsonFilePath,
          JSON.stringify(newUserData, null, 2),
          (writeErr) => {
            if (writeErr) {
              console.error("❌ Fejl ved oprettelse af JSON-fil:", writeErr);
              return res
                .status(500)
                .json({ error: "Fejl ved oprettelse af brugerfil." });
            }
            console.log(`Brugerfil oprettet: ${jsonFilePath}`);
            return res.json({ message: "Ny bruger oprettet", runNr: runNr });
          }
        );
      } else {
        console.log(`${runNr} tilgik ${page}`);
        res.json({ message: "Valid runNr" });
      }
    });
  });
});

// Brugerens demografi data tilføjes skrives til en .json fil navngivet med runNr
app.post("/submitUser", (req, res) => {
  console.log("Demografi data modtaget:", req.body);

  if (
    !req.body.alder ||
    !req.body.køn ||
    !req.body.uddannelse ||
    !req.body.beskæftigelse
  ) {
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
      console.log("Demografi data skrevet til:", jsonFilePath);
    });
  });

  res.json({ message: "Du er nu logget ind" });
});

// Brugeren besvarelse skrives til .json fil navngivet med runNr
app.post("/submitAnswer", (req, res) => {
  const { runNr, page, answers } = req.body;

  if (!runNr || !page || !answers) {
    return res.status(400).json({ error: "Missing required data" });
  }

  const jsonFilePath = path.join(__dirname, "users", `${runNr}.json`);
  const backupFilePath = path.join(__dirname, "users", `${runNr}.bak`);

  fs.access(jsonFilePath, fs.constants.F_OK, (err) => {
    if (!err) {
      fs.rename(jsonFilePath, backupFilePath, (renameErr) => {
        if (renameErr) {
          console.error("❌ Error creating backup file:", renameErr);
          return res.status(500).json({ error: "Error creating backup file." });
        }

        updateUserData()
          .then(() => {
            fs.unlink(backupFilePath, (unlinkErr) => {
              if (unlinkErr)
                console.warn("⚠️ Could not delete backup file:", unlinkErr);
            });

            res.json({ message: "Survey data saved!", next: "/nextPage.html" });
          })
          .catch((error) => {
            console.error("❌ Error updating data:", error);
            res.status(500).json({ error: "Error saving survey data." });
          });
      });
    } else {
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

  // Funktion der laver en ny fil, som skrives med opdateret data
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

      fs.writeFile(
        jsonFilePath,
        JSON.stringify(userData, null, 2),
        (writeErr) => {
          if (writeErr) {
            console.error("❌ Error updating file:", writeErr);
            reject(writeErr);
          } else {
            console.log(`✅ Survey data for ${page} saved successfully.`);
            resolve();
          }
        }
      );
    });
  }
});

app.listen(3000, () => {
  console.log("Server kører på http://localhost:3000");
  console.log("Admin login på http://localhost:3000/login.html");
});
