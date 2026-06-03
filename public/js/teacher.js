function teacherFetchJson(url, options = {}) {
  const secret = new URLSearchParams(window.location.search).get('secret') || '';
  const headers = {
    'content-type': 'application/json',
    'x-teacher-secret': secret,
    ...(options.headers || {}),
  };

  return fetch(url, { ...options, headers }).then(async (response) => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  });
}

function teacherEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeProjectUrl(url) {
  const value = String(url || '').trim();
  if (!value) {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return '';
}

function projectDetailsButton(url) {
  const safeUrl = safeProjectUrl(url);
  if (!safeUrl) {
    return '<span class="btn btn-small btn-primary" style="opacity:.55;pointer-events:none" aria-disabled="true">Details</span>';
  }

  return `<a class="btn btn-small btn-primary" href="${teacherEscape(safeUrl)}" target="_blank" rel="noreferrer">Details</a>`;
}

const TEACHER_SECRET = new URLSearchParams(window.location.search).get('secret') || '';
const HAS_TEACHER_SECRET = Boolean(TEACHER_SECRET);

if (!HAS_TEACHER_SECRET) {
  window.location.replace('/teacher-login');
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach((button) => button.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  const clicked = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (clicked) {
    clicked.classList.add('active');
  }

  if (tabName === 'students') loadStudents();
  if (tabName === 'courses') loadCourses();
  if (tabName === 'projects') loadProjects();
  if (tabName === 'certificates') loadCertificates();
}

function togglePanel(id) {
  const element = document.getElementById(id);
  if (element) {
    element.style.display = element.style.display === 'none' ? 'block' : 'none';
  }
}

function showAddStudentForm() {
  togglePanel('studentForm');
}

function showAddCourseForm() {
  togglePanel('courseForm');
}

function showAddProjectForm() {
  togglePanel('projectForm');
}

function showIssueCertificateForm() {
  togglePanel('certForm');
}

async function loadStudents() {
  const data = await teacherFetchJson('/api/students');
  const students = data.students || [];

  const certSelect = document.getElementById('studentForCert');
  const projectSelect = document.getElementById('projectStudentId');
  if (certSelect) {
    certSelect.innerHTML = '<option value="">Select Student</option>' + students.map((student) => (
      `<option value="${student.id}">${teacherEscape(student.enrollment_id)} - ${teacherEscape(student.first_name)} ${teacherEscape(student.last_name)}</option>`
    )).join('');
  }
  if (projectSelect) {
    projectSelect.innerHTML = '<option value="">Select Student</option>' + students.map((student) => (
      `<option value="${student.id}">${teacherEscape(student.enrollment_id)} - ${teacherEscape(student.first_name)} ${teacherEscape(student.last_name)}</option>`
    )).join('');
  }

  const tbody = document.getElementById('studentsList');
  if (tbody) {
    tbody.innerHTML = students.map((student) => `
      <tr>
        <td>${teacherEscape(student.enrollment_id)}</td>
        <td>${teacherEscape(student.first_name)} ${teacherEscape(student.last_name)}</td>
        <td>${teacherEscape(student.email)}</td>
        <td>${teacherEscape(student.course_name || '-')}</td>
        <td class="action-cell">
          <button class="btn btn-small" onclick="deleteStudent(${student.id})">Delete</button>
        </td>
      </tr>
    `).join('');
  }
}

async function loadCourses() {
  const data = await teacherFetchJson('/api/courses');
  const courses = data.courses || [];

  const courseSelect = document.getElementById('courseId');
  const certCourseSelect = document.getElementById('courseForCert');
  if (courseSelect) {
    courseSelect.innerHTML = '<option value="">Select Course</option>' + courses.map((course) => (
      `<option value="${course.id}">${teacherEscape(course.course_name)}</option>`
    )).join('');
  }
  if (certCourseSelect) {
    certCourseSelect.innerHTML = '<option value="">Select Course</option>' + courses.map((course) => (
      `<option value="${course.id}">${teacherEscape(course.course_name)}</option>`
    )).join('');
  }

  const tbody = document.getElementById('coursesList');
  if (tbody) {
    tbody.innerHTML = courses.map((course) => `
      <tr>
        <td>${teacherEscape(course.course_name)}</td>
        <td>${teacherEscape(course.duration_months || '-')} months</td>
        <td>${teacherEscape(course.description || '-')}</td>
        <td class="action-cell">
          <button class="btn btn-small" onclick="deleteCourse(${course.id})">Delete</button>
        </td>
      </tr>
    `).join('');
  }
}

async function loadProjects() {
  const data = await teacherFetchJson('/api/projects');
  const projects = data.projects || [];
  const tbody = document.getElementById('projectsList');
  if (tbody) {
    tbody.innerHTML = projects.map((project) => `
      <tr>
        <td>${teacherEscape(project.enrollment_id)}</td>
        <td>${teacherEscape(project.first_name)} ${teacherEscape(project.last_name)}</td>
        <td>${teacherEscape(project.project_name)}</td>
        <td>${teacherEscape(project.technologies || '-')}</td>
        <td>${project.completion_date ? new Date(project.completion_date).toLocaleDateString() : '-'}</td>
        <td class="action-cell">${projectDetailsButton(project.project_url)}</td>
        <td class="action-cell">
          <button class="btn btn-small" onclick="deleteProject(${project.id})">Delete</button>
        </td>
      </tr>
    `).join('');
  }
}

async function loadCertificates() {
  const data = await teacherFetchJson('/api/certificates');
  const certificates = data.certificates || [];
  const tbody = document.getElementById('certificatesList');
  if (tbody) {
    tbody.innerHTML = certificates.map((certificate) => `
      <tr>
        <td>${teacherEscape(certificate.first_name)} ${teacherEscape(certificate.last_name)}</td>
        <td>${teacherEscape(certificate.course_name)}</td>
        <td>${new Date(certificate.issue_date).toLocaleDateString()}</td>
        <td><span style="color:green">${teacherEscape(certificate.status)}</span></td>
        <td class="action-cell">
          <button class="btn btn-small" onclick="deleteCertificate(${certificate.id})">Delete</button>
        </td>
      </tr>
    `).join('');
  }
}

async function addStudent() {
  const payload = {
    enrollment_id: document.getElementById('sceId').value.trim(),
    first_name: document.getElementById('firstName').value.trim(),
    last_name: document.getElementById('lastName').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    course_id: document.getElementById('courseId').value,
    secret: TEACHER_SECRET,
  };

  const result = await teacherFetchJson('/api/add-student', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  alert('Student added successfully!');
  document.getElementById('sceId').value = '';
  document.getElementById('firstName').value = '';
  document.getElementById('lastName').value = '';
  document.getElementById('email').value = '';
  document.getElementById('phone').value = '';
  togglePanel('studentForm');
  await loadStudents();
  await loadCourses();
  return result;
}

async function addProject() {
  const payload = {
    student_id: document.getElementById('projectStudentId').value,
    project_name: document.getElementById('projectName').value.trim(),
    description: document.getElementById('projectDescription').value.trim(),
    technologies: document.getElementById('projectTechnologies').value.trim(),
    completion_date: document.getElementById('projectCompletionDate').value,
    project_url: document.getElementById('projectUrl').value.trim(),
    secret: TEACHER_SECRET,
  };

  const result = await teacherFetchJson('/api/add-project', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  alert('Project added successfully!');
  document.getElementById('projectStudentId').value = '';
  document.getElementById('projectName').value = '';
  document.getElementById('projectDescription').value = '';
  document.getElementById('projectTechnologies').value = '';
  document.getElementById('projectCompletionDate').value = '';
  document.getElementById('projectUrl').value = '';
  togglePanel('projectForm');
  await loadProjects();
  return result;
}

async function addCourse() {
  const payload = {
    course_name: document.getElementById('courseName').value.trim(),
    duration_months: document.getElementById('duration').value,
    description: document.getElementById('description').value.trim(),
    secret: TEACHER_SECRET,
  };

  const result = await teacherFetchJson('/api/add-course', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  alert('Course added successfully!');
  document.getElementById('courseName').value = '';
  document.getElementById('duration').value = '';
  document.getElementById('description').value = '';
  togglePanel('courseForm');
  await loadCourses();
  return result;
}

async function deleteProject(id) {
  if (!confirm('Are you sure?')) return;
  await teacherFetchJson('/api/delete-project/' + id, {
    method: 'DELETE',
  });
  await loadProjects();
}

async function issueCertificate() {
  const payload = {
    student_id: document.getElementById('studentForCert').value,
    course_id: document.getElementById('courseForCert').value,
    issue_date: document.getElementById('issueDate').value,
    secret: TEACHER_SECRET,
  };

  const result = await teacherFetchJson('/api/issue-certificate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  alert('Certificate issued successfully!');
  document.getElementById('studentForCert').value = '';
  document.getElementById('courseForCert').value = '';
  document.getElementById('issueDate').value = '';
  togglePanel('certForm');
  await loadCertificates();
  return result;
}

async function deleteStudent(id) {
  if (!confirm('Are you sure?')) return;
  await teacherFetchJson('/api/delete-student/' + id, {
    method: 'DELETE',
  });
  await loadStudents();
}

async function deleteCourse(id) {
  if (!confirm('Are you sure?')) return;
  await teacherFetchJson('/api/delete-course/' + id, {
    method: 'DELETE',
  });
  await loadCourses();
}

async function deleteCertificate(id) {
  if (!confirm('Are you sure?')) return;
  await teacherFetchJson('/api/delete-certificate/' + id, {
    method: 'DELETE',
  });
  await loadCertificates();
}

function logout() {
  window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!HAS_TEACHER_SECRET) {
    return;
  }

  try {
    await Promise.all([loadStudents(), loadCourses(), loadProjects(), loadCertificates()]);
  } catch (error) {
    alert(error.message);
  }
});
