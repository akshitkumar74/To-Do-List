const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showRegister = document.getElementById("showRegister");
const showLogin = document.getElementById("showLogin");
const toggleToRegister = document.getElementById("toggleToRegister");
const toggleToLogin = document.getElementById("toggleToLogin");
const formTitle = document.getElementById("formTitle");
const formSubtitle = document.getElementById("formSubtitle");
const authMessage = document.getElementById("authMessage");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function registerUser(fullName, age, email, password) {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });

    if (error) {
        return { success: false, message: error.message };
    }

    const userId = data.user.id;
    const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert([{ id: userId, full_name: fullName, age: age, email: email }]);

    if (profileError) {
        return { success: false, message: profileError.message };
    }

    return { success: true, message: "Account created successfully. Please login." };
}

async function loginUser(email, password) {
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        return { success: false, message: error.message };
    }

    return { success: true };
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

registerForm.addEventListener("submit", async function (e) {
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
    const result = await registerUser(name, age, email, password);
    if (!result.success) {
        markError(emailInput);
        showMessage(result.message, "error");
        return;
    }

    registerForm.reset();
    switchToLogin();
    document.getElementById("loginEmail").value = email;
    showMessage(result.message, "success");
});

loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    clearMessage();

    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    const result = await loginUser(email, password);
    if (!result.success) {
        markError(passwordInput);
        showMessage(result.message, "error");
        return;
    }

    window.location.href = "todo.html";
});
