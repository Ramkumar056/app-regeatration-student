// ======================
// CONFIG
// ======================
const API = "https://app-regegatration-student.onrender.com";
// Change this to your Render backend URL when deployed



// ======================
// REGISTER USER
// ======================
async function registerUser() {
  const fullName = document.getElementById("r_fullname").value;
  const email = document.getElementById("r_email").value;
  const password = document.getElementById("r_password").value;

  const res = await fetch(API + "/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullName, email, password })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  // Save token
  localStorage.setItem("token", data.token);

  // Go to dashboard
  window.location.href = "dashboard.html";
}



// ======================
// LOGIN USER
// ======================
async function loginUser() {
  const email = document.getElementById("l_email").value;
  const password = document.getElementById("l_password").value;

  const res = await fetch(API + "/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  // Save token
  localStorage.setItem("token", data.token);

  // Go to dashboard
  window.location.href = "dashboard.html";
}



// ======================
// Logout
// ======================
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}



// ======================
// Load Dashboard
// ======================
async function loadDashboard() {
  const token = localStorage.getItem("token");
  if (!token) return (window.location = "login.html");

  const res = await fetch(API + "/api/dashboard", {
    headers: { Authorization: "Bearer " + token }
  });

  const user = await res.json();

  if (user.error) {
    alert("Session expired. Login again.");
    logout();
    return;
  }

  // Fill user info
  document.getElementById("user-name").innerText = "Welcome, " + user.fullName;
  document.getElementById("user-email").innerText = user.email;
  document.getElementById("user-meta").innerText =
    "Registered Courses: " + user.courses.length;

  renderCourses(user.courses);
}



// ======================
// Render Courses List
// ======================
function renderCourses(courses) {
  const list = document.getElementById("courses");
  const emptyMsg = document.getElementById("no-courses");
  list.innerHTML = "";

  if (!courses || courses.length === 0) {
    emptyMsg.style.display = "block";
    return;
  }

  emptyMsg.style.display = "none";

  courses.forEach((course) => {
    const div = document.createElement("div");
    div.className = "course-item";
    div.innerHTML = `
      <span>${course}</span>
      <button onclick="removeCourse('${course}')" class="remove-btn">Remove</button>
    `;
    list.appendChild(div);
  });
}



// ======================
// Add Course
// ======================
async function addCourse() {
  const token = localStorage.getItem("token");
  const selected = document.getElementById("course-select").value;
  const custom = document.getElementById("course-custom").value.trim();

  const course = custom !== "" ? custom : selected;

  const res = await fetch(API + "/api/add-course", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ course })
  });

  const data = await res.json();
  const msg = document.getElementById("course-msg");

  if (data.error) {
    msg.innerText = data.error;
    return;
  }

  msg.innerText = "Course added!";
  document.getElementById("course-custom").value = "";

  loadDashboard();
}



// ======================
// Remove Course
// ======================
async function removeCourse(course) {
  const token = localStorage.getItem("token");

  const res = await fetch(API + "/api/remove-course", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({ course })
  });

  const data = await res.json();

  if (data.error) {
    alert(data.error);
    return;
  }

  loadDashboard();
}
