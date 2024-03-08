const urls = "wss://" + window.location.pathname;
const ws = new ReconnectingWebSocket(urls);
const username = localStorage.getItem('username');

let all_players = [];
let total_player;
let player_track = 0;
let current_player;

ws.onopen = function (e) {
    ws.send(
        JSON.stringify({
            command: "joined", 
            info: `${username} has Joined!`,
            user: username
        })
    )
};

ws.onmessage = function (event) {
    const data = JSON.parse(event.data);
    const cmd = data.command;

    if (cmd === "joined") {
        all_players = data.all_players;
        total_player = data.users_count;
        current_player = all_players[player_track];
    }
}