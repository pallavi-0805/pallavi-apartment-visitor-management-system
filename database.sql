CREATE DATABASE IF NOT EXISTS apartment_visitor_management;
USE apartment_visitor_management;

CREATE TABLE IF NOT EXISTS residents (
  resident_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  flat_no VARCHAR(20) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  email VARCHAR(100) UNIQUE
);

CREATE TABLE IF NOT EXISTS visitors (
  visitor_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  vehicle_no VARCHAR(30),
  purpose VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS visits (
  visit_id INT AUTO_INCREMENT PRIMARY KEY,
  resident_id INT NOT NULL,
  visitor_id INT NOT NULL,
  entry_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  exit_time DATETIME NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Checked In',
  CONSTRAINT fk_visit_resident FOREIGN KEY (resident_id) REFERENCES residents(resident_id),
  CONSTRAINT fk_visit_visitor FOREIGN KEY (visitor_id) REFERENCES visitors(visitor_id)
);

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Admin','Security','Resident') NOT NULL,
  resident_id INT NULL,
  CONSTRAINT fk_user_resident FOREIGN KEY (resident_id) REFERENCES residents(resident_id)
);

-- Optional demo records (no demo login user is inserted; create a bcrypt password hash through Node.js).
INSERT IGNORE INTO residents (resident_id, name, flat_no, phone, email) VALUES
(1, 'Ananya Rao', 'A-101', '9876543210', 'ananya@example.com'),
(2, 'Rahul Kumar', 'B-204', '9876501234', 'rahul@example.com');

INSERT IGNORE INTO visitors (visitor_id, name, phone, vehicle_no, purpose) VALUES
(1, 'Kiran', '9000011111', 'AP 21 AB 1234', 'Delivery'),
(2, 'Meena', '9000022222', NULL, 'Meeting resident');
