import Asteroids from "./asteroids/asteroids";

const canvas = document.getElementById("canvas");

const game = new Asteroids(canvas);

game.start();
