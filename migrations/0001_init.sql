PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_name TEXT NOT NULL,
  duration_months INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enrollment_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  dob DATE,
  address TEXT,
  enrollment_date DATE NOT NULL,
  course_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  issue_date DATE,
  certificate_number TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  project_name TEXT NOT NULL,
  description TEXT,
  technologies TEXT,
  completion_date DATE,
  image_path TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS institute_info (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  institute_name TEXT DEFAULT 'Samriddho Computer Education',
  phone TEXT DEFAULT '+919874635598',
  email TEXT DEFAULT 'mithu9874635598@gmail.com',
  whatsapp TEXT DEFAULT 'http://wa.me/919874635598',
  teacher_name TEXT DEFAULT 'Mithu Karmakar',
  teacher_image TEXT DEFAULT 'maa.jpeg',
  address TEXT DEFAULT 'Samriddho Computer Education, Kolkata',
  latitude REAL DEFAULT 22.595896,
  longitude REAL DEFAULT 88.431042,
  approved_tag TEXT DEFAULT 'Indian government approved computer training center',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO institute_info (id) VALUES (1);

INSERT OR IGNORE INTO courses (id, course_name, duration_months, description) VALUES
  (1, 'Web Development Fundamentals', 3, 'Learn HTML, CSS, JavaScript and responsive web design'),
  (2, 'Advanced JavaScript & React', 4, 'Master JavaScript ES6+ and React framework'),
  (3, 'Full Stack Web Development', 6, 'Complete full stack development with Node.js and React'),
  (4, 'Python Programming', 3, 'Python basics to advanced programming concepts'),
  (5, 'Database Management with SQL', 2, 'SQL and database design fundamentals');

INSERT OR IGNORE INTO students (enrollment_id, first_name, last_name, email, phone, dob, address, enrollment_date, course_id, status) VALUES
  ('SCE001', 'Raj', 'Kumar', 'raj.kumar@example.com', '9876543210', '2005-03-15', '123 Main Street, Delhi', '2024-01-15', 1, 'active'),
  ('SCE002', 'Priya', 'Singh', 'priya.singh@example.com', '9876543211', '2004-07-22', '456 Oak Avenue, Mumbai', '2024-02-01', 2, 'active'),
  ('SCE003', 'Arjun', 'Patel', 'arjun.patel@example.com', '9876543212', '2005-11-10', '789 Pine Road, Bangalore', '2024-01-20', 3, 'active'),
  ('SCE004', 'Isha', 'Sharma', 'isha.sharma@example.com', '9876543213', '2004-05-05', '321 Elm Street, Pune', '2024-03-01', 1, 'active'),
  ('SCE005', 'Rohan', 'Gupta', 'rohan.gupta@example.com', '9876543214', '2005-09-12', '654 Maple Drive, Hyderabad', '2024-02-15', 4, 'active');

INSERT OR IGNORE INTO certificates (student_id, course_id, issue_date, certificate_number, status) VALUES
  (1, 1, '2024-04-15', 'CERT-SCE-001-2024', 'earned'),
  (2, 2, '2024-05-20', 'CERT-SCE-002-2024', 'earned'),
  (3, 3, '2024-06-01', 'CERT-SCE-003-2024', 'pending'),
  (4, 1, '2024-04-30', 'CERT-SCE-004-2024', 'earned'),
  (5, 4, NULL, 'CERT-SCE-005-2024', 'pending');

INSERT OR IGNORE INTO projects (student_id, project_name, description, technologies, completion_date) VALUES
  (1, 'Personal Portfolio Website', 'A responsive portfolio website showcasing projects and skills', 'HTML, CSS, JavaScript', '2024-03-20'),
  (2, 'E-commerce Product Listing', 'Dynamic product listing page with filters and search', 'React, JavaScript, CSS', '2024-04-10'),
  (3, 'Task Management Application', 'Full-stack todo application with user authentication', 'React, Node.js, Express, MongoDB', '2024-05-15'),
  (4, 'Weather App', 'Real-time weather information using API', 'HTML, CSS, JavaScript, API', '2024-03-30'),
  (1, 'Blog Platform', 'Multi-user blogging platform with admin panel', 'Node.js, Express, SQLite', '2024-05-01');
