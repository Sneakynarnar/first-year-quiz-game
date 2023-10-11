const registerButtons = document.querySelectorAll('#dropdown-button');

registerButtons.forEach((button) => { // Add JavaScript to make the "Register" and "Login" buttons interactable
  button.addEventListener('click', () => {
    alert(`You clicked "${button.innerHTML}"`);
    // Add JavaScript code here to redirect the pages to the login or register
  });
});