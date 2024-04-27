const urlParams = new URLSearchParams(window.location.search);
const accountId = urlParams.get('accountId');

if (!accountId) {
  window.location.href = 'http://localhost:3000/login';
}
const accountInfo = fetch(`http://localhost:3000/api/accounts/${accountId}`).then(response => response.json());

//TODO: Display account info on the page

