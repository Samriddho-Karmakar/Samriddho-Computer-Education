const TEACHER_SECRET = 'sce102';

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...(init.headers || {}),
    },
  });
}

function getSecret(request, body) {
  const url = new URL(request.url);
  return body?.secret || url.searchParams.get('secret') || request.headers.get('x-teacher-secret') || '';
}

function isTeacherRequest(request, body) {
  return getSecret(request, body) === TEACHER_SECRET;
}

async function readBody(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return await request.json();
  }

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    return Object.fromEntries(await request.formData());
  }

  return {};
}

async function queryAll(db, sql, bindings = []) {
  return await db.prepare(sql).bind(...bindings).all();
}

async function queryFirst(db, sql, bindings = []) {
  return await db.prepare(sql).bind(...bindings).first();
}

async function run(db, sql, bindings = []) {
  return await db.prepare(sql).bind(...bindings).run();
}

function defaultInstituteInfo() {
  return {
    institute_name: 'Samriddho Computer Education',
    phone: '+91 98746 35598',
    email: 'contact.sceacademy@gmail.com',
    whatsapp: 'http://wa.me/919874635598',
    teacher_name: 'Mithu Karmakar',
    teacher_image: 'maa.jpeg',
    address: 'Samriddho Computer Education, Kolkata 700102',
    latitude: 22.595896,
    longitude: 88.431042,
    approved_tag: 'Indian Government Approved Computer Training Center',
  };
}

async function getInstituteInfo(db) {
  const info = await queryFirst(db, 'SELECT * FROM institute_info WHERE id = 1');
  return info || defaultInstituteInfo();
}

async function getPublicCourses(db) {
  const result = await queryAll(
    db,
    `SELECT c.*, COUNT(s.id) AS student_count
     FROM courses c
     LEFT JOIN students s ON c.id = s.course_id
     GROUP BY c.id
     ORDER BY c.id DESC`
  );
  return result.results || [];
}

async function getPublicProjects(db, limit = null) {
  const sql = `
    SELECT p.*, s.first_name, s.last_name, s.enrollment_id, c.course_name
    FROM projects p
    JOIN students s ON p.student_id = s.id
    LEFT JOIN courses c ON s.course_id = c.id
    ORDER BY p.completion_date DESC, p.id DESC
    ${limit ? 'LIMIT ?' : ''}
  `;
  const result = limit ? await queryAll(db, sql, [limit]) : await queryAll(db, sql);
  return result.results || [];
}

async function getPublicHomeData(db) {
  const [info, stats, courses, projects] = await Promise.all([
    getInstituteInfo(db),
    queryFirst(
      db,
      `SELECT
         (SELECT COUNT(*) FROM students) AS total_students,
         (SELECT COUNT(*) FROM courses) AS total_courses,
         (SELECT COUNT(*) FROM projects) AS total_projects`
    ),
    queryAll(
      db,
      `SELECT c.*, COUNT(s.id) AS student_count
       FROM courses c
       LEFT JOIN students s ON c.id = s.course_id
       GROUP BY c.id
       ORDER BY c.id DESC
       LIMIT 3`
    ),
    queryAll(
      db,
      `SELECT p.*, s.first_name, s.last_name, c.course_name
       FROM projects p
       JOIN students s ON p.student_id = s.id
       LEFT JOIN courses c ON s.course_id = c.id
       ORDER BY p.completion_date DESC, p.id DESC
       LIMIT 6`
    ),
  ]);

  return {
    info,
    stats: stats || { total_students: 0, total_courses: 0, total_projects: 0 },
    courses: courses.results || [],
    projects: projects.results || [],
  };
}

async function getStudentByEnrollmentId(db, enrollmentId) {
  const student = await queryFirst(
    db,
    `SELECT s.*, c.course_name
     FROM students s
     JOIN courses c ON s.course_id = c.id
     WHERE s.enrollment_id = ?`,
    [enrollmentId]
  );

  if (!student) {
    return null;
  }

  const [certificates, projects] = await Promise.all([
    queryAll(
      db,
      `SELECT ce.*, c.course_name
       FROM certificates ce
       LEFT JOIN courses c ON ce.course_id = c.id
       WHERE ce.student_id = ?
       ORDER BY ce.id DESC`,
      [student.id]
    ),
    queryAll(
      db,
      `SELECT *
       FROM projects
       WHERE student_id = ?
       ORDER BY completion_date DESC, id DESC`,
      [student.id]
    ),
  ]);

  return {
    ...student,
    certificates: certificates.results || [],
    projects: projects.results || [],
  };
}

