// Get the form element;
const loginButton = document.querySelector('button');
function main() {
  loginButton.addEventListener('click', async (event) => {
    event.preventDefault();
    const logininfo = {
      username: document.querySelector('#username').value,
      password: document.querySelector('#password').value,
      confirmpassword: document.querySelector('#confirm-password').value,
    };

    if (!logininfo.username || !logininfo.password || !logininfo.confirmpassword) {
      alert('Please enter a username and password');
      return;
    }
    if (logininfo.password !== logininfo.confirmpassword) {
      alert('Passwords do not match');
      return;
    }
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logininfo), // HIGHLY HIGHLY INSECRE, ONLY FOR DEMO
    });
    console.log('Response:', response);
  });
}

main();
