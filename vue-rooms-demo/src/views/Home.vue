<template>
  <div class="container container-home">
    <h1 class="title title-home">Cardjes</h1>
    <p class="subtitle subtitle-home">
      Online cardgame made with socket.io, VueJS & ❤️
    </p>
    <img
      alt="Cardjes logo"
      src="../assets/cardjeslogo.png"
      width="659"
      height="535"
      class="container-home__img"
    />
    <div class="button-container">
      <router-link class="button button-secondary" :to="{ name: 'rules' }"
        >How to play</router-link
      >
      <router-link class="button bold" :to="{ name: 'rooms' }"
        >Play President
        <span class="button--extra">4-8 players</span></router-link
      >
    </div>

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
.container {
  display: flex;
  flex-flow: column;
  align-items: center;
}

.title-home {
  margin-bottom: 1rem;
}

.subtitle-home {
  margin: 1rem 0 4rem 0;
  font-weight: bold;
}

.container-home__img {
  max-width: 30rem;
  height: auto;
}

.button-container {
  margin-top: 1rem;
  display: flex;
  flex-flow: column;
}

.button-container .button {
  margin: 1rem 0 0.5rem 0;
}

.button--extra {
  padding-left: 2.5rem;
  font-weight: normal;
}

.bold {
  font-weight: bold;
}
</style>
