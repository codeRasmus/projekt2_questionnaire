const express = require("express");
const path = require("path"); // Import path module for better path handling
const fs = require("fs");
const app = express();

// Serve static files from the 'public' directory

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  console.log("We are running");
});

app.post("/submitUser", (req, res) => {
  const { alder, køn, uddannelse, beskæftigelse } = req.body;
  console.log(
    "Post registered. User provided the following data:",
    "Alder:",
    alder,
    "Køn:",
    køn,
    "Uddannelse:",
    uddannelse,
    "Beskæftigelse:",
    beskæftigelse
  );

  // Create the data object in the structure you want to save
  const userData = {
    demografi: {
      alder: alder,
      køn: køn,
      uddannelse: uddannelse,
      beskæftigelse: beskæftigelse,
    },
  };

  // Create a unique filename for the user (e.g., using a timestamp or any unique identifier)
  const userId = Date.now(); // Using the current timestamp as a unique ID
  const jsonFilePath = path.join(__dirname, "users", `${userId}.json`);

  // Ensure the 'users' directory exists, create it if not
  fs.mkdir(path.join(__dirname, "users"), { recursive: true }, (err) => {
    if (err) {
      console.error("Error creating users directory:", err);
      return res.status(500).send("Error creating user directory.");
    }

    // Write the user data to a JSON file
    fs.writeFile(jsonFilePath, JSON.stringify(userData, null, 2), (err) => {
      if (err) {
        console.error("Error writing to file:", err);
        return res.status(500).send("Error saving user data.");
      }
      console.log("User data saved successfully to:", jsonFilePath);
    });
  });

  // Redirect to the page1.html
  res.sendFile(path.join(__dirname, "public", "page1.html"));
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
