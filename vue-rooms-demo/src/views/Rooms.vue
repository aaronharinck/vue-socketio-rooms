<template>
  <div class="hello">
    <router-view></router-view>
    <h1>{{ connectedRoom }}</h1>
    <div v-if="!loggedIn">
      <p>You are not logged in! Please Login {{ enteredName }}</p>
      <p v-if="loginError">{{ loginError }}</p>
      <form @submit.prevent="">
        <label for="user-name">Username</label>
        <input
          id="user-name"
          name="user-name"
          type="text"
          @keyup.enter="logIn"
          v-model.trim="enteredName"
        />
        <button @click="logIn">Connect</button>
      </form>
    </div>
    <div v-if="loggedIn">
      <p>{{ turn }}, {{ enteredName }}</p>
      <ul>
        <li v-for="clientName in clientNames" :key="clientName">
          {{ clientName }}
        </li>
      </ul>
      <p>
        <button @click="chat('chat from button')">
          Send chat message to server
        </button>
      </p>
      <p>
        <button @click="createRoom('room1')">
          Create a room
        </button>
      </p>
      <div
        class="roomCard"
        v-for="room in rooms"
        :key="room.name"
        @click="joinRoom(room.name)"
      >
        {{ room.name }}
        <!-- room users -->
        <!-- <span v-for="user in Object.values(room.users)" :key="user">
          {{ " " + user }}
        </span> -->
        <!-- show amount of users -->
        <p>{{ Object.values(room.users).length }} / 8</p>
      </div>
    </div>
  </div>
</template>

<script>
import io from "socket.io-client";
export default {
  name: "Chat",
  data() {
    return {
      socket: {},
      turn: "It's not your turn",
      loggedIn: false,
      enteredName: "",
      id: "",
      loginError: "",
      clientNames: [],
      rooms: "",
      connectedRoom: "Not connected to a room",
    };
  },
  props: {
    msg: String,
  },
  created() {
    // when created - connect socket.io
    this.socket = io.connect(`localhost:3000`);
  },
  mounted() {
    //receive msg from server
    this.socket.on("receiveFromServer", serverMsg => {
      console.log(`received from server: ${serverMsg}`);
    });

    //receive approved name from server
    this.socket.on("name", id => {
      this.loggedIn = true;
      this.id = id;
    });

    //receiveErrors
    this.socket.on("name-error", error => {
      this.loginError = error;
    });

    //send connection msg to server
    this.socket.emit("establishedConnection", `hi from Vue!`);

    // check for turn
    this.socket.on("getTurn", receivedData => {
      this.checkForTurn(receivedData);
    });

    // show connected clients
    this.socket.on("connectedClients", clientNames => {
      this.showConnectedClients(clientNames);
    });

    //show all rooms
    this.socket.on("allRooms", rooms => {
      this.showAllRooms(rooms);
    });

    this.socket.on("joinedRoom", roomName => {
      this.connectedRoom = roomName;
    });

    // Room specific emits
    this.socket.on("roomEntered", data => {
      console.log(data);
    });
  },
  methods: {
    logIn() {
      this.socket.emit("name", `${this.enteredName}`);
    },
    chat(msg) {
      this.socket.emit("msg", `${msg}`);
      let turnData = { action: "played", value: "Hearts" };
      this.socket.emit("sendTurn", turnData);
    },
    checkForTurn(receivedData) {
      console.log("test " + receivedData);
    },
    showConnectedClients(clientNames) {
      this.clientNames = clientNames;
    },
    showAllRooms(rooms) {
      this.rooms = rooms;
    },
    //You can create a room by letting someone join a room which does not exist
    createRoom() {
      this.socket.emit("createRoom");
    },
    //Join a room that already exists
    joinRoom(roomName) {
      this.socket.emit("joinRoom", roomName);
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.roomCard {
  padding: 20px;
  background: greenyellow;
  cursor: pointer;
}
</style>
