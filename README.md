# Library Management System

A simple library management web app built with Node.js and Express. This repository contains the server code, front-end pages (HTML/CSS), and SQL queries used to create the library database.

## Contents
- `server.js` - Node/Express server
- `public/` - Static front-end pages (add/search/borrow books, login, register)
- `library_queries.sql` - SQL queries for creating the database/tables
- `package.json` - Node dependencies and scripts

## Requirements
- Node.js (v14+ recommended)
- npm (comes with Node.js)

## Quick start
1. Install dependencies

```powershell
npm install
```

2. Create the database using the queries in `library_queries.sql` (run on your MySQL/Postgres as appropriate).

3. Start the server

```powershell
node server.js
```

4. Open a browser and navigate to:

- http://localhost:3000/ (or the port configured in `server.js`)

## Notes
- `node_modules/` is ignored via `.gitignore` to avoid committing dependencies.
- If you plan to deploy, create a `.env` file for any sensitive configuration (DB credentials, ports) and ensure it's in `.gitignore`.

## Contributing
Feel free to open issues or submit pull requests. For substantial changes, open an issue first to discuss the design.

## License
This project is provided as-is. Add a license if you wish to make the terms explicit.

---
Created and pushed via an automated helper.
# Library_Management_System