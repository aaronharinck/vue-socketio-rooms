// start express
const express = require("express");
const expressApp = express();
const http = require("http").Server(expressApp); // http is part of node but we require it for socket.io
// init socket.io
// const io = require("socket.io")(http) does not work anymore, you need to handle CORS (if you want a seperated back & front-end);
const io = require("socket.io")(http, {
  cors: {
    origin: ["http://localhost:8080", process.env.ORIGIN], // or * for allowing all sites
    methods: ["GET", "POST"],
  },
});
const port = process.env.PORT || 3000;

// load other scripts
const Validate = require("./s_scripts/validate.js");
const GetRandom = require("./s_scripts/getRandom.js");
const Game = require("./s_scripts/game.js");

http.listen(port, () => {
  console.log(`Listening at port ${port}...`);
});

//init connected clients
const clients = {};

//init rooms
const rooms = {
  room2: {
    name: "room2",
    users: { QYMUxUdRy6iILgbtAAAP: "Dirk" },
  },
};

const createRoom = room => {};

/*--- Functions ---*/
// calculate all current connected clients
const calcConnectedClients = () => {
  let nameSummary = [];
  Object.values(clients).forEach(client => {
    client.username ? nameSummary.push(client.username) : "";
  });
  console.log(`Connected users: ${nameSummary}`);
  io.emit("connectedClients", nameSummary);
};

// get all rooms the user is in
const getUserRooms = socket => {
  // convert rooms object to an array with Object.entries
  // get all roomNames, name: key, room:value
  return Object.entries(rooms).reduce((roomNames, [roomName, room]) => {
    if (room.users[socket.id]) {
      //if the room contains the user, push it to the roomNames array
      roomNames.push(roomName);
    }
    return roomNames;
  }, []);
};

/*--- Game Functions ---*/
const nextTurn = (room, socket) => {
  /* roomObj: {
  name: 'George-Bush-Senior-CQTQP',
  users: {
    qv0450HiS1GwD2wFAAAF: 'Aaron',
    wT3B21u2AF77WBshAAAJ: 'Jef',
    'kpM85q-Uskq6Zy1YAAAL': 'Dirk'
  } } */

  console.log("___socket.username____");
  console.log(socket.username + " " + room.playerTurn);
  console.log(room.currentTurn);

  // check if there is a currentTurn property & requested by the previous player
  if (
    (room.currentTurn || room.currentTurn === 0) &&
    room.users.hasOwnProperty(socket.id)
  ) {
    let usersArr = Object.keys(room.users);
    console.log(`room.currentTurn: ${room.currentTurn}`);
    // trace the turn to a player (e.g. turn 5 with 4 players => playerTurn will be 0 again)
    let newTurnUserArrPos = room.currentTurn++ % usersArr.length;
    console.log(`room.currentTurn++: ${room.currentTurn}`);
    // set the playerTurn to the next player
    room.playerTurn = usersArr[newTurnUserArrPos];
    console.log("-----");
    console.log(room.playerTurn);
    console.log(`${room.currentTurn} is the turn, ${room.playerTurn} can play`);
    return room.playerTurn;
  } else if (room && room.users.hasOwnProperty(socket.id)) {
    // start turns
    room.currentTurn = 0;
    console.log(room.users);
    console.log(room.currentTurn);
    let usersArr = Object.keys(room.users);
    let newTurnUserArrPos = room.currentTurn++ % usersArr.length;
    room.playerTurn = usersArr[newTurnUserArrPos];
    //room.playerTurn = Object.keys(room.users)[room.currentTurn];
    console.log(
      `${room.currentTurn} is the turn, ${room.playerTurn} can start`
    );
    return room.playerTurn;
  }
  console.log("can't trigger nextTurn: Room or user not found");
};

