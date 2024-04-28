// Get the form element;
const loginButton = document.querySelector('button');
function main() {
  loginButton.addEventListener('click', async (event) => {
    event.preventDefault();
    const logininfo = {
      username: document.querySelector('#username').value,
      password: document.querySelector('#password').value,
    };
    if (!logininfo.username || !logininfo.password) {
      alert('Please enter a username and password');
      return;
    }
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logininfo), // HIGHLY HIGHLY INSECRE, ONLY FOR DEMO
    });
    console.log('Response:', response);
    if (response.ok) {
      window.location.href = `http://localhost:3000?user=${logininfo.username}`;
    }
  });
}

main();
