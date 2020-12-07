<template>
  <main>
    <router-view></router-view>
    <!-- <Rooms msg="Pass the room" /> -->
  </main>
</template>

<script>
// import Rooms from "./views/Rooms.vue";
import io from "socket.io-client";
export default {
  name: "App",
  // components: {
  //   Rooms,
  // },

  data() {
    return {
      socket: {},
    };
  },
  created() {
    // when created - connect socket.io
    // this.socket = io.connect(`localhost:3000`);
  },

  //provide socket instance to children
  provide() {
    return { socket: io.connect(`localhost:3000`) };
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
