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
:root {
  --colorWhite: white;
  --colorLightest: #f6f0ed;
  --colorBlack: black;
  --colorMain: #7692ff;
  --colorSecondary: #2e294e;
  --colorRed: #dc0428;
  --spacerTiny: 0.6rem;
  --spacerSmall: 1.2rem; /* 12px */
  --spacerRegular: 1.6rem; /* 16px */
  --spacerBig: 3rem; /* 30px */
  --fontSmall: 1.4rem; /* 14px */
  --fontRegular: 1.6rem; /* 16px */
  --fontMedium: 2rem; /* 20px */
  --fontBig: 2.4rem; /* 24px */
}

html {
  font-size: 62.5%;
  box-sizing: border-box;
  min-height: 100vh;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  color: var(--colorBlack);
  font-size: var(--fontRegular);
  line-height: 1.5;
  min-height: 100vh;
  background: var(--colorLightest);
}

img {
  max-width: 100%;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  margin-top: 1rem;
}

a.button {
  margin: 2rem;
  text-decoration: none;
  color: white;
  font-size: 1.8rem;
}

.button {
  border: 0;
  border-radius: 25rem;
  padding: 1.5rem 3.5rem;
  background: var(--colorSecondary);
  margin: 2rem;
}

.button + .button {
  margin: 0rem;
}

a.button-secondary {
  background: var(--colorMain);
  color: var(--colorBlack);
}

.button-secondary {
  background: var(--colorMain);
  color: var(--colorBlack);
}
</style>
