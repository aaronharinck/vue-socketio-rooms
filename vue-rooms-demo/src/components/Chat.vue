<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <div v-if="!loggedIn">
      <p>You are not logged in! Please Login {{ enteredName }}</p>
      <p v-if="loginError">{{ loginError }}</p>
      <input type="text" @keyup.enter="logIn" v-model="enteredName" />
      <button @click="logIn">Connect</button>
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
  },
  methods: {
    logIn() {
      console.log(this.enteredName);
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
</style>
