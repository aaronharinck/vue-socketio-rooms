<template>
  <div class="container container-rules">
    <router-link class="button button-secondary" :to="{ name: 'home' }"
      >Back to home</router-link
    >
    <h2 class="title title-rules">How to play</h2>
    <div class="rule">
      <p class="subtitle subtitle-rule">
        Goal
      </p>
      <p class="rule-text">
        The goal is to get rid of all of your cards.
      </p>
    </div>
    <div class="rule">
      <p class="subtitle subtitle-rule">
        How to play cards
      </p>
      <p class="rule-text">
        You can only play cards of the same or higher value than the previous
        card(s). You must at least match the same amount of the previously
        played cards.
      </p>
    </div>
    <div class="rule">
      <p class="subtitle subtitle-rule">
        Card values
      </p>
      <p class="rule-text">
        <span class="rule-text--bold">From high to low:</span> A > K > Q > J >
        10 > 9 > 8 >7 > 6 > 5 > 4 > 3 > 2
      </p>
      <p class="rule-text">
        2 is a “joker” card and can be used on top of all other cards <br />
        (example: J,J,2 will count as three J’s)
      </p>
      <p class="rule-text">
        2's can also be used on own, and are always valid. But they will reset
        the previous required value: example: On an (8), a person plays a (2)
        which can be beaten by (3 or higher) again
      </p>
    </div>
    <div class="rule">
      <p class="subtitle subtitle-rule">
        Passing turns
      </p>
      <p class="rule-text">
        Passing is allowed (when you can or can't play any cards, use this to
        your strategical advantage) and does not prevent you from playing the
        next turn.
      </p>
    </div>
    <div class="rule">
      <p class="subtitle subtitle-rule">
        Rankings
      </p>
      <ul class="rankings-list">
        <li>
          <span class="bold">First place: President</span> (will get the Scums
          best two cards)
        </li>
        <li class="rule-text">
          <span class="bold">Second place: Vice-president</span> (will get the
          Vice-scums best card)
        </li>
        <li class="rule-text">
          <span class="bold">Second-last place: Vice-scum</span> (will get the
          Vice-president worst card)
        </li>
        <li class="rule-text">
          <span class="bold">Last place: Scum</span> ((will get the president’s
          worst two cards))
        </li>
      </ul>
    </div>
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

.container-rules {
  margin: 0 auto;
  max-width: 96rem;
}

.title-rules {
  margin-bottom: 1rem;
}

.subtitle-rule {
  margin: 2.4rem 0 0.5rem 0;
  font-weight: bold;
}

.rule-text {
  margin: 0.5rem;
  max-width: 70rem;
}

.rule-text--bold {
  font-weight: bold;
}

.rankings-list {
  list-style-type: none;
}

.button--extra {
  padding-left: 2.5rem;
  font-weight: normal;
}

.bold {
  font-weight: bold;
}
</style>
