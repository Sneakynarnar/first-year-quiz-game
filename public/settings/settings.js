function confirmDelete() {
    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
        alert("Account deleted successfully!");
        window.location.href = "index.html";
    }
}

function confirmReset() {
    if (confirm("Are you sure you want to reset your stats? This action cannot be undone.")) {
        alert("Stats reset successfully!");
        window.location.reload();
    }
}

document.getElementById("usernameForm").addEventListener("submit", function(event) {
    event.preventDefault();
    var newUsername = document.getElementById("username").value;
    alert("Username saved successfully!");
});

