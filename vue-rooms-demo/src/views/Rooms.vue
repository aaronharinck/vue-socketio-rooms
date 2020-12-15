<template>
  <div class="hello">
    <router-view></router-view>
    <h1>Create or join a room</h1>
    <div v-if="!loggedIn" class="login-container">
      <p>You are not logged in! Please Login. <br />{{ enteredName }}</p>
      <p v-if="loginError">{{ loginError }}</p>
      <form @submit.prevent="" class="login-form">
        <label for="user-name">Username</label>
        <input
          id="user-name"
          name="user-name"
          type="text"
          @keyup.enter="logIn"
          v-model.trim="enteredName"
        />
        <button class="button" @click="logIn">Connect</button>
      </form>
    </div>
    <div v-if="loggedIn">
      <ul>
        <li v-for="clientName in clientNames" :key="clientName">
          {{ clientName }}
        </li>
      </ul>
      <p>
        <!-- <button class="button" @click="chat('chat from button')">
          Send chat message to server
        </button> -->
      </p>
      <p>
        <button
          v-if="!createdRoom"
          class="button button-rooms"
          @click="createRoom()"
        >
          Create a new room
        </button>
      </p>
      <div class="roomCards-container">
        <div
          class="roomCard"
          v-for="room in rooms"
          :key="room.name"
          @click="joinRoom(room.name)"
        >
          <span class="roomCard-name">{{ room.name }}</span>
          <!-- room users -->
          <!-- <span v-for="user in Object.values(room.users)" :key="user">
          {{ " " + user }}
        </span> -->
          <!-- show amount of users -->
          <p class="roomCard-userCount">
            {{ Object.values(room.users).length }} / 8
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import io from "socket.io-client";
export default {
  inject: ["socket"],
  name: "Rooms",
  data() {
    return {
      //   socket: {},
      loggedIn: false,
      enteredName: "",
      id: "",
      loginError: "",
      clientNames: [],
      rooms: "",
      connectedRoom: "Not connected to a room",
      createdRoom: false,
    };
  },
  props: {
    msg: String,
  },
  //   created() {
  //     // when created - connect socket.io
  //     this.socket = io.connect(`localhost:3000`);
  //   },
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
      this.$router.push({ name: "room", params: { room: roomName } });
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
    showConnectedClients(clientNames) {
      this.clientNames = clientNames;
    },
    showAllRooms(rooms) {
      this.rooms = rooms;
    },
    //You can create a room by letting someone join a room which does not exist
    createRoom() {
      this.socket.emit("createRoom");
      this.createdRoom = true;
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
/* LOGIN */
.login-container {
  max-width: 96rem;
  margin: 0 auto;
  align-items: center;
}

.login-form {
  display: flex;
  flex-flow: column;
  max-width: 30rem;
  margin: 0 auto;
}

.login-form label {
  text-align: left;
}

.login-form input {
  padding: 1rem;
}

.login-form button.button {
  border: 0;
  padding: 1rem;
  color: var(--colorWhite);
  margin: 1rem 0;
  font-weight: bold;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}

/* END LOGIN */

.button-rooms {
  color: var(--colorWhite);
  font-weight: bold;
}

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
  padding: 2rem;
  background: var(--colorMain);
  cursor: pointer;
  max-width: 100%;
  margin: 1rem 2rem;
  border-radius: 2rem;
}

.roomCard-name {
  font-weight: bold;
}

.roomCard-userCount {
  margin: 1rem;
}

.roomCards-container {
  max-width: 96rem;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

@media screen and (max-width: 550px) {
  .roomCards-container {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>
