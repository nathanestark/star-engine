import BouncingBalls from "./bouncing-balls/bouncing-balls";

const canvas = document.getElementById("canvas");

const game = new BouncingBalls(canvas);

game.start();
