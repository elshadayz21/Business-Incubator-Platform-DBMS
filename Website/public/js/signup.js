const form = document.getElementById('signupForm');
const password = document.getElementById('password');

// --- Password Strength Checklist Logic ---
const checklist = document.getElementById('passwordChecklist');

const updateCheckItem = (elId, isValid) => {
    const el = document.getElementById(elId);
    if (!el) return;
    const icon = el.querySelector('i');
    const text = el.querySelector('span');

    if (isValid) {
        icon.className = 'fa-solid fa-check text-[10px] text-green-500 transition';
        text.classList.add('text-green-600');
        text.classList.remove('text-muted');
    } else {
        icon.className = 'fa-solid fa-circle text-[6px] text-slate-400 transition';
        text.classList.remove('text-green-600');
        text.classList.add('text-muted');
    }
};

if (password && checklist) {
    // Show checklist when user clicks into the password field
    password.addEventListener('focus', () => checklist.classList.remove('hidden'));

    // Live update as they type
    password.addEventListener('input', () => {
        const val = password.value;

        updateCheckItem('check-length', val.length >= 8);
        updateCheckItem('check-upper', /[A-Z]/.test(val));
        updateCheckItem('check-lower', /[a-z]/.test(val));
        updateCheckItem('check-number', /[0-9]/.test(val));
        updateCheckItem('check-special', /[@$!%*?&]/.test(val));
    });
}
// -----------------------------------------


const confirmPassword = document.getElementById('confirmPassword');
const passwordMatch = document.getElementById('passwordMatch');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// Function to show error message
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
    errorMessage.classList.add('hidden');
}

confirmPassword.addEventListener('input', function () {
    if (confirmPassword.value === '') {
        passwordMatch.classList.add('hidden');
        return;
    }

    if (password.value === confirmPassword.value) {
        passwordMatch.textContent = '✓ Passwords match';
        passwordMatch.classList.remove('hidden', 'text-red-500');
        passwordMatch.classList.add('text-green-500');
    } else {
        passwordMatch.textContent = '✗ Passwords do not match';
        passwordMatch.classList.remove('hidden', 'text-green-500');
        passwordMatch.classList.add('text-red-500');
    }
});

// Form submission validation
form.addEventListener('submit', function (e) {
    hideError();

    const nameValue = document.getElementById('name').value.trim();
    const emailValue = document.getElementById('email').value.trim();
    const passwordValue = password.value;
    const confirmPasswordValue = confirmPassword.value;
    const termsChecked = document.getElementById('terms').checked;

    // Validate name
    if (nameValue === '') {
        e.preventDefault();
        showError('Please enter your full name.');
        return;
    }

    if (nameValue.length < 2) {
        e.preventDefault();
        showError('Name must be at least 2 characters long.');
        return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
        e.preventDefault();
        showError('Please enter a valid email address.');
        return;
    }


    // Validate password strength
    if (passwordValue.length < 8) {
        e.preventDefault();
        showError('Password must be at least 8 characters long.');
        return;
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(passwordValue)) {
        e.preventDefault();
        showError('Password must include uppercase, lowercase, a number, and a special character.');
        return;
    }

    // Validate password match
    if (passwordValue !== confirmPasswordValue) {
        e.preventDefault();
        showError('Passwords do not match. Please make sure both passwords are identical.');
        return;
    }

    // Validate terms
    if (!termsChecked) {
        e.preventDefault();
        showError('You must agree to the Terms of Service and Privacy Policy.');
        return;
    }

});

// Real-time password validation
password.addEventListener('input', function () {
    if (confirmPassword.value !== '') {
        confirmPassword.dispatchEvent(new Event('input'));
    }
});
// --- Show/Hide Password Logic ---
const showPasswordCheckbox = document.getElementById('showPassword');

if (showPasswordCheckbox) {
    showPasswordCheckbox.addEventListener('change', function() {
        // Toggle both password and confirm password fields
        const type = this.checked ? 'text' : 'password';
        if (password) password.type = type;
        if (confirmPassword) confirmPassword.type = type;
    });
}