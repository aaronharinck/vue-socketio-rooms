<template>
  <div>
    <h3>Game {{ $route.params.gameId }}</h3>
    <p>Game is loading...</p>
    <ul v-if="connectedUsers">
      <li v-for="connectedUser in connectedUsers" :key="connectedUser">
        {{ connectedUser }}
      </li>
    </ul>
    <p>Randomly shuffled cards:</p>
    <ul v-if="cards">
      <li v-for="card in cards" :key="card">
        {{ card.suit }} {{ card.value }}
      </li>
    </ul>
    <p>----</p>
    <ul v-if="cards">
      <li v-for="card in cards" :key="card">
        {{ card }}
      </li>
    </ul>
    <!-- <p>{{ turn }} {{ enteredName }}</p> -->
  </div>
</template>

<script>
export default {
  inject: ["socket"],
  data() {
    return {
      connectedUsers: {},
      cards: [],
    };
  },
  mounted() {
    // check for turn
    // this.socket.on("getTurn", receivedData => {
    // //   this.checkForTurn(receivedData);
    // });

    // check if game ready
    this.socket.on("gameReady", receivedUsers => {
      this.connectedUsers = receivedUsers;
    });

    // get cards
    this.socket.on("cards", cards => {
      console.log(cards);
      this.cards = cards;
    });
  },
  methods: {
    // checkForTurn(receivedData) {
    //   console.log("test " + receivedData);
    // },
  },
};
</script>
