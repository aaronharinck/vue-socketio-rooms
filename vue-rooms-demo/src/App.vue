<template>
  <main>
    <main>
      <router-view></router-view>
    </main>
    <!-- <Rooms msg="Pass the room" /> -->
  </main>
</template>

<script>
// import Rooms from "./views/Rooms.vue";

export default {
  name: "App",
  // components: {
  //   Rooms,
  // },
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
