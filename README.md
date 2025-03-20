# Survey Data Collection Node.js Application

This project is a simple Node.js application built with Express.js to collect and manage survey data. It allows users to submit responses to a survey, and it stores these responses in individual JSON files. The admin panel provides a way to manage, view, and back up user data. It also includes a feature to upload XML files for data import and export.

## Running the Project

To run the project, follow these steps:

1. Run `cd data` to navigate to the project folder.
2. Install dependencies by running: `npm install`.
3. Start the server using: `node server.js`.
4. Access the app in your browser at [http://localhost:3000](http://localhost:3000).

## To Access Admin Dashboard

1. Create a `.env` file in the project directory.
2. Insert the following environment variables (note that storing sensitive information like this in a public repo is not recommended):
   ```bash
   SECRET_KEY=my_secret_key
   ```
3. Access the dashboard from login.html - use the following credentials: admin as username, adminpassword as password.
