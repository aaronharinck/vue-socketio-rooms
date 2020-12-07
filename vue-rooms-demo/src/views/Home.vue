<template>
  <div>
    <h1>Play Presidents</h1>
    <router-link class="button" :to="{ name: 'rooms' }">Play</router-link>
    <!-- <Rooms /> -->
  </div>
</template>

<script>
// import Rooms from "./Rooms.vue";

export default {
  //   components: {
  //     Rooms,
  //   },
};
</script>

<style scoped>
a.button {
  margin: 2rem;
  text-decoration: none;
  color: white;
  font-size: 1.8rem;
}

.button {
  padding: 1rem 2rem;
  background: green;
  margin: 2rem;
}
</style>
