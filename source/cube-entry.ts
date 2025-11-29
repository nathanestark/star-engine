import Cube from "./cube";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const game = new Cube(canvas);

game.start();
