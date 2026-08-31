const form = document.getElementById('signupForm');
const password = document.getElementById('password');
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

    // Validate password complexity
    const hasLength = passwordValue.length >= 8;
    const hasUpper = /[A-Z]/.test(passwordValue);
    const hasLower = /[a-z]/.test(passwordValue);
    const hasDigit = /[0-9]/.test(passwordValue);
    const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue);

    if (!hasLength || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
        e.preventDefault();
        showError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
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

const passwordStrengthContainer = document.getElementById('password-strength-container');
const strengthBar = document.getElementById('strength-bar');
const strengthText = document.getElementById('strength-text');
const ruleLength = document.getElementById('rule-length');
const ruleUpper = document.getElementById('rule-upper');
const ruleLower = document.getElementById('rule-lower');
const ruleDigit = document.getElementById('rule-digit');
const ruleSpecial = document.getElementById('rule-special');

function updateRule(element, isValid) {
    const icon = element.querySelector('.rule-icon');
    if (isValid) {
        icon.textContent = '✓';
        icon.className = 'rule-icon text-green-500';
        element.className = 'flex items-center gap-1.5 text-green-700';
    } else {
        icon.textContent = '✗';
        icon.className = 'rule-icon text-red-500';
        element.className = 'flex items-center gap-1.5 text-muted';
    }
}

// Real-time password validation
password.addEventListener('input', function () {
    const value = password.value;
    if (value === '') {
        passwordStrengthContainer.classList.add('hidden');
        return;
    }

    passwordStrengthContainer.classList.remove('hidden');

    const hasLength = value.length >= 8;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasDigit = /[0-9]/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);

    updateRule(ruleLength, hasLength);
    updateRule(ruleUpper, hasUpper);
    updateRule(ruleLower, hasLower);
    updateRule(ruleDigit, hasDigit);
    updateRule(ruleSpecial, hasSpecial);

    // Calculate score
    let score = 0;
    if (hasLength) score += 20;
    if (hasUpper) score += 20;
    if (hasLower) score += 20;
    if (hasDigit) score += 20;
    if (hasSpecial) score += 20;

    strengthBar.style.width = `${score}%`;

    if (score < 40) {
        strengthBar.className = 'h-full bg-red-500 transition-all duration-300';
        strengthText.textContent = 'Strength: Weak';
        strengthText.className = 'text-[10px] font-extrabold text-red-600 uppercase tracking-wider';
    } else if (score < 100) {
        strengthBar.className = 'h-full bg-yellow-500 transition-all duration-300';
        strengthText.textContent = 'Strength: Medium';
        strengthText.className = 'text-[10px] font-extrabold text-yellow-600 uppercase tracking-wider';
    } else {
        strengthBar.className = 'h-full bg-green-500 transition-all duration-300';
        strengthText.textContent = 'Strength: Strong';
        strengthText.className = 'text-[10px] font-extrabold text-green-600 uppercase tracking-wider';
    }

    if (confirmPassword.value !== '') {
        confirmPassword.dispatchEvent(new Event('input'));
    }
});