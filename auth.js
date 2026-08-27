const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");
const toggleToRegister = document.getElementById("toggleToRegister");
const toggleToLogin = document.getElementById("toggleToLogin");
const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const authMessage = document.getElementById("authMessage");

const USERS_KEY = "todoAppUsers";
const SESSION_KEY = "todoAppCurrentUser";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Placeholder storage until a real backend/database is wired up.
function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function saveUser(user) {
    const users = getUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function findUser(email, password) {
    return getUsers().find(u => u.email === email && u.password === password);
}

function emailExists(email) {
    return getUsers().some(u => u.email === email);
}

function showMessage(text, type) {
    authMessage.textContent = text;
    authMessage.className = "auth-message show " + type;
}

function clearMessage() {
    authMessage.className = "auth-message";
    authMessage.textContent = "";
}

function markError(input) {
    input.classList.add("error");
    setTimeout(() => input.classList.remove("error"), 1000);
}

function switchToRegister() {
    clearMessage();
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    toggleToRegister.classList.add("hidden");
    toggleToLogin.classList.remove("hidden");
    formTitle.textContent = "Create Account";
    formSubtitle.textContent = "Sign up to start managing your tasks";
}

function switchToLogin() {
    clearMessage();
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    toggleToLogin.classList.add("hidden");
    toggleToRegister.classList.remove("hidden");
    formTitle.textContent = "Welcome Back";
    formSubtitle.textContent = "Login to continue to your To-Do List";
}

showRegister.addEventListener("click", function (e) {
    e.preventDefault();
    switchToRegister();
});

showLogin.addEventListener("click", function (e) {
    e.preventDefault();
    switchToLogin();
});

registerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearMessage();

    const nameInput = document.getElementById("registerName");
    const ageInput = document.getElementById("registerAge");
    const emailInput = document.getElementById("registerEmail");
    const passwordInput = document.getElementById("registerPassword");
    const confirmInput = document.getElementById("registerConfirmPassword");

    const name = nameInput.value.trim();
    const age = ageInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;

    if (!name) {
        markError(nameInput);
        showMessage("Please enter your full name.", "error");
        return;
    }
    if (!age || Number(age) <= 0) {
        markError(ageInput);
        showMessage("Please enter a valid age.", "error");
        return;
    }
    if (!EMAIL_PATTERN.test(email)) {
        markError(emailInput);
        showMessage("Please enter a valid email address.", "error");
        return;
    }
    if (password.length < 6) {
        markError(passwordInput);
        showMessage("Password must be at least 6 characters.", "error");
        return;
    }
    if (password !== confirmPassword) {
        markError(confirmInput);
        showMessage("Passwords do not match.", "error");
        return;
    }
    if (emailExists(email)) {
        markError(emailInput);
        showMessage("An account with this email already exists.", "error");
        return;
    }

    saveUser({ name, age, email, password });
    registerForm.reset();
    switchToLogin();
    document.getElementById("loginEmail").value = email;
    showMessage("Account created successfully. Please login.", "success");
});

loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearMessage();

    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    const user = findUser(email, password);
    if (!user) {
        markError(passwordInput);
        showMessage("Invalid email or password.", "error");
        return;
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }));
    window.location.href = "todo.html";
});
