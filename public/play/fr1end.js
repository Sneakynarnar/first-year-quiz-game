function fetchFriends() {
    var friendsData = [
        { id: 1, name: 'Friend 1', online: true },
        { id: 2, name: 'Friend 2', online: true },
        { id: 3, name: 'Friend 3', online: false }
    ];

    var onlineFriendsList = document.getElementById('onlineFriends');
    var offlineFriendsList = document.getElementById('offlineFriends');

    onlineFriendsList.innerHTML = ''; 
    offlineFriendsList.innerHTML = ''; 

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

}

function removeFriend() {

}

document.addEventListener('DOMContentLoaded', function() {
    fetchFriends();
});