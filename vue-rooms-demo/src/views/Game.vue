<template>
  <div class="game-container" v-if="gameLoaded">
    <h3 class="game-title">Game {{ gameId }}</h3>
    <ul v-if="connectedUsers" class="game-players">
      <li
        v-for="connectedUser in connectedUsers"
        :key="connectedUser"
        class="game-player"
        :class="checkUsernameForClass(connectedUser)"
      >
        {{ connectedUser }}<br />
        {{ 12 }} cards
      </li>
    </ul>
    <p>
      Minimum: {{ getRequiredCardValue }}
      {{
        lastPlayedCards
          ? lastPlayedCards.length > 1
            ? `(${lastPlayedCards.length} cards)`
            : ""
          : ""
      }}
    </p>
    <div class="board">
      <div class="lastPlayedCards">
        <!-- <p>Last played cards</p> -->
        <div
          class="card"
          v-for="(lastPlayedCard, index) in lastPlayedCards"
          :key="index"
        >
          {{ lastPlayedCard.suit }} {{ lastPlayedCard.value }}
        </div>
      </div>
      <div class="ownPlayedCards">
        <div
          v-for="(ownPlayedCard, index) in ownPlayedCards"
          :key="ownPlayedCard.suit + ownPlayedCard.value"
          @click="removeOwnPlayedCard(ownPlayedCard, index)"
          class="card filled"
        >
          {{ ownPlayedCard.suit }} {{ ownPlayedCard.value }}
        </div>
      </div>
    </div>
    <button
      class="button board-confirm-button"
      v-if="yourTurn"
      @click="confirmTurn()"
    >
      confirm turn
    </button>
    <p>Your cards:</p>
    <div v-if="cards" class="cards">
      <div
        class="card"
        v-for="(card, index) in cards"
        :key="card.suit + card.value"
        @click="tryToPlayCard(card, index)"
      >
        {{ card.suit }} {{ card.value }}
      </div>
    </div>
    <!-- <p>{{ turn }} {{ enteredName }}</p> -->
  </div>
  <div v-else-if="!gameId">
    <p>Game could not be found</p>
    <router-link class="button button-secondary" :to="{ name: 'home' }"
      >Back to home</router-link
    >
  </div>
  <p v-else>Game is loading...</p>
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
      gameLoaded: false,
      connectedUsers: {},
      gameId: this.$route.params.gameId,
      cards: [],
      ownPlayedCards: [],
      lastPlayedCards: [],
      turn: "",
      activeTurn: "Aaron",
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
      // reset playedCards
      let playedCards = undefined;
      this.connectedUsers = receivedUsers;
      console.log("new game started!");
      this.lastPlayedCards = playedCards;
      this.gameLoaded = true;
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
      if (username) {
        console.log(`played by ${username}`);
      }
    });

    // handle turns
    this.socket.on("turn", turnInfo => {
      this.getTurn(turnInfo);
    });
  },

  computed: {
    getRequiredCardValue() {
      let minValue;
      // check if there are lastPlayedCards
      if (this.lastPlayedCards) {
        this.lastPlayedCards.forEach(lastPlayedCard => {
          //check if there already is a minValue
          minValue ? "" : (minValue = lastPlayedCard.value);
          //check if minValue needs to be replaced by a higher value
          CARD_VALUE_MAP[minValue] < CARD_VALUE_MAP[lastPlayedCard.value]
            ? (minValue = lastPlayedCard.value)
            : "";
        });
      }
      return minValue;
    },
    activeTurnClass() {
      return {
        active: this.activeTurn,
      };
    },
  },

  methods: {
    //user plays a card
    tryToPlayCard(card, index) {
      let validPlay = false;
      if (this.yourTurn) {
        // check if it should conform to previously played card(s)
        if (
          // NOTE: this.lastPlayedCards (a Proxy) will give true even if it's empty, add extra Object.keys().length check
          this.lastPlayedCards &&
          Object.keys(this.lastPlayedCards).length > 0
        ) {
          console.log(Object.keys(this.lastPlayedCards.length));
          console.log(this.lastPlayedCards); // gives a proxy with an empty array
          console.log("there are playedCards");

          //check if played card is valid
          //If cardValue is equal or higher than the required value (will be undefined on the first turn & skip if-check)
          if (
            CARD_VALUE_MAP[card.value] >=
              CARD_VALUE_MAP[this.getRequiredCardValue] ||
            CARD_VALUE_MAP[card.value] === 2
          ) {
            validPlay = this.checkCardsForSameValue(card);
            console.log(validPlay);
          }
        } else {
          // if there were no card(s) played last round, play any card

          // if there are ownPlayedCards, check if the played card values are the same
          if (this.ownPlayedCards.length > 0) {
            validPlay = this.checkCardsForSameValue(card);
          } else {
            // if there is only 1 played card, who does not need to conform with a card played last round
            validPlay = true;
          }
        }
        if (validPlay) {
          this.playCard(validPlay, card, index);
        }
      }
    },

    // check if the played cards have the same value
    checkCardsForSameValue(card) {
      let validPlay = false; // define a var to keep track if play is valid
      validPlay = true; // start with true, so you can set it to false when one value fails
      // NOTE: there won't be ownPlayedCards when adding the first card
      this.ownPlayedCards.forEach(ownPlayedCard => {
        // check if the card value is not equal (or 2) to ownPlayedCards
        if (
          card.value !== ownPlayedCard.value &&
          CARD_VALUE_MAP[card.value] !== 2 &&
          CARD_VALUE_MAP[ownPlayedCard.value] !== 2
        ) {
          // if the value is different, block the card from being added
          console.log("Invalid play, cards not the same value");
          validPlay = false;
        }
      });

      return validPlay;
    },

    // user card was succesfully validated (client side)
    playCard(validPlay, card, index) {
      if (validPlay) {
        // if validPlay, remove card from playerDeck and add to ownPlayedCards
        this.cards.splice(index, 1);
        this.ownPlayedCards.push(card);
        this.socket.emit("playCard", this.gameId, card);
        console.log(this.ownPlayedCards);
      }
    },

    // remove a card that was not confirmed yet
    removeOwnPlayedCard(card, index) {
      this.ownPlayedCards.splice(index, 1);
      this.cards.push(card);
      this.socket.emit("removedCard", this.gameId, card);
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
        !this.lastPlayedCards ||
        this.lastPlayedCards.length <= this.ownPlayedCards.length ||
        this.ownPlayedCards.length === 0
      ) {
        this.socket.emit("confirmTurn", this.gameId, this.ownPlayedCards);
        this.yourTurn = false;
        this.ownPlayedCards = [];
      }
    },

    // get first
    checkUsernameForClass(username) {
      if (username === "Aaron") {
        return "playingUser";
      }
    },
  },
};
</script>

