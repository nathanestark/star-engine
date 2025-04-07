import { vec2 } from "gl-matrix";

import Game from "../core/game";
import Camera from "./default-camera";
import FPSHud from "../canvas-2d/huds/fps-hud";
import ObjectCountHud from "./object-count-hud";
import Gravity from "./gravity";
import CollisionDetection from "../canvas-2d/collision-detection/collision-detection";
import Ball from "./ball";
import WorldBounds from "./world-bounds";

export default class BouncingBalls extends Game {
    constructor(canvas) {
        super();

        this.debug = false;

        this.setTimeScale(10);

        const worldBounds = new WorldBounds({
            position: vec2.fromValues(-250, -250),
            size: vec2.fromValues(10000, 10000)
        });

        const hudData = {
            children: [
                new FPSHud({ position: vec2.fromValues(10, 10) }),
                new ObjectCountHud(this, { position: vec2.fromValues(10, 25) })
            ],
            draw: function (tDelta, camera, context) {
                // HUDs should be drawn relative to the canvas.
                context.setTransform(1, 0, 0, 1, 0, 0);
            }
        };

        const gravity = new Gravity(this, { g: -9.8 });
        const collisionDetection = new CollisionDetection(this, [
            vec2.copy(vec2.create(), worldBounds.position),
            vec2.copy(vec2.create(), worldBounds.size)
        ]);

        const game = this;

        const worldObjects = {
            children: [worldBounds]
        };

        let balls = 100;
        let bX = Math.floor(Math.sqrt(balls));
        let bY = Math.ceil(balls / bX);
        let padX = worldBounds.size[0] / bX;
        let padY = worldBounds.size[1] / bY;
        let tBalls = 0;

        for (let x = 0; x < bX && balls > tBalls; x++) {
            for (let y = 0; y < bY && balls > tBalls; y++) {
                let r = 1; //Math.random();
                worldObjects.children.push(
                    new Ball(game, {
                        radius: r * 100,
                        mass: r,
                        elasticity: 0.8,
                        rollDrag: 0.05,
                        position: vec2.fromValues(
                            worldBounds.position[0] + padX / 2 + x * padX,
                            worldBounds.position[1] + padY / 2 + y * padY
                        ),
                        velocity: vec2.fromValues(
                            10 * (1 - Math.random() * 2),
                            10 * (1 - Math.random() * 2)
                        ),
                        //velocity: vec2.fromValues(0,0),

                        color: tBalls == 0 ? "white" : "red"
                    })
                );
                tBalls++;
            }
        }

        const camera = new Camera(canvas, {
            position: vec2.scaleAndAdd(vec2.create(), worldBounds.position, worldBounds.size, 0.5),
            zoom: 0.05
        });

        const cameras = {
            children: [camera]
        };

        canvas.addEventListener("contextmenu", function (e) {
            e.preventDefault();
            return false;
        });

        // Add everything in to the game. Order matters for both updates and draws.

        // Then world objects
        this.addGameObject(worldObjects);

        // Then gravity
        this.addGameObject(gravity);

        // Then collider
        this.addGameObject(collisionDetection);

        // Then huds
        this.addGameObject(hudData);

        // Then cameras.
        this.addGameObject(cameras);
    }
}
