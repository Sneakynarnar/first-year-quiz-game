const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('user');
const btnPlay = document.querySelector('#playButton');
btnPlay.addEventListener('click', () => {
  window.location.href = `/play?user=${username}`;
});
if (!username) {
  window.location.href = 'http://localhost:3000/login';
}
const accountInfo = fetch(`http://localhost:3000/api/accounts/${username}`).then(response => response.json());

//  TODO: Display account info on the page
