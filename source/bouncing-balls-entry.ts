import BouncingBalls from "./bouncing-balls";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const game = new BouncingBalls(canvas);

game.start();