const checkForNewRound = (room, socket) => {
  // check how many consecutive passed turns there are
  if (!room.consecutivePassedTurns) {
    // if there is no consecutivePassedTurn property, create one
    room.consecutivePassedTurns = 1;
  } else {
    //if there is a consecutivePassedTurns property, increment by 1
    room.consecutivePassedTurns++;
  }

  // if every user passed, create a new round
  if (Object.keys(room.users).length === room.consecutivePassedTurns) {
    // if there is no lastUserWhoPlayed because nobody played a card & everyone passed, set it to the first user
    if (!room.lastUserWhoPlayed) {
      room.lastUserWhoPlayed = Object.keys(room.users)[0];
    }
    console.log(`New round required, ${room.lastUserWhoPlayed} can start!`);
    // reset consectuivePassedRounds, currentTurn & playerTurn
    room.consecutivePassedTurns = 0;
    console.log("index lastUserWhoPlayed:");
    console.log(Object.keys(room.users).indexOf(room.lastUserWhoPlayed.id));
    room.playerTurn = room.lastUserWhoPlayed.id;
    // add +1 on currentTurn, because we won't use nextTurn() function to create our first new turn
    room.currentTurn =
      Object.keys(room.users).indexOf(room.lastUserWhoPlayed.id) + 1;
    console.log("room.playerTurn: " + room.playerTurn);
    console.log("room.currentTurn: " + room.currentTurn);

    // return a value to let the code know a newRound was created and it should give the turn to the lastUserWhoPlayed
    return room.lastUserWhoPlayed.id;
  }
};

const checkForNewGame = (roomName, socket, playedCards) => {
  // check if a new game is needed by comparing the finished users amount and total users
  if (
    rooms[roomName].finishedUsersAmount ===
    Object.keys(rooms[roomName].users).length
  ) {
    console.log("New game required");
    // create a new game

    // reset stuff from previous round(s) placements, cards, finishedUsersAmount

    // CARDS
    // get a random deck of cards
    let shuffledGameDeck = Game.getShuffledDeck();

    // split the deck evenly between players
    let splitUpDeck = Game.splitUp(
      shuffledGameDeck,
      Object.keys(rooms[roomName].users).length
    );

    // distribute it fairly (for now)
    //give each player cards from the deck (deal cards to president first, because president starts)
    rooms[roomName].finishedUsers.forEach(finishedUserId => {
      clients[finishedUserId].cards = splitUpDeck.shift();
      // don't send specific cards to a specific player yet
      // io.in(clients[userId].id).emit("cards", clients[userId].cards);
    });

    // get roles (president, vice-president, vice-scum, scum)
    let president = rooms[roomName].finishedUsers[0];
    let vicePresident = rooms[roomName].finishedUsers[1];
    let viceScum =
      rooms[roomName].finishedUsers[rooms[roomName].finishedUsers.length - 2];
    let scum =
      rooms[roomName].finishedUsers[rooms[roomName].finishedUsers.length - 1];
    console.log(`president: ${president}`);
    console.log(`vicePresident: ${vicePresident}`);
    console.log(`viceScum: ${viceScum} `);
    console.log(`scum: ${scum}`);

    // distribute cards according to placements
    // last place (scum) must give their two best cards to the president
    giveBestCards(scum, president, 2);
    // second to last place (vice-scum) must give their best card to the vice-president
    giveBestCards(viceScum, vicePresident, 1);
    // second place (vice-president) gives their worst card to the vice-scum
    giveWorstCards(vicePresident, viceScum, 1);
    // first place (president) gives their 2 worst cards to the scum
    giveWorstCards(president, scum, 2);

    rooms[roomName].finishedUsers.forEach((finishedUser, index) => {
      console.log(`${finishedUser} was ${index}`);
      // lose best cards function
      // get best cards function

      /*
      switch(index) {
        case 0:
          // code block
          break;
        case 1:
          // code block
          break;
        default:
          // code block
      }
      */
    });

    // // distribute card according to placements to get last users: array.length - 1
    // rooms[roomName].finishedUsers.forEach((finishedUser, index) => {
    //   console.log(`${finishedUser} was ${index}`);
    // });

    // reset finishedUsers (& start round with president?)
  } else {
    // Game is not finished
  }
};

