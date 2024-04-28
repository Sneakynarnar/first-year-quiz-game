function fetchFriends() {
    // You need to fetch the friends data from the server
    // This is a simplified example
    var friendsData = [
        { id: 1, name: 'Friend 1', online: true },
        { id: 2, name: 'Friend 2', online: true },
        { id: 3, name: 'Friend 3', online: false }
        // Add more friends data as needed
    ];

    var onlineFriendsList = document.getElementById('onlineFriends');
    var offlineFriendsList = document.getElementById('offlineFriends');

    onlineFriendsList.innerHTML = ''; // Clear existing content
    offlineFriendsList.innerHTML = ''; // Clear existing content

    friendsData.forEach(function(friend) {
        var friendElement = document.createElement('div');
        friendElement.classList.add('friend');
        friendElement.textContent = friend.name;
        if (friend.online) {
            friendElement.classList.add('online');
            onlineFriendsList.appendChild(friendElement);
        } else {
            friendElement.classList.add('offline');
            offlineFriendsList.appendChild(friendElement);
        }
    });
}

function addFriend() {
    // Implement adding friend logic here
    // You need to send a request to the server to add a friend
    // Handle the response accordingly
    // After adding the friend, call fetchFriends() to update the UI
}

function removeFriend() {
    // Implement removing friend logic here
    // You need to send a request to the server to remove a friend
    // Handle the response accordingly
    // After removing the friend, call fetchFriends() to update the UI
}

document.addEventListener('DOMContentLoaded', function() {
    fetchFriends();
});