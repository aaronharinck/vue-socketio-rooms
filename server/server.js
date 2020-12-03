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
const RandomName = require("./s_scripts/randomName.js");

http.listen(port, () => {
  console.log(`Listening at port ${port}...`);
});

//init connected clients
const clients = {};

//init rooms
const rooms = {
  room2: {
    name: "President Clifford",
    users: { QYMUxUdRy6iILgbtAAAP: "Dirk" },
  },
};

const createRoom = room => {};

/*--- Functions ---*/
// calculate all current connected clients
const calcConnectedClients = () => {
  let nameSummary = [];
  Object.values(clients).forEach(client => {
    client.name ? nameSummary.push(client.name) : "";
  });
  console.log(nameSummary);
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
  socket.on("createRoom", roomName => {
    //check if the room does not already exist and user is logged in
    if (rooms[roomName] || !socket.username) {
      console.log(
        "failed to create new room, it already exists or you are not logged in"
      );
      // emit an error
      return;
    }
    //if the roomName does not exist, socket.join will create a new room
    socket.join(roomName);

    //socket.rooms will contain multiple rooms because each socket automatically joins a room identified by its id as a default room
    console.log(socket.rooms);

    //add it to our own room object and pass an empty default users object
    rooms[roomName] = { name: roomName, users: {} };

    /* view all the rooms
    console.log(rooms);
    console.log(io.sockets.adapter.rooms);
    */

    //emit an event that we created a room to the creator
    //this should redirect the user to the created room in front-end
    socket.emit("createdRoom", roomName);

    //because a new room was created, send an event with updated rooms
    io.emit("allRooms", rooms);

    console.log(socket.rooms);
    console.log(rooms[roomName]);
  });

  //join a room
  socket.on("joinRoom", roomName => {
    //check if room already exsists and if user is logged in
    if (roomName in rooms && socket.username) {
      socket.join(roomName);
      console.log(`${socket.username} joined ${roomName}`);
      //add joined user to our rooms object
      rooms[roomName].users[socket.id] = socket.username; //{ room1: { name: 'room1', users: { QYMUxUdRy6iILgbtAAAP: 'Aaron' } } }
      io.to(roomName).emit(
        "roomEntered",
        `${socket.username} has joined ${roomName}`
      );
      console.log(rooms);
      return socket.emit("joinedRoom", roomName);
    } else {
      return socket.emit("err", `Can't find room ${roomName}`);
    }
  });

  //communicate with the room only (send message with name that comes from socket.id)
  socket.on("sendToRoom", (roomName, message) => {
    io.in(roomName).emit("toRoom", {
      message: message,
      name: rooms[roomName].users[socket.id],
    });
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
    //remove rooms that client was in
    console.log(rooms);
    getUserRooms(socket).forEach(roomName => {
      console.log(`${socket.id} has left ${roomName}`);
      //delete user from rooms object
      delete rooms[roomName].users[socket.id];
    });
    console.log(rooms);
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
