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
        v-for="ownPlayedCard in ownPlayedCards"
        :key="ownPlayedCard.suit + ownPlayedCard.value"
      >
        {{ ownPlayedCard.suit }}{{ ownPlayedCard.value }}
      </div>
    </div>
    <p>Your cards: (Required value = {{ getRequiredCardValue }})</p>
    <div v-if="cards">
      <div
        v-for="(card, index) in cards"
        :key="card.suit + card.value"
        @click="tryToPlayCard(card, index)"
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
      ownPlayedCards: [],
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
  },
};
</script>
