import { createRouter, createWebHistory } from "vue-router";

import NotFound from "./views/NotFound.vue";
import Game from "./views/Game.vue";
import Rooms from "./views/Rooms.vue";
import Home from "./views/Home.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: Home },
    {
      name: "rooms",
      path: "/rooms",
      meta: { needsAuth: true },
      components: { default: Rooms },
      children: [
        {
          name: "game",
          path: ":game",
          component: Game,
          props: true,
        },
      ],
    },
    { path: "/:notFound(.*)", component: NotFound },
  ],
});

//navigation guards
router.beforeEach((to, from, next) => {
  console.log("Global beforeEach");
  console.log(to, from);
  if (to.meta.needsAuth) {
    console.log("Needs auth!");
    next();
  } else {
    next();
  }
});

/*
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // { path: '/', component: TeamsList }, // default route
    { path: "/", redirect: "/teams" }, // redirect route
    //{ path: '/teams', component: TeamsList, alias: '/' }, // ALIAS
    {
      name: "teams",
      path: "/teams",
      meta: { needsAuth: true },
      components: { default: TeamsList, footer: TeamsFooter },
      children: [
        {
          name: "team-members",
          path: ":teamId",
          component: TeamMembers,
          props: true,
        },
      ],
    }, // our domain.com/teams => TeamsList
    {
      path: "/users",
      components: { default: UsersList, footer: UsersFooter },
      beforeEnter(to, from, next) {
        console.log("users beforeEnter");
        console.log(to, from, next);
        next();
      },
    },

    { path: "/:notFound(.*)", component: NotFound },
  ],
  linkActiveClass: "active",
  //set scroll behavior
  scrollBehavior(_, _2, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { left: 0, top: 0 };
  },
});

//navigation guards
router.beforeEach((to, from, next) => {
  console.log("Global beforeEach");
  console.log(to, from);
  if (to.meta.needsAuth) {
    console.log("Needs auth!");
    next();
  } else {
    next();
  }
});

*/

export default router;
