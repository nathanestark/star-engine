import Asteroids from "./asteroids";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const game = new Asteroids(canvas);

game.start();
