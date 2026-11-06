const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const db = require("./db");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", async (_req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ ok: true, message: "Connected to MySQL database" });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Database connection failed", detail: err.message });
  }
});

// Demo login. Create users with the SQL in database.sql; passwords are stored as bcrypt hashes.
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Enter username and password" });
    const [rows] = await db.query("SELECT user_id, username, password_hash, role, resident_id FROM users WHERE username = ?", [username]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ message: "Invalid login details" });
    }
    const { password_hash, ...user } = rows[0];
    res.json({ message: "Login successful", user });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/residents", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT resident_id, name, flat_no, phone, email FROM residents ORDER BY resident_id DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/residents", async (req, res) => {
  try {
    const { name, flat_no, phone, email } = req.body;
    if (!name || !flat_no || !phone) return res.status(400).json({ message: "Name, flat number and phone are required" });
    const [result] = await db.query("INSERT INTO residents (name, flat_no, phone, email) VALUES (?, ?, ?, ?)", [name, flat_no, phone, email || null]);
    res.status(201).json({ resident_id: result.insertId, message: "Resident added" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});


app.put("/api/residents/:id", async (req, res) => {
  try {
    const { name, flat_no, phone, email } = req.body;
    if (!name || !flat_no || !phone) return res.status(400).json({ message: "Name, flat number and phone are required" });
    const [result] = await db.query(
      "UPDATE residents SET name=?, flat_no=?, phone=?, email=? WHERE resident_id=?",
      [name, flat_no, phone, email || null, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Resident not found" });
    res.json({ message: "Resident updated" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete("/api/residents/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM residents WHERE resident_id=?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Resident not found" });
    res.json({ message: "Resident deleted" });
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2") return res.status(409).json({ message: "This resident has visit records. Delete those visit records first." });
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/visitors", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM visitors ORDER BY visitor_id DESC");
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/visitors", async (req, res) => {
  try {
    const { name, phone, vehicle_no, purpose } = req.body;
    if (!name || !phone || !purpose) return res.status(400).json({ message: "Name, phone and purpose are required" });
    const [result] = await db.query("INSERT INTO visitors (name, phone, vehicle_no, purpose) VALUES (?, ?, ?, ?)", [name, phone, vehicle_no || null, purpose]);
    res.status(201).json({ visitor_id: result.insertId, message: "Visitor registered" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});


app.put("/api/visitors/:id", async (req, res) => {
  try {
    const { name, phone, vehicle_no, purpose } = req.body;
    if (!name || !phone || !purpose) return res.status(400).json({ message: "Name, phone and purpose are required" });
    const [result] = await db.query(
      "UPDATE visitors SET name=?, phone=?, vehicle_no=?, purpose=? WHERE visitor_id=?",
      [name, phone, vehicle_no || null, purpose, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Visitor not found" });
    res.json({ message: "Visitor updated" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete("/api/visitors/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM visitors WHERE visitor_id=?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Visitor not found" });
    res.json({ message: "Visitor deleted" });
  } catch (err) {
    if (err.code === "ER_ROW_IS_REFERENCED_2") return res.status(409).json({ message: "This visitor has visit records. Delete those visit records first." });
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/visits", async (_req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT v.visit_id, r.name AS resident_name, r.flat_no, x.name AS visitor_name,
             x.phone, x.purpose, v.entry_time, v.exit_time, v.status
      FROM visits v JOIN residents r ON r.resident_id = v.resident_id
      JOIN visitors x ON x.visitor_id = v.visitor_id
      ORDER BY v.visit_id DESC`);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post("/api/visits", async (req, res) => {
  try {
    const { resident_id, visitor_id } = req.body;
    if (!resident_id || !visitor_id) return res.status(400).json({ message: "Select resident and visitor" });
    const [result] = await db.query(
      "INSERT INTO visits (resident_id, visitor_id, entry_time, status) VALUES (?, ?, NOW(), 'Checked In')",
      [resident_id, visitor_id]
    );
    res.status(201).json({ visit_id: result.insertId, message: "Visitor checked in" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});


app.put("/api/visits/:id", async (req, res) => {
  try {
    const { status, resident_id, visitor_id } = req.body;
    const allowed = ["Pending", "Approved", "Rejected", "Checked In", "Checked Out"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid visit status" });
    const exitTime = status === "Checked Out" ? new Date() : null;
    const [result] = await db.query(
      "UPDATE visits SET status=?, resident_id=COALESCE(?, resident_id), visitor_id=COALESCE(?, visitor_id), exit_time=? WHERE visit_id=?",
      [status, resident_id || null, visitor_id || null, exitTime, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Visit not found" });
    res.json({ message: "Visit updated" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete("/api/visits/:id", async (req, res) => {
  try {
    const [result] = await db.query("DELETE FROM visits WHERE visit_id=?", [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ message: "Visit not found" });
    res.json({ message: "Visit deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.put("/api/visits/:id/checkout", async (req, res) => {
  try {
    const [result] = await db.query(
      "UPDATE visits SET exit_time = NOW(), status = 'Checked Out' WHERE visit_id = ? AND exit_time IS NULL",
      [req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Active visit not found" });
    res.json({ message: "Visitor checked out" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("/api/dashboard", async (_req, res) => {
  try {
    const [[{ residents }]] = await db.query("SELECT COUNT(*) AS residents FROM residents");
    const [[{ visitors }]] = await db.query("SELECT COUNT(*) AS visitors FROM visitors");
    const [[{ inside }]] = await db.query("SELECT COUNT(*) AS inside FROM visits WHERE exit_time IS NULL");
    const [[{ today }]] = await db.query("SELECT COUNT(*) AS today FROM visits WHERE DATE(entry_time) = CURDATE()");
    res.json({ residents, visitors, inside, today });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Pallavi Apartment app running at http://localhost:${port}`));