<style scoped>
.game-title {
  padding: 0.5rem;
  margin: 0.5rem;
}

.playingUser {
  color: var(--colorWhite);
  background: var(--colorSecondary);
  padding: 2rem;
  border-radius: 1rem;
}

.game-players {
  padding: 0;
  list-style-type: none;
  display: flex;
  justify-content: space-evenly;
  max-width: 100rem;
  margin: 0 auto;
  flex-wrap: wrap;
  align-items: center;
}

.game-player {
  max-width: 30%;
  margin: 0.8rem 2rem;
}

.board-confirm-button {
  color: var(--colorWhite);
  font-weight: bold;
}

/* BOARD */
.board {
  display: flex;
  margin: 0 auto;
  justify-content: center;
}

.game-container p {
  padding: 0.5rem;
  margin: 0.5rem;
}

.lastPlayedCards {
  display: flex;
  margin: 0 2rem;
}

.lastPlayedCards .card {
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}

.ownPlayedCards {
  display: flex;
  margin: 0 2rem;
}

.ownPlayedCards .card {
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}

/* CARDS */
.cards {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.card {
  border: 0.2rem solid var(--colorBlack);
  border-radius: 1rem;
  padding: 4rem 2.4rem;
  margin: 2rem;
  cursor: pointer;
  font-size: var(--fontMedium);
  min-width: 8.6rem;
  max-width: 100%;
}

.filled {
  background: var(--colorWhite);
}

@media screen and (max-width: 550px) {
  .game-player {
    max-width: 30%;
    margin: 1rem;
  }
}

/* https://css-tricks.com/snippets/css/orientation-lock/ */
@media screen and (min-width: 320px) and (max-width: 767px) and (orientation: portrait) {
  .game-container {
    transform: rotate(-90deg);
    transform-origin: left top;
    width: 100vh;
    height: 100vw;
    overflow-x: hidden;
    position: absolute;
    top: 100%;
    left: 0;
  }
}
</style>
