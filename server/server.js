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
  console.log(socket.username);
  console.log(room.currentTurn);
  console.log(room.playerTurn);
  console.log(room.users.hasOwnProperty(socket.id));

  // check if there is a currentTurn property & requested by the previous player
  if (
    (room.currentTurn || room.currentTurn === 0) &&
    room.users.hasOwnProperty(socket.id)
  ) {
    let usersArr = Object.keys(room.users);
    // trace the turn to a player (e.g. turn 5 with 4 players => playerTurn will be 0 again)
    let newTurnUserArrPos = room.currentTurn++ % usersArr.length;
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
    if (
      roomName &&
      rooms[roomName].playerTurn &&
      rooms[roomName].playerTurn === socket.id
    ) {
      console.log("played cards: " + playedCards);
      console.log(playedCards);
      socket.in(nextTurn(rooms[roomName], socket)).emit("turn", "your turn");
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
