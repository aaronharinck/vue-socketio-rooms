<template>
  <div>
    <h3>President: Room {{ room }}</h3>
    <p>
      <span class="bold">Share this link to invite your friends!</span> <br />{{
        `${shareLink}`
      }}
    </p>
    <ul class="lobby-user-list">
      <li v-for="user in users" :key="user" class="lobby-user-listitem">
        {{ user }}
      </li>
    </ul>
    <button class="button" @click="startGame(room)">
      Everyone is connected, Start game!
    </button>
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
      users: {},
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

    this.socket.on("getRoomUsers", users => {
      this.users = users;
      console.log(users);
      console.log(users.name);
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

<style scoped>
button.button {
  border: 0;
  color: var(--colorWhite);
  font-weight: bold;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}

.lobby-user-list {
  max-width: 96rem;
  margin: 3rem auto;
  padding: 0;
  list-style-type: none;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.lobby-user-listitem {
  background: var(--colorMain);
  padding: 2rem;
  font-size: var(--fontMedium);
  border-radius: 1rem;
  max-width: 100%;
}
</style>
