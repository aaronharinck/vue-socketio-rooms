<template>
  <div>
    <h3>President: Room {{ room }}</h3>
    <button>Start game</button>
    <p>{{ `${shareLink}` }}</p>
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
  created() {
    // // when created - connect socket.io
    // this.socket = io.connect(`localhost:3000`);
  },
};
</script>
