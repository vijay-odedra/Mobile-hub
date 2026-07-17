# Mobile-hub

MobileHub is a Node.js + Express + SQLite retail management dashboard for products, billing, repairs, staff, and attendance operations.

## Project Overview

This project uses:

- Node.js
- Express.js
- SQLite database
- Static frontend served from the `public/` folder

The server automatically creates the SQLite database file named `mobilehub.db` in the project root and initializes the required tables when it starts.

## Prerequisites

Before running this project, make sure you have the following installed on your system:

- Node.js 18+ recommended
- npm
- SQLite CLI (optional, useful for inspecting the database)

### Verify installations

```bash
node -v
npm -v
sqlite3 --version
```

## Installation

1. Open a terminal in the project folder:

```bash
cd /opt/lampp/htdocs/Mobile-hub
```

2. Install dependencies:

```bash
npm install
```

If you are using a fresh environment and `npm install` shows missing packages, run:

```bash
npm cache clean --force
npm install
```

## Run the Project

### Start the server

```bash
npm start
```

### Start in development mode

```bash
npm run dev
```

### Start the server manually

```bash
node server.js
```

Once the server is running, open:

```text
http://localhost:3002
```

## Database Setup and Behavior

This app uses SQLite, not MySQL or PostgreSQL.

### Automatic database creation

When the server starts, it automatically:

- creates the SQLite file `mobilehub.db` if it does not already exist
- creates the required tables
- inserts sample product, staff, and repair data if the database is empty

### Database file location

The database is stored in the project root:

```text
/opt/lampp/htdocs/Mobile-hub/mobilehub.db
```

### Tables created automatically

The app creates these tables:

- `products`
- `bills`
- `bill_items`
- `repairs`
- `staff`
- `attendance_records`
- `deleted_bills`
- `deleted_bill_items`

## Inspect the SQLite Database

If SQLite CLI is installed, you can inspect the database with:

```bash
cd /opt/lampp/htdocs/Mobile-hub
sqlite3 mobilehub.db ".tables"
```

View data from a table:

```bash
sqlite3 mobilehub.db "SELECT * FROM products;"
```

You can also open the database using a GUI tool such as DB Browser for SQLite.

## Useful Commands

### Install dependencies

```bash
npm install
```

### Run the app

```bash
npm start
```

### Run development mode

```bash
npm run dev
```

### Stop the running server

If you are running the server in a terminal, press:

```text
Ctrl + C
```

### Reinstall dependencies cleanly

```bash
rm -rf node_modules package-lock.json
npm install
```

## Project Structure

```text
Mobile-hub/
├── public/
├── server.js
├── package.json
├── mobilehub.db
└── README.md
```

## Troubleshooting

### Port already in use

If `http://localhost:3002` is not available, check whether another process is using the port:

```bash
lsof -i :3002
```

If needed, stop the process and restart the server.

### Database connection error

If SQLite fails to connect:

1. confirm the project folder has write permission
2. check whether `mobilehub.db` is locked by another process
3. restart the server

### Missing dependency error

Run:

```bash
npm install
```

## Notes

- The frontend is served from the `public/` folder.
- The backend API is handled in `server.js`.
- The SQLite database file is created automatically and does not require a separate database server setup.

## Production/Local Deployment Summary

For local development:

```bash
cd /opt/lampp/htdocs/Mobile-hub
npm install
npm start
```

Then visit:

```text
http://localhost:3002
```
