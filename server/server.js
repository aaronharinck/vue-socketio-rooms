// start express
const express = require("express");
const expressApp = express();
const http = require("http").Server(expressApp); // http is part of node but we require it for socket.io
// init socket.io
// const io = require("socket.io")(http);
const io = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
  },
});
const port = process.env.PORT || 3000;

// load other scripts
const Validate = require("./s_scripts/validate.js");

http.listen(port, () => {
  console.log(`Listening at port ${port}...`);
});

//init connected clients
const clients = {};

//init rooms
const rooms = {};

const createRoom = room => {};

// Functions
// calculate all current connected clients
const calcConnectedClients = () => {
  let nameSummary = [];
  Object.values(clients).forEach(client => {
    client.name ? nameSummary.push(client.name) : "";
  });
  console.log(nameSummary);
  io.emit("connectedClients", nameSummary);
};

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
  socket.on("createRoom", roomName => {
    //if the roomName does not exist, socket.join will create a new room
    socket.join(roomName);
    //socket.rooms will contain multiple rooms because each socket automatically joins a room identified by its id as a default room
    console.log(socket.rooms);

    //{room: "room"}
    //rooms[roomName] = roomName;

    //{room: "room", users: {}}
    rooms[roomName] = { name: roomName, users: {} };

    console.log(rooms);
    // console.log(roomName);
    console.log(io.sockets.adapter.rooms);
    // console.log(socket.rooms);
    socket.emit("createdRoom", roomName);
    io.emit("allRooms", rooms);
    console.log(rooms[roomName]);
  });

  //join a room
  socket.on("joinRoom", roomName => {
    if (roomName in rooms) {
      socket.join(roomName);
      console.log(`joined ${roomName}`);
      io.to(roomName).emit(
        "roomEntered",
        `${socket.username} has joined ${roomName}`
      );
      return socket.emit("joinedRoom", roomName);
    } else {
      return socket.emit("err", `Can't find room ${roomName}`);
    }
  });

  //join a room
  // socket.on("joinRoom", roomName => {
  //   if (rooms.includes(roomName)) {
  //     socket.join(roomName);
  //     return socket.emit("joinedRoom", roomName);
  //   } else {
  //     return socket.emit("err", `Can't find room ${roomName}`);
  //   }
  // });

  // When a Vue client mounts get a message with the client id.
  socket.on("establishedConnection", message => {
    console.log(message + ` id: ${socket.id}`);
  });

  socket.on("msg", message => {
    console.log(message + "io");
  });

  // When the button is pressed send a msg to the client who pressed, and a message to all connected clients
  socket.on("msg", message => {
    console.log(message + " socket");
    socket.emit("receiveFromServer", message);
    io.emit("receiveFromServer", message + " to all clients");
  });

  // send msg to client who has connected
  socket.emit(
    "receiveFromServer",
    "this msg is from the server, you are connected"
  );

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
        if (otherClient.name === name) {
          nameInUse = true;
        }
      }
    }
    if (nameInUse) {
      socket.emit("name-error", "Name is already in use");
      return;
    }

    //Pass name to clients and show users
    clients[socket.id].name = name;
    console.log(clients[socket.id]);
    // You can also add an username attribute to the socket connection instance
    socket.username = name;
    console.log(`Socket.username: ${socket.username}`);
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
    console.log(
      `A user (${socket.id} ${
        clients[socket.id].name ? clients[socket.id].name : ""
      }) disconnected `
    );

    //console.log(clients);
    delete clients[socket.id];
    calcConnectedClients();
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

  const test = () => {
    //   console.log(socket.rooms);
    //   socket.join("room1");
    //   console.log(socket.rooms);
    //   // each client gets an id from socket.io, we can use it here
    //   clients[socket.id] = {
    //     id: socket.id,
    //   };
    //   // delete the id on disconnect
    //   socket.on("disconnect", () => {
    //     console.log(`A user (${clients[socket.id].name}) disconnected `);
    //     delete clients[socket.id];
    //   });
    //   // listen for login (name)
    //   socket.on("name", name => {
    //     console.log(`unSanitized name: ${name}`);
    //     if (name) {
    //       // trim unwanted characters
    //       name = name.match(/[A-Z-a-z-0-9]/g);
    //       // join the array of remaining letters
    //       name = name.join("");
    //       console.log(`Sanitized name: ${name}`);
    //     }
    //     if (name.length === 0) {
    //       socket.emit("name-error", "please enter a valid name");
    //       return;
    //     }
    //     // check if name is not already in use
    //     let nameInUse = false;
    //     for (const socketId in clients) {
    //       if (clients.hasOwnProperty(socketId)) {
    //         const otherClient = clients[socketId];
    //         if (otherClient.name === name) {
    //           nameInUse = true;
    //         }
    //       }
    //     }
    //     if (nameInUse) {
    //       socket.emit("name-error", "name is already in use");
    //       return;
    //     }
    //     clients[socket.id].name = name;
    //     console.log(clients[socket.id]);
    //     socket.emit("name", clients[socket.id]);
    //   });
    //   // listen for msg
    //   socket.on("chat message", message => {
    //     console.log(`received: ${message}`);
    //     // send message back to everyone who is connected
    //     if (clients[socket.id].name) {
    //       io.sockets.emit("chat message", clients[socket.id], message);
    //       io.emit("currentTime", currentTime.getCurrentTime(Date.now()));
    //     }
    //   });
  };
});