// losers will have to give up their best cards
const giveBestCards = (from, to, amount) => {
  // loop over cards and remove the best one(s) 2>A>K>Q>J>10..

  // sort cards from highest to lowest
  clients[from].cards.sort((cardA, cardB) => {
    if (Game.CARD_VALUE_MAP[cardA.value] === 2) return -1;
    if (Game.CARD_VALUE_MAP[cardB.value] === 2) return 1;
    if (Game.CARD_VALUE_MAP[cardA.value] < Game.CARD_VALUE_MAP[cardB.value])
      return 1;
    if (Game.CARD_VALUE_MAP[cardA.value] > Game.CARD_VALUE_MAP[cardB.value])
      return -1;
    return 0;
  });

  // remove custom amount of cards and push to other user (start from index 0)
  console.log(`giveBestCards: from: ${from}  to:${to}`);
  console.log("clients[to].cards before splice");
  console.log(clients[to].cards);
  console.log(clients[to].cards.push(...clients[from].cards.splice(0, amount)));
  console.log("clients[to].cards after splice");
  console.log(clients[to].cards);
  console.log("-----");
  //clients[to].cards.push(...(clients[from].cards.splice(0, amount)));

  /*
  // loop over the cards and sort them from high to low
    cards.sort((cardA,cardB) => {
    if(CARD_VALUE_MAP[cardA.value] === 2) return -1;
    if(CARD_VALUE_MAP[cardB.value] === 2) return 1;
    if(CARD_VALUE_MAP[cardA.value] < CARD_VALUE_MAP[cardB.value]) return 1;
    if(CARD_VALUE_MAP[cardA.value] > CARD_VALUE_MAP[cardB.value]) return -1;
    return 0;
});

  // remove custom amount of cards and push to other user (start from index 0)
  cards.splice(0, amount); 

  */

  clients[from].cards.forEach(card => {
    console.log(`${card.value} becomes ${Game.CARD_VALUE_MAP[card.value]}`);
  });
};

// winners can give their worst cards to the losers
const giveWorstCards = (from, to, amount) => {
  // loop over cards and remove the worst one(s) 2>A>K>Q>J>10..

  // sort cards from lowest to highest
  clients[from].cards.sort((cardA, cardB) => {
    if (Game.CARD_VALUE_MAP[cardA.value] === 2) return 1;
    if (Game.CARD_VALUE_MAP[cardB.value] === 2) return -1;
    if (Game.CARD_VALUE_MAP[cardA.value] > Game.CARD_VALUE_MAP[cardB.value])
      return 1;
    if (Game.CARD_VALUE_MAP[cardA.value] < Game.CARD_VALUE_MAP[cardB.value])
      return -1;
    return 0;
  });

  // remove custom amount of cards and push to other user (start from index 0)
  console.log(`giveWorstCards: from: ${from}  to:${to}`);
  console.log("clients[to].cards before splice");
  console.log(clients[to].cards);
  console.log(clients[to].cards.push(...clients[from].cards.splice(0, amount)));
  console.log("clients[to].cards after splice");
  console.log(clients[to].cards);
  console.log("------");
};

