let userData = {
    "user123": {
      "name": "Alice",
      "score": 80
    },
    "user456": {
      "name": "Bob",
      "score": 75
    },
    "user789": {
      "name": "Charlie",
      "score": 70
    }
  };
  
  document.addEventListener("DOMContentLoaded", function () {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            const dataDisplay = document.getElementById("dataDisplay");

            const nameElement = document.createElement("p");
            nameElement.textContent = "Name: " + data.name;

            const ageElement = document.createElement("p");
            ageElement.textContent = "Age: " + data.age;

            const cityElement = document.createElement("p");
            cityElement.textContent = "City: " + data.city;

    
            dataDisplay.appendChild(nameElement);
            dataDisplay.appendChild(ageElement);
            dataDisplay.appendChild(cityElement);
        })
        .catch(error => console.error("Error fetching JSON data:", error));
});
  
  function updateUserStats(userId, score) {
    if (userData.hasOwnProperty(userId)) {
      userData[userId].score = score;
    } else {
    
      userData[userId] = {
        "name": "New User",
        "score": score
      };
    }
   
    userData = Object.fromEntries(
      Object.entries(userData).sort(([,a],[,b]) => b.score - a.score)
    );
  
    displayStats();
  }
  
  
  function displayStats() {
    const userStatsElement = document.getElementById('userStats');
    userStatsElement.innerHTML = ''; 
    let currentUserPosition;
  
  
    let rank = 1;
    for (const user in userData) {
      const userInfo = userData[user];
      const li = document.createElement('li');
      li.innerHTML = `<span>${userInfo.name}</span> - Score: ${userInfo.score}, Rank: ${rank}`;
      if (user === "user123") { 
        li.classList.add('highlight');
        currentUserPosition = rank;
      }
      userStatsElement.appendChild(li);
      rank++;
    }
  
   
    if (currentUserPosition) {
      const infoDiv = document.createElement('div');
      infoDiv.innerHTML = `You are currently in position ${currentUserPosition} out of ${Object.keys(userData).length} students.`;
      infoDiv.classList.add('highlight');
      userStatsElement.parentNode.insertBefore(infoDiv, userStatsElement.nextSibling);
    }
  }
  
  
  window.onload = displayStats;
  
  
  updateUserStats("user123", 90);
