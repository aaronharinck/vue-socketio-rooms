<template>
  <div>
    <h3>Game {{ $route.params.gameId }}</h3>
    <!-- <p>{{ turn }} {{ enteredName }}</p> -->
  </div>
</template>

<script>
export default {
  inject: ["socket"],
  mounted() {
    // check for turn
    // this.socket.on("getTurn", receivedData => {
    // //   this.checkForTurn(receivedData);
    // });
  },
  methods: {
    // checkForTurn(receivedData) {
    //   console.log("test " + receivedData);
    // },
  },
};
</script>