/*--- SOCKET.IO ---*/
io.on("connection", socket => {
  //log if a user connected
  console.log(`a user connected: ${socket.id}`);

  //generate userNumber (unique for this connection)
  const randomNum = Math.floor(Math.random() * 10);

  // use [] to use variable name as the property name
  clients[socket.id] = {
    id: socket.id,
  };

  /*-- Rooms --*/
  //create a room
  socket.on("createRoom", () => {
    //stop creation of extra rooms when user is already in one, or if user is not logged in
    if (socket.connectedRoom || !socket.username) {
      console.log(`already linked to a room or user is not logged in`);
      return socket.emit("receiveFromServer", "error creating rooms");
    }
    //get a randomRoomName
    let roomName = GetRandom.randomRoomName(rooms);
    console.log(`Current room count: ${Object.keys(rooms).length}`);

    //check if the room does not already exist (this normally can't happen because randomRoomName should give a unique name)
    if (rooms[roomName]) {
      console.log("failed to create new room, it already exists");
      // emit an error
      return;
    }
    //if the roomName does not exist, socket.join will create a new room
    socket.join(roomName);

    //socket.rooms will contain multiple rooms because each socket automatically joins a room identified by its id as a default room
    console.log(socket.rooms);

    //add it to our own room object and pass an empty default users object
    rooms[roomName] = { name: roomName, users: {} };

    //add creator of the room to the room by default
    rooms[roomName].users[socket.id] = socket.username;

    //create a rooms property to keep track of user rooms
    socket.connectedRoom = rooms[roomName];
    clients[socket.id].connectedRoom = rooms[roomName];

    //emit an event that we created a room to the creator
    //this should redirect the user to the created room in front-end
    socket.emit("createdRoom", roomName);

    //because a new room was created, send an event with updated rooms
    io.emit("allRooms", rooms);
  });

  //join a room
  socket.on("joinRoom", roomName => {
    //check if room already exsists and if user is logged in
    if (roomName in rooms && socket.username) {
      //check if user is already connected to another room
      if (socket.connectedRoom && socket.connectedRoom.name !== roomName) {
        console.log(
          `already connected to another room: ${
            Object.values(socket.connectedRoom)[0]
          }`
        );

        //leave previous connected room with socket.io
        socket.leave(socket.connectedRoom.name);

        //delete from our own rooms object
        delete rooms[socket.connectedRoom.name].users[socket.id];

        //if the previous connected room is empty, delete the room
        if (Object.keys(rooms[socket.connectedRoom.name].users).length === 0) {
          delete rooms[socket.connectedRoom.name];
          //because a room was deleted, send an updated rooms event
          io.emit("allRooms", rooms);
        }

        //delete our connectedRoom attribute
        delete socket.connectedRoom;

        //delete from our clients object
        delete clients[socket.id].connectedRoom;
        io.emit("allRooms", rooms);
      }

      //join a new room
      socket.join(roomName);
      console.log(`${socket.username} joined ${roomName}`);

      //add joined user to our rooms object
      rooms[roomName].users[socket.id] = socket.username; //{ room1: { name: 'room1', users: { QYMUxUdRy6iILgbtAAAP: 'Aaron' } } }
      io.to(roomName).emit(
        "roomEntered",
        `${socket.username} has joined ${roomName}`
      );

      //set our connectedRoom to the room we just joined
      socket.connectedRoom = rooms[roomName];
      clients[socket.id].connectedRoom = rooms[roomName];

      socket.emit("joinedRoom", roomName);
    } else {
      return socket.emit("err", `Can't find room ${roomName}`);
    }
    io.emit("allRooms", rooms);
  });

  //communicate with the room only (send message with name that comes from socket.id)
  socket.on("sendToRoom", (roomName, message) => {
    io.in(roomName).emit("toRoom", {
      message: message,
      name: rooms[roomName].users[socket.id],
    });
  });

  // When a Vue client mounts get a message with the client id from the client.
  socket.on("establishedConnection", message => {
    console.log(message + ` id: ${socket.id}`);
  });
  // send msg to client who has connected
  socket.emit(
    "receiveFromServer",
    "this msg is from the server, you are connected"
  );

  // When the button is pressed send a msg to the client who pressed, and a message to all connected clients
  socket.on("msg", message => {
    console.log(message);
    socket.emit("receiveFromServer", message);
    io.emit("receiveFromServer", message + " to all clients");
  });

  //link name
  socket.on("name", name => {
    //validate the name
    if (name) {
      // trim unwanted characters
      name = name.match(/[A-Z-a-z-0-9]/g);
      // join the array of remaining letters
      name = name.join("");
      console.log(`Sanitized name: ${name}`);
    }
    if (name.length === 0) {
      socket.emit("name-error", "please enter a valid name");
      return;
    } else if (name.length > 20) {
      socket.emit(
        "name-error",
        "Please enter a shorter name (max 20 characters)"
      );
      return;
    }

    // check if name is not already in use
    let nameInUse = false;
    for (const socketId in clients) {
      if (clients.hasOwnProperty(socketId)) {
        const otherClient = clients[socketId];
        if (otherClient.username === name) {
          nameInUse = true;
        }
      }
    }
    if (nameInUse) {
      socket.emit("name-error", "Name is already in use");
      return;
    }

    //Pass name to clients and show users
    clients[socket.id].username = name;
    console.log(clients[socket.id]);
    // You can also add an username attribute to the socket connection instance
    socket.username = name;
    console.log(
      `Socket.username: ${socket.username} ${(clients[
        socket.id
      ].username = name)}`
    );
    socket.emit("name", clients[socket.id]);

    // Get all rooms
    socket.emit("allRooms", rooms);

    // Get all names from clients
    calcConnectedClients();
  });

  // // Add reconnect, if socket.username already exists, log user in
  // if (socket.username) {
  //   socket.emit("name", clients[socket.id]);
  // }

  /*-- Game --*/
  //get all users
  socket.on("getRoomUsers", roomName => {
    io.in(roomName).emit("getRoomUsers", rooms[roomName].users);
  });

  // player clicked "start game" in a room
  socket.on("startGame", roomName => {
    console.log(`player wants ${roomName} to start!`);

    if (roomName && rooms[roomName] && socket.username) {
      console.log(`player started ${roomName}`);
      io.in(roomName).emit("startGame", roomName);

      // start the game
      setTimeout(() => {
        /* handle the game logic */
        // emit an event that starts the game
        io.in(roomName).emit("gameReady", rooms[roomName].users);
        let users = Object.keys(rooms[roomName].users);
        console.log(rooms[roomName].users);
        console.log(users);

        // get a random deck of cards
        let shuffledGameDeck = Game.getShuffledDeck();
        // split the deck evenly between players
        let splitUpDeck = Game.splitUp(shuffledGameDeck, users.length);
        //give each player cards from the deck
        users.forEach(userId => {
          clients[userId].cards = splitUpDeck.shift();
          //send specific cards to a specific player
          io.in(clients[userId].id).emit("cards", clients[userId].cards);
        });

        // initiate first turn
        io.in(nextTurn(rooms[roomName], socket)).emit("turn", "your turn");
      }, 4000);
      console.log("this should come after the cards, but doesn't");
    }
  });

  socket.on("confirmTurn", (roomName, playedCards) => {
    // start by verifying incoming event
    if (
      roomName &&
      rooms[roomName] &&
      rooms[roomName].playerTurn &&
      rooms[roomName].playerTurn === socket.id
    ) {
      console.log("played cards: " + playedCards);
      console.log(playedCards);

      // check if player did not play any cards
      if (playedCards.length === 0) {
        console.log(`${socket.username} Did not play any card, passed a turn`);
        socket.passedLastRound = true;
        console.log(`socket.passedLastRound: ${socket.passedLastRound}`);

        // check if there should be a new round
        if (checkForNewRound(rooms[roomName], socket)) {
          // reset currentTurn & playerTurn & stop code execution
          io.in(rooms[roomName].lastUserWhoPlayed.id).emit("turn", "your turn");
          delete rooms[roomName].lastPlayedCards;
          io.in(rooms[roomName].name).emit(
            "lastPlayedCards",
            rooms[roomName].lastPlayedCards,
            socket.username
          );

          return console.log("start new round");
        }
      } else {
        // there are playedCards: check if they are valid
        // check if they are in user deck, and remove them after
        let removedElements = 0;
        let clientCardsCopy = [...clients[socket.id].cards]; // work on a copy, because we want to validate first
        // remove them from user deck (copy)
        playedCards.forEach(cardPlayed => {
          clientCardsCopy.forEach((card, index) => {
            if (
              card.value === cardPlayed.value &&
              card.suit === cardPlayed.suit
            ) {
              clientCardsCopy.splice(index, 1);
              removedElements++;
            }
          });
        });
        console.log(`playedCards.length: ${playedCards.length}`);
        console.log(`removedElements: ${removedElements}`);
        if (playedCards.length === removedElements) {
          // the played cards were valid
          console.log("all playedCards were valid");
          clients[socket.id].cards = [...clientCardsCopy]; // set the real cards value to the copy

          //because user did not pass, set passedLastRound to false & reset consecutivePassedTurns
          socket.passedLastRound = false;
          rooms[roomName].consecutivePassedTurns = 0;

          // check if player is out of cards
          if (
            clients[socket.id].cards.length === 0 &&
            !clients[socket.id].placement
          ) {
            console.log(
              `${socket.username} has ${
                clients[socket.id].cards.length
              } cards left, user is out of cards!`
            );

            // check the ranking/placement of the player
            if (rooms[roomName].finishedUsersAmount) {
              // There are finished users
              console.log(
                `there are ${rooms[roomName].finishedUsersAmount} finished users`
              );

              // add player to finishedUsersAmount
              rooms[roomName].finishedUsersAmount++;

              //set placement to current finishedUserAmount
              clients[socket.id].placement =
                rooms[roomName].finishedUsersAmount;
              console.log(
                `socket placement after ++ ${clients[socket.id].placement}`
              );
              console.log(
                `finishedUsersAmount after ++ ${rooms[roomName].finishedUsersAmount}`
              );
              console.log(
                `${socket.username} is ${
                  clients[socket.id].placement
                }th out of ${
                  rooms[roomName].finishedUsersAmount
                } finished users`
              );

              // pass finished user to end of finishedUsers property in the room
              rooms[roomName].finishedUsers.push(clients[socket.id].id);

              // check if game is finished
              if (checkForNewGame(roomName, socket, playedCards)) {
                // if a newGame is required, reset it here & stop code execution
                // reset currentTurn & playerTurn, deck...
                io.in(rooms[roomName].name).emit("turn", "your turn");
                return;
              }
            } else {
              // user is the first to finish
              console.log(
                `${clients[socket.id].username} was the first to finish!`
              );
              rooms[roomName].finishedUsersAmount = 1; // set finished amount default to 1
              clients[socket.id].placement =
                rooms[roomName].finishedUsersAmount; // pass placement to user
              rooms[roomName].finishedUsers = [clients[socket.id].id];
            }
          }

          /*
          // check if game is over
          if (checkForNewGame(roomName, socket, playedCards)) {
            // if a newGame is required, reset it here & stop code execution
            // reset currentTurn & playerTurn, deck...
            io.in(rooms[roomName].name).emit("turn", "your turn");
            return;
          }
          */

          // If there is no need for a newGame / newRound: continue normally
        } else {
          // playedCards were not valid
          console.log("invalid playedCards");
          // emit error
          return;
        }
      }

      // send turn event to the next player
      socket.in(nextTurn(rooms[roomName], socket)).emit("turn", "your turn");
      // emit the playedCards for everyone
      if (playedCards && Object.keys(playedCards).length !== 0) {
        // keep track of lastPlayedCards (update when new cards got played)
        console.log("playedCards is truthy: " + playedCards);
        rooms[roomName].lastPlayedCards = playedCards;
        // keep track of who played the last card(s)
        rooms[roomName].lastUserWhoPlayed = socket;
      }
      io.in(rooms[roomName].name).emit(
        "lastPlayedCards",
        rooms[roomName].lastPlayedCards,
        socket.username
      );
    }
  });

  // player played a card
  socket.on("playCard", (roomName, card) => {
    console.log(socket.username);
    console.log(roomName);
    console.log(card);
    io.in(roomName).emit("playedCard", socket.username, card);
  });

  //turns
  socket.on("sendTurn", turnData => {
    console.log(turnData);
    console.log(`user-action: ${turnData.action}`);
    io.emit(
      "getTurn",
      `player ${socket.id} has ${turnData.action} ${turnData.value} with randomNum ${randomNum}`
    );
  });

  /*-- DISCONNECT --*/
  //remove socket if client disconnected
  socket.on("disconnect", () => {
    //remove rooms that client was in
    getUserRooms(socket).forEach(roomName => {
      console.log(`${socket.id} has left ${roomName}`);
      //delete user from rooms object
      delete rooms[roomName].users[socket.id];
      //delete room if there are 0 users
      if (Object.keys(rooms[roomName].users).length === 0) {
        delete rooms[roomName];
        //because a room was deleted, send an updated rooms event
        io.emit("allRooms", rooms);
      }
    });
    console.log(
      `A user (${socket.id} ${
        clients[socket.id].username ? clients[socket.id].username : ""
      }) disconnected `
    );

    //delete user from clients
    delete clients[socket.id];
    calcConnectedClients();
    io.emit("allRooms", rooms);
  });
});
