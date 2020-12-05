// start express
const express = require("express");
const expressApp = express();
const http = require("http").Server(expressApp); // http is part of node but we require it for socket.io
// init socket.io
// const io = require("socket.io")(http) does not work anymore, you need to handle CORS (if you want a seperated back & front-end);
const io = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
  },
});
const port = process.env.PORT || 3000;

// load other scripts
const Validate = require("./s_scripts/validate.js");
const GetRandom = require("./s_scripts/getRandom.js");

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

  socket.on("msg", message => {
    console.log(message + "io");
  });

  // When the button is pressed send a msg to the client who pressed, and a message to all connected clients
  socket.on("msg", message => {
    console.log(message + " socket");
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

  //remove id if client disconnected
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

  //turns
  socket.on("sendTurn", turnData => {
    console.log(turnData);
    console.log(`user-action: ${turnData.action}`);
    io.emit(
      "getTurn",
      `player ${socket.id} has ${turnData.action} ${turnData.value} with randomNum ${randomNum}`
    );
  });
});
