<template>
  <div>
    <h3>Game {{ $route.params.gameId }}</h3>
    <p v-if="!cards">Game is loading...</p>
    <ul v-if="connectedUsers">
      <li v-for="connectedUser in connectedUsers" :key="connectedUser">
        {{ connectedUser }}
      </li>
    </ul>
    <div class="board">
      <button v-if="yourTurn" @click="confirmTurn()">confirm turn</button>
      <div
        v-for="playedCard in playedCards"
        :key="playedCard.suit + playedCard.value"
      >
        {{ playedCard.suit }}{{ playedCard.value }}
      </div>
    </div>
    <p>Randomly shuffled cards:</p>
    <div v-if="cards">
      <div
        v-for="card in cards"
        :key="card.suit + card.value"
        @click="playCard(card)"
      >
        {{ card.suit }} {{ card.value }}
      </div>
    </div>
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
      playedCards: [],
      turn: "",
      yourTurn: false,
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

    // get turn
    this.socket.on("turn", msg => {
      console.log(msg);
    });

    // get cards
    this.socket.on("cards", cards => {
      console.log(cards);
      this.cards = cards;
    });

    // play cards
    this.socket.on("playedCard", (player, card) => {
      console.log(`${player} played ${card.suit}${card.value}`);
    });

    this.socket.on("turn", turnInfo => {
      this.getTurn(turnInfo);
    });
  },
  methods: {
    //user plays a card
    playCard(card) {
      this.socket.emit("playCard", this.$route.params.gameId, card);
      this.playedCards.push(card);
    },

    // get turn
    getTurn(turnInfo) {
      if (turnInfo === "your turn") {
        this.yourTurn = true;
      }
    },

    // confirm turn and send to server
    confirmTurn() {
      this.socket.emit(
        "confirmTurn",
        this.$route.params.gameId,
        this.playedCards
      );
      this.yourTurn = false;
      this.playedCards = [];
    },
  },
};
</script>