async function teacherGuard(request, body) {
  if (!isTeacherRequest(request, body)) {
    return json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  const path = url.pathname.replace(/^\/api\/?/, '');
  const db = env.DB;

  if (!db) {
    return json({ success: false, message: 'D1 database binding is missing' }, { status: 500 });
  }

  if (method === 'GET' && (path === 'public/home' || path === 'home')) {
    return json({ success: true, ...(await getPublicHomeData(db)) });
  }

  if (method === 'GET' && (path === 'public/courses' || path === 'courses-public')) {
    return json({ success: true, courses: await getPublicCourses(db) });
  }

  if (method === 'GET' && (path === 'public/projects' || path === 'projects-public')) {
    return json({ success: true, projects: await getPublicProjects(db) });
  }

  if (method === 'GET' && (path === 'institute-info' || path === 'public/institute-info')) {
    return json(await getInstituteInfo(db));
  }

  if (method === 'GET' && path.startsWith('student/')) {
    const enrollmentId = decodeURIComponent(path.slice('student/'.length));
    if (!enrollmentId) {
      return json({ success: false, message: 'Please enter an enrollment ID' }, { status: 400 });
    }

    const student = await getStudentByEnrollmentId(db, enrollmentId);
    if (!student) {
      return json({ success: false, message: 'Student not found with this enrollment ID' }, { status: 404 });
    }

    return json({ success: true, student });
  }

  if (method === 'POST' && path === 'contact') {
    const body = await readBody(request);
    const { name, email, phone = '', message } = body;

    if (!name || !email || !message) {
      return json({ success: false, message: 'Please fill in all required fields' }, { status: 400 });
    }

    const result = await run(
      db,
      'INSERT INTO contact_submissions (name, email, phone, message) VALUES (?, ?, ?, ?)',
      [name, email, phone, message]
    );

    if (!result.success) {
      return json({ success: false, message: 'Error submitting form' }, { status: 500 });
    }

    return json({ success: true, message: 'Thank you! We will contact you soon.' });
  }

  if (method === 'POST' && path === 'teacher-login') {
    const body = await readBody(request);
    if ((body.secret || '') === TEACHER_SECRET) {
      return json({ success: true, redirect: `/teacher?secret=${TEACHER_SECRET}` });
    }

    return json({ success: false, message: 'Invalid teacher secret' }, { status: 401 });
  }

  if (method === 'GET' && path === 'students') {
    const denied = await teacherGuard(request);
    if (denied) return denied;

    const result = await queryAll(
      db,
      'SELECT s.*, c.course_name FROM students s LEFT JOIN courses c ON s.course_id = c.id ORDER BY s.id DESC'
    );
    return json({ success: true, students: result.results || [] });
  }

  if (method === 'GET' && path === 'courses') {
    const denied = await teacherGuard(request);
    if (denied) return denied;

    return json({ success: true, courses: await getPublicCourses(db) });
  }

  if (method === 'GET' && path === 'certificates') {
    const denied = await teacherGuard(request);
    if (denied) return denied;

    const result = await queryAll(
      db,
      `SELECT ce.*, s.first_name, s.last_name, c.course_name
       FROM certificates ce
       JOIN students s ON ce.student_id = s.id
       JOIN courses c ON ce.course_id = c.id
       ORDER BY ce.id DESC`
    );
    return json({ success: true, certificates: result.results || [] });
  }

  if (method === 'GET' && path === 'projects') {
    const denied = await teacherGuard(request);
    if (denied) return denied;

    return json({ success: true, projects: await getPublicProjects(db) });
  }

  if (method === 'POST' && path === 'add-student') {
    const body = await readBody(request);
    const denied = await teacherGuard(request, body);
    if (denied) return denied;

    const { enrollment_id, first_name, last_name, email, phone = '', course_id } = body;
    if (!enrollment_id || !first_name || !last_name || !email || !course_id) {
      return json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    try {
      const result = await run(
        db,
        `INSERT INTO students (enrollment_id, first_name, last_name, email, phone, enrollment_date, course_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [enrollment_id, first_name, last_name, email, phone, new Date().toISOString().split('T')[0], course_id, 'active']
      );

      return json({ success: true, id: result.meta.last_row_id });
    } catch (error) {
      return json({ success: false, message: error.message }, { status: 400 });
    }
  }

  if (method === 'POST' && path === 'delete-student') {
    const body = await readBody(request);
    const denied = await teacherGuard(request, body);
    if (denied) return denied;

    const { student_id } = body;
    const result = await run(db, 'DELETE FROM students WHERE id = ?', [student_id]);
    return json({ success: true, changes: result.meta.changes });
  }

  if (method === 'DELETE' && path.startsWith('delete-student/')) {
    const body = {};
    const denied = await teacherGuard(request, body);
    if (denied) return denied;

    const id = path.slice('delete-student/'.length);
    const result = await run(db, 'DELETE FROM students WHERE id = ?', [id]);
    return json({ success: true, changes: result.meta.changes });
  }

  if (method === 'POST' && path === 'add-course') {
    const body = await readBody(request);
    const denied = await teacherGuard(request, body);
    if (denied) return denied;

    const { course_name, duration_months = null, description = '' } = body;
    if (!course_name) {
      return json({ success: false, message: 'Course name is required' }, { status: 400 });
    }

    const result = await run(
      db,
      'INSERT INTO courses (course_name, duration_months, description) VALUES (?, ?, ?)',
      [course_name, duration_months, description]
    );
    return json({ success: true, id: result.meta.last_row_id });
  }

  if (method === 'POST' && path === 'add-project') {
    const body = await readBody(request);
    const denied = await teacherGuard(request, body);
    if (denied) return denied;

    const {
      student_id,
      project_name,
      description = '',
      technologies = '',
      completion_date = null,
      project_url = null,
    } = body;

    if (!student_id || !project_name) {
      return json({ success: false, message: 'Student and project name are required' }, { status: 400 });
    }

    try {
      const result = await run(
        db,
        `INSERT INTO projects (student_id, project_name, description, technologies, completion_date, project_url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [student_id, project_name, description, technologies, completion_date, project_url]
      );

      return json({ success: true, id: result.meta.last_row_id });
    } catch (error) {
      return json({ success: false, message: error.message }, { status: 400 });
    }
  }

  if (method === 'POST' && path === 'delete-course') {
    const body = await readBody(request);
    const denied = await teacherGuard(request, body);
    if (denied) return denied;

    const { course_id } = body;
    const result = await run(db, 'DELETE FROM courses WHERE id = ?', [course_id]);
    return json({ success: true, changes: result.meta.changes });
  }

  if (method === 'DELETE' && path.startsWith('delete-course/')) {
    const body = {};
    const denied = await teacherGuard(request, body);
    if (denied) return denied;

    const id = path.slice('delete-course/'.length);
    const result = await run(db, 'DELETE FROM courses WHERE id = ?', [id]);
    return json({ success: true, changes: result.meta.changes });
  }

  if (method === 'POST' && path === 'delete-project') {
    const body = await readBody(request);
    const denied = await teacherGuard(request, body);
    if (denied) return denied;

    const { project_id } = body;
    const result = await run(db, 'DELETE FROM projects WHERE id = ?', [project_id]);
    return json({ success: true, changes: result.meta.changes });
  }

  if (method === 'DELETE' && path.startsWith('delete-project/')) {
    const body = {};
    const denied = await teacherGuard(request, body);
    if (denied) return denied;

    const id = path.slice('delete-project/'.length);
    const result = await run(db, 'DELETE FROM projects WHERE id = ?', [id]);
    return json({ success: true, changes: result.meta.changes });
  }

  if (method === 'POST' && path === 'issue-certificate') {
    const body = await readBody(request);
    const denied = await teacherGuard(request, body);
    if (denied) return denied;

    const { student_id, course_id, issue_date = new Date().toISOString().split('T')[0] } = body;
    if (!student_id || !course_id) {
      return json({ success: false, message: 'Missing student or course selection' }, { status: 400 });
    }

    const certNumber = `SCE${Date.now()}`;
    try {
      const result = await run(
        db,
        `INSERT INTO certificates (student_id, course_id, issue_date, certificate_number, status)
         VALUES (?, ?, ?, ?, ?)`,
        [student_id, course_id, issue_date, certNumber, 'earned']
      );

      return json({ success: true, id: result.meta.last_row_id });
    } catch (error) {
      return json({ success: false, message: error.message }, { status: 400 });
    }
  }

  if (method === 'POST' && path === 'delete-certificate') {
    const body = await readBody(request);
    const denied = await teacherGuard(request, body);
    if (denied) return denied;

    const { certificate_id } = body;
    const result = await run(db, 'DELETE FROM certificates WHERE id = ?', [certificate_id]);
    return json({ success: true, changes: result.meta.changes });
  }

  if (method === 'DELETE' && path.startsWith('delete-certificate/')) {
    const body = {};
    const denied = await teacherGuard(request, body);
    if (denied) return denied;

    const id = path.slice('delete-certificate/'.length);
    const result = await run(db, 'DELETE FROM certificates WHERE id = ?', [id]);
    return json({ success: true, changes: result.meta.changes });
  }

  if (method === 'POST' && path === 'update-institute') {
    const body = await readBody(request);
    const denied = await teacherGuard(request, body);
    if (denied) return denied;

    const { phone, email, whatsapp, teacher_name, address } = body;
    const result = await run(
      db,
      `UPDATE institute_info
       SET phone = ?, email = ?, whatsapp = ?, teacher_name = ?, address = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = 1`,
      [phone, email, whatsapp, teacher_name, address]
    );

    return json({ success: true, changes: result.meta.changes });
  }

  return json({ success: false, message: 'Not Found' }, { status: 404 });
}
