function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const password2 = document.getElementById('password2').value;
    const errorMessage = document.getElementById('error-message');

    // Add email validation here

    if (password === password2) {
        // Passwords match, allow login
        errorMessage.textContent = '';
        alert('Login Successful');
    } else {
        // Passwords do not match, show error message
        errorMessage.textContent = 'Passwords do not match';
    }
}

function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const password2 = document.getElementById('password2').value;
    const errorMessage = document.getElementById('error-message');

    // Add email validation here

    if (password === password2) {
        // Passwords match, allow registration
        errorMessage.textContent = '';
        alert('Registration Successful');
    } else {
        // Passwords do not match, show error message
        errorMessage.textContent = 'Passwords do not match';
    }
}