<template>
  <div>
    <h3>Game {{ gameId }}</h3>
    <p v-if="!cards">Game is loading...</p>
    <ul v-if="connectedUsers">
      <li v-for="connectedUser in connectedUsers" :key="connectedUser">
        {{ connectedUser }}
      </li>
    </ul>
    <div class="board">
      <div>
        <p>Last played cards</p>
        <p></p>
        <div v-for="(lastPlayedCard, index) in lastPlayedCards" :key="index">
          {{ lastPlayedCard.suit }}{{ lastPlayedCard.value }}
        </div>
      </div>
      <button v-if="yourTurn" @click="confirmTurn()">confirm turn</button>
      <div
        v-for="playedCard in playedCards"
        :key="playedCard.suit + playedCard.value"
      >
        {{ playedCard.suit }}{{ playedCard.value }}
      </div>
    </div>
    <p>Your cards:</p>
    <div v-if="cards">
      <div
        v-for="(card, index) in cards"
        :key="card.suit + card.value"
        @click="playCard(card, index)"
      >
        {{ card.suit }} {{ card.value }}
      </div>
    </div>
    <!-- <p>{{ turn }} {{ enteredName }}</p> -->
  </div>
</template>

<script>
const CARD_VALUE_MAP = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export default {
  inject: ["socket"],
  data() {
    return {
      connectedUsers: {},
      gameId: this.$route.params.gameId,
      cards: [],
      playedCards: [],
      lastPlayedCards: [],
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

    // get starting cards
    this.socket.on("cards", cards => {
      console.log(cards);
      this.cards = cards;
    });

    // play cards
    this.socket.on("playedCard", (player, card) => {
      console.log(`${player} played ${card.suit}${card.value}`);
    });
    this.socket.on("lastPlayedCards", (lastPlayedCards, username) => {
      this.lastPlayedCards = lastPlayedCards;
      console.log(`played by ${username}`);
    });

    // handle turns
    this.socket.on("turn", turnInfo => {
      this.getTurn(turnInfo);
    });
  },
  methods: {
    //user plays a card
    playCard(card, index) {
      let validPlay = false;
      if (this.yourTurn) {
        // check if card can be played
        if (this.lastPlayedCards.length > 0) {
          console.log("there are playedCards");
          this.lastPlayedCards.forEach(lastPlayedCard => {
            console.log(
              `played card: ${card.value}, lastPlayedCard: ${lastPlayedCard.value}`
            );
            // check if the value of the newly played card is valid
            if (
              CARD_VALUE_MAP[card.value] >=
                CARD_VALUE_MAP[lastPlayedCard.value] ||
              parseInt(card.value) === 2
            ) {
              validPlay = true;
              console.log("valid" + card.value + "" + lastPlayedCard.value);
            } else {
              validPlay = false;
            }
          });
          if (validPlay) {
            // if valid, remove card from playerDeck
            this.cards.splice(index, 1);
            this.playedCards.push(card);
            this.socket.emit("playCard", this.gameId, card);
          }
        } else {
          // if there were no card(s) played last round, play any card
          this.cards.splice(index, 1);
          this.playedCards.push(card);
          this.socket.emit("playCard", this.gameId, card);
        }
      }
    },

    // get turn
    getTurn(turnInfo) {
      if (turnInfo === "your turn") {
        this.yourTurn = true;
      }
    },

    // confirm turn and send to server
    confirmTurn() {
      // check if the amount of played cards is equal or higher
      if (
        this.lastPlayedCards.length <= this.playedCards.length ||
        this.playedCards.length === 0
      ) {
        this.socket.emit("confirmTurn", this.gameId, this.playedCards);
        this.yourTurn = false;
        this.playedCards = [];
      }
    },
  },
};
</script>
