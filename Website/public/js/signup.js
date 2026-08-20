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

    // Validate password length
    if (passwordValue.length < 8) {
        e.preventDefault();
        showError('Password must be at least 8 characters long.');
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