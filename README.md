# Pallavi Apartment Visitor Management System

## Technology
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Database: MySQL (`db.js` uses `mysql2`)
- Database GUI: MySQL Workbench

> Important: A browser must not connect directly to MySQL Workbench/MySQL. The browser calls the Node.js API; `db.js` connects the Node.js server to the MySQL Server that you manage using Workbench.

## Setup
1. Install Node.js and MySQL Server. Open MySQL Workbench and connect to your local MySQL Server.
2. In Workbench, open `database.sql` and click the lightning icon to execute it.
3. Copy `.env.example` to a new file named `.env`.
4. Edit `.env` and enter your MySQL username/password. Keep `DB_HOST=localhost` and `DB_PORT=3306` if using the default local setup.
5. Open a terminal in this project folder and run:
   ```bash
   npm install
   npm start
   ```
6. Open `http://localhost:3000` in your browser.
7. Check database connection at `http://localhost:3000/api/health`.

## Login API
The login endpoint is implemented and checks bcrypt hashes in the `users` table. For a production deployment, add sessions/JWT, role-based authorization, HTTPS, validation, and audit logging. The current UI is a project demo dashboard and does not enforce login before opening pages.

## Included functions
- Dashboard counts
- Add and list residents
- Register and list visitors
- Check in visitors
- Check out visitors
- View visit history
- MySQL health check

## Troubleshooting
- `Access denied`: verify DB_USER and DB_PASSWORD in `.env`.
- `Unknown database`: run `database.sql` in Workbench.
- `ECONNREFUSED`: ensure MySQL Server service is running and DB_PORT is correct.


## CRUD operations added
- Residents: Create, view, edit and delete.
- Visitors: Create, view, edit and delete.
- Visits: Create/check-in, view, edit status, check-out and delete.
- Delete is blocked by MySQL foreign-key relationships when a resident or visitor is already referenced by visit records. Delete the related visit records first if you really need to remove that parent record.
- Edit buttons use simple browser prompt dialogs for this student-project version.
