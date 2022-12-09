'use strict';

const fetch = require('node-fetch');

//Set up express
const express = require('express');
const app = express();

//Setup socket.io
const server = require('http').Server(app);
const io = require('socket.io')(server);

const apiEndpoint = process.env['apiEndpoint']


//Setup static page handling
app.set('view engine', 'ejs');
app.use('/static', express.static('public'));

//Handle client interface on /
app.get('/', (req, res) => {
  res.render('client');
});
//Handle display interface on /display
app.get('/display', (req, res) => {
  res.render('display');
});

// //State
//     We suggest including a state number, a state object, a list of players, list of audience members, active prompts, answers received, 
//     votes received, the current prompt (when cycling through prompts for voting), round scores and total scores
//     You will also want to have a player state per player
// 1. Joining: waiting for players
// 2. Prompts: players and audience suggest prompts (these will be then used as prompts combined with random prompts from the API)
// 3. Answers: players give answers to prompts (2 players to 1 prompt. Players will either get 1 prompt or 2 prompts in a round depending on number of players)
// 4. Voting: players and audience vote on answers to each prompt (cycle through all prompts in the round)
// 5. Results: voting results (show votes and points for this prompt)
// 6. Scores: total scores (tally up total overall scores)
// 7. Game Over: end of game (show final scores)

const GameState = {
  Joining: 1,
  Prompts: 2,
  Answers: 3,
  Voting: 4,
  Results: 5,
  Scores: 6,
  GameOver: 7   
}

let userData = new Map()
let players = new Set()
let audience = new Set()
let roundScores = []
let totalScores = []
let votes = []
let prompts = []

let usersToSockets = new Map();
let socketsToUsers = new Map();

let state = GameState.Joining;
let timer = null;   


//Start the server
function startServer() {
    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

//Chat message
function handleChat(message) {
    console.log('Handling chat: ' + message); 
    io.emit('chat',message);
}

//Handle announcements
function announce(message) {
  console.log('Announcement: ' + message);
  io.emit('chat',message);
}

async function handleFetch(route, body, requestType='POST', headers={}) {
  headers['Content-Type'] = 'application/json'
  headers['x-functions-key'] = process.env['APP_KEY']

  console.log('Fetch', apiEndpoint, process.env['APP_KEY'])
  const response = await(await fetch(apiEndpoint + route, {
      method: requestType,
      headers,
      body: JSON.stringify(body)
  })).json()

  //Fail returns error.
  if(!response.result){
    throw Error(response.msg)
  }

  return response
}

async function handleRegister(registerDetails) {
  const response = await handleFetch('/player/register/', registerDetails)
}

async function handleLogin(loginDetails, socket) {
  if(players.has(loginDetails.username) || audience.has(loginDetails.username))
    throw Error('Player already logged into game')

  const response = await handleFetch('/player/login/', loginDetails)

  //Successful login assigns user to server player state
  const username = loginDetails.username
  console.log('Welcome to player ' + username);
  announce('Welcome player ' + username);
  
  let state = 0;
  if(players.size <= 8)
    players.add(username)
  else{
    state = -1
    audience.add(username)
  }
  userData.set(username, {username, state, score: 0})

  usersToSockets.set(username,socket);
  socketsToUsers.set(socket,username);
}

function handlePrompt(prompt) {

}

function handleAnswer(answer) {

}

function handleVote(vote) {

}

function handleNext() {
  console.log(`Progressing game state...`)
  let newState = 'Joining'
  switch(state){
    case GameState.Joining:
      startPrompts()
      newState = 'Prompts'
      break
    case GameState.Prompts:
      endPrompts()
      startAnswers()
      newState = 'Answers'
      break
    case GameState.Answers:
      endAnswers()
      startVotes()
      newState = 'Voting'
      break
    case GameState.Voting:
      endVotes()
      startResults()
      newState = 'Results'
      break
    case GameState.Results:
      endResults()
      startScores()
      newState = 'Scores'
      break
    case GameState.Scores:
      endGame()
      newState = null
      break
    default:
      break
  }
  if(newState)
    state = GameState[newState]
  else
    state = false
  console.log(`Game state is now ${newState}`)
}

function handleError(socket, message, halt) {
  console.log('Error: ' + message);
  socket.emit('fail',message);
  if(halt) {
      socket.disconnect();
  }
}

function handleAlert(socket, message, halt) {
  console.log('Alert: ' + message);
  socket.emit('alert',message);
  if(halt) {
      socket.disconnect();
  }
}

//Update state of all players
function updateAll() {
  console.log('Updating all players');
  for(let [player,socket] of usersToSockets) {
    console.log('Updating player: ', player)
      updatePlayer(socket);
  }
}

//Update one player
function updatePlayer(socket) {
  const playerName = socketsToUsers.get(socket);
  const thePlayer = players.get(playerName);
  const data = { gameState: state, me: thePlayer, players: Object.fromEntries(players) }; 
  socket.emit('state',data);
}

function startPrompts() {

}

function endPrompts() {

}

function startAnswers() {

}

function endAnswers() {

}

function startVotes() {

}

function endVotes() {

}

function startResults() {
}

function endResults() {
}

function startScores() {
}

function endGame(){
}

//Handle new connection
io.on('connection', socket => { 
  console.log('New connection');

  //Handle on chat message received
  socket.on('chat', message => {
    handleChat(message);
  });

  //Handle disconnection
  socket.on('disconnect', () => {
    console.log('Dropped connection');
  });

  socket.on('register', async registerDetails => {
    console.log('Register event');
    try{
      await handleRegister(registerDetails)
      handleAlert(socket, `Registered user ${registerDetails.username} successfully`)
    }
    catch(error){
      handleError(socket, error.message)
    }
  });

  socket.on('login', async loginDetails => {
    console.log('Login event');
    try{
      await handleLogin(loginDetails, socket)
      updateAll()
      handleAlert(socket, `Logged user ${loginDetails.username} successfully`)
    }
    catch(error){
      handleError(socket, error.message)
    }
  });

  socket.on('prompt', prompt => {
    console.log('prompt event');
  });

  socket.on('answer', answer => {
    console.log('Answer event');
  });

  socket.on('vote', vote => {
    console.log('Vote event');
  });

  socket.on('next', () => {
    console.log('Next event');
    handleNext();
    updateAll();
  });

});

//Start server
if (module === require.main) {
  startServer();
}

module.exports = server;
