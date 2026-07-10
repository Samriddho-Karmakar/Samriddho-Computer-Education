// Mobile Menu Toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
  });

  // Close menu when link is clicked
  document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      hamburger.classList.remove('active');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar')) {
      navMenu.classList.remove('active');
      hamburger.classList.remove('active');
    }
  });
}

// Student Search
const studentSearch = document.getElementById('studentSearch');
if (studentSearch) {
  studentSearch.addEventListener('submit', async (e) => {
    e.preventDefault();
    const enrollmentId = document.getElementById('enrollmentId').value;
    
    try {
      const response = await fetch('/api/student/' + enrollmentId);
      const data = await response.json();
      
      const resultDiv = document.getElementById('studentResult');
      if (data.success) {
        const student = data.student;
        resultDiv.innerHTML = `
          <div class="container">
            <div class="student-result">
              <h3>✓ Student Found</h3>
              <div class="info-grid">
                <div>
                  <strong>Name:</strong> ${student.first_name} ${student.last_name}
                </div>
                <div>
                  <strong>Enrollment ID:</strong> ${student.enrollment_id}
                </div>
                <div>
                  <strong>Email:</strong> ${student.email}
                </div>
                <div>
                  <strong>Phone:</strong> ${student.phone}
                </div>
                <div>
                  <strong>Course:</strong> ${student.course_name}
                </div>
                <div>
                  <strong>Enrollment Date:</strong> ${new Date(student.enrollment_date).toLocaleDateString()}
                </div>
              </div>
              ${student.certificates && student.certificates.length > 0 ? `
                <div style="margin-top:2rem">
                  <h4 style="color:#0066ff;margin-bottom:1rem">Certificates</h4>
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Issue Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${student.certificates.map(cert => `
                        <tr>
                          <td>${cert.course_name || 'Course'}</td>
                          <td>${new Date(cert.issue_date).toLocaleDateString()}</td>
                          <td><span style="color:green">${cert.status}</span></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}
              ${student.projects && student.projects.length > 0 ? `
                <div style="margin-top:2rem">
                  <h4 style="color:#0066ff;margin-bottom:1rem">Projects</h4>
                  <div class="projects-grid">
                    ${student.projects.map(proj => `
                      <div class="project-card">
                        <h4>${proj.project_name}</h4>
                        <p>${proj.description}</p>
                        <p><strong>Tech:</strong> ${proj.technologies}</p>
                        ${projectDetailsButton(proj.project_url)}
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      } else {
        resultDiv.innerHTML = `
          <div class="container">
            <div class="student-result" style="background:#fff3cd;border-left-color:#ff9800">
              <h3>⚠ Not Found</h3>
              <p>${data.message}</p>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error:', error);
      document.getElementById('studentResult').innerHTML = `
        <div class="container">
          <div class="student-result" style="background:#ffebee;border-left-color:#f44336">
            <h3>✗ Error</h3>
            <p>Failed to retrieve student information. Please try again.</p>
          </div>
        </div>
      `;
    }
  });
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeProjectUrl(url) {
  const value = String(url || '').trim();
  return /^https?:\/\//i.test(value) ? value : '';
}

function projectDetailsButton(url) {
  const safeUrl = safeProjectUrl(url);
  if (!safeUrl) {
    return '<span class="btn btn-small btn-primary" style="opacity:.55;pointer-events:none" aria-disabled="true">Details</span>';
  }

  return `<a class="btn btn-small btn-primary" href="${escapeHtml(safeUrl)}" target="_blank" rel="noreferrer">Details</a>`;
}

async function loadHomePage() {
  const statsGrid = document.getElementById('statsGrid');
  const coursesGrid = document.getElementById('featuredCourses');
  const projectsGrid = document.getElementById('featuredProjects');

  if (!statsGrid && !coursesGrid && !projectsGrid) return;

  try {
    const data = await fetchJson('/api/public/home');

    if (statsGrid) {
      statsGrid.innerHTML = `
        <div class="stat-card"><h3>${Math.floor((data.stats.total_students || 0)/5)*5}+</h3><p>Active Students</p></div>
        <div class="stat-card"><h3>${data.stats.total_courses || 0}+</h3><p>Courses Offered</p></div>
        <div class="stat-card"><h3>${data.stats.total_projects || 0}+</h3><p>Student Projects</p></div>
        <div class="stat-card"><h3>100%</h3><p>Satisfaction Rate</p></div>
      `;
    }

    if (coursesGrid) {
      coursesGrid.innerHTML = (data.courses || []).map((course) => `
        <div class="course-card">
          <h3>${escapeHtml(course.course_name)}</h3>
          <p>${escapeHtml(course.description || 'Professional training in latest technologies')}</p>
          <p class="course-duration">Duration: ${course.duration_months || '-'} months</p>
          <p class="course-students">Students: ${course.student_count || 0}</p>
        </div>
      `).join('');
    }

    if (projectsGrid) {
      projectsGrid.innerHTML = (data.projects || []).map((project) => `
        <div class="project-card">
          <h4>${escapeHtml(project.project_name)}</h4>
          <p>${escapeHtml(project.description || '')}</p>
          <p class="tech-stack"><strong>Tech:</strong> ${escapeHtml(project.technologies || '')}</p>
          <p class="student-name">By: ${escapeHtml(project.first_name || '')} ${escapeHtml(project.last_name || '')}</p>
          ${projectDetailsButton(project.project_url)}
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load home data:', error);
  }
}

async function loadCoursesPage() {
  const coursesGrid = document.getElementById('coursesGrid');
  if (!coursesGrid) return;

  try {
    const data = await fetchJson('/api/public/courses');
    coursesGrid.innerHTML = (data.courses || []).map((course) => `
      <div class="course-card">
        <h3>${escapeHtml(course.course_name)}</h3>
        <p>${escapeHtml(course.description || 'Professional course in latest technologies')}</p>
        <div class="course-details">
          <p><strong>Duration:</strong> ${course.duration_months || '-'} months</p>
          <p><strong>Students Enrolled:</strong> ${course.student_count || 0}</p>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load courses:', error);
  }
}

async function loadProjectsPage() {
  const projectsGrid = document.getElementById('projectsGrid');
  if (!projectsGrid) return;

  try {
    const data = await fetchJson('/api/public/projects');
    projectsGrid.innerHTML = (data.projects || []).map((project) => `
      <div class="project-card">
        <h4>${escapeHtml(project.project_name)}</h4>
        <p class="student-info">By: <strong>${escapeHtml(project.first_name || '')} ${escapeHtml(project.last_name || '')}</strong></p>
        <p>${escapeHtml(project.description || '')}</p>
        <p class="tech-stack"><strong>Technologies:</strong> ${escapeHtml(project.technologies || '')}</p>
        <p class="date">Completed: ${project.completion_date ? new Date(project.completion_date).toLocaleDateString() : '-'}</p>
        ${projectDetailsButton(project.project_url)}
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load projects:', error);
  }
}

async function loadContactInfo() {
  const contactInfo = document.getElementById('contactInfo');
  if (!contactInfo) return;

  try {
    const info = await fetchJson('/api/institute-info');
    const address = document.getElementById('contactAddress');
    const phone = document.getElementById('contactPhone');
    const email = document.getElementById('contactEmail');
    const whatsapp = document.getElementById('contactWhatsapp');
    const teacher = document.getElementById('contactTeacher');

    if (address) address.textContent = info.address || '';
    if (phone) phone.textContent = info.phone || '';
    if (phone) phone.href = `tel:${info.phone || ''}`;
    if (email) email.textContent = info.email || '';
    if (email) email.href = `mailto:${info.email || ''}`;
    if (whatsapp) whatsapp.textContent = 'Chat with us on WhatsApp';
    if (whatsapp) whatsapp.href = info.whatsapp || '#';
    if (teacher) teacher.textContent = info.teacher_name || '';
    const badge = document.getElementById('contactBadge');
    if (badge) badge.textContent = info.approved_tag || '';
  } catch (error) {
    console.error('Failed to load institute info:', error);
  }
}

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href !== '#') {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

// Add animation on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

document.querySelectorAll('.card, .stat-card, .course-card, .project-card, .app-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'all 0.5s ease';
  observer.observe(el);
});

loadHomePage();
loadCoursesPage();
loadProjectsPage();
// loadContactInfo();

console.log('✓ Script loaded successfully');
