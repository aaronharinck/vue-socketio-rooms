<template>
  <div>
    <h3>President: Room {{ room }}</h3>
    <button @click="startGame(room)">Start game</button>
    <p>Share this link to invite your friends! <br />{{ `${shareLink}` }}</p>
  </div>
</template>

<script>
//send request to socket.io to confirm room is real

//display connected room lobby
//start game button

export default {
  props: ["room"],
  inject: ["socket"],
  data() {
    return {
      shareLink: window.location,
    };
  },
  mounted() {
    this.socket.emit("getRoomUsers", this.room);
    console.log(`the room is ${this.room}`);
    // // when created - connect socket.io
    // this.socket = io.connect(`localhost:3000`);
    this.socket.on("receiveFromServer", serverMsg => {
      console.log(`received from server: ahaha ${serverMsg}`);
    });

    //server could send a startGame event
    this.socket.on("startGame", roomName => {
      this.$router.push({ name: "game", params: { gameId: roomName } });
    });
  },
  methods: {
    startGame(room) {
      console.log(`clicked = ${room}`);
      //send an event to the server that the game can start
      this.socket.emit("startGame", room);
    },
  },
};
</script>
