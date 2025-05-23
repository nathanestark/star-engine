import { vec2, vec3, quat } from "gl-matrix";

import Game from "../core/game";
import { default as InputController, CONTROLLER_ACTION } from "../core/input-controller";
import Resources from "../core/resources";
import Camera from "./default-camera";
import TextHud from "../canvas-2d/huds/text-hud";
import FPSHud from "../canvas-2d/huds/fps-hud";
import ObjectCountHud from "./object-count-hud";
import CollisionDetection from "../canvas-2d/collision-detection/collision-detection";
import Ship from "./ship";
import Asteroid from "./asteroid";
import WorldBounds from "./world-bounds";
import CenteredHud from "./centered-hud";
import DataHud from "./data-hud";
import GameObject from "source/core/game-object";
import * as Math2D from "source/canvas-2d/math-2d";

export default class Asteroids extends Game {
    resources: Resources;
    worldBounds: WorldBounds;
    cStage: number;
    cLives: number;
    cScore: number;
    spawnInterval: NodeJS.Timeout;
    ship: Ship;
    stage: TextHud;
    lives: TextHud;
    score: TextHud;
    centeredHud: CenteredHud;
    camera: Camera;
    controller: InputController;

    constructor(canvas: HTMLCanvasElement) {
        super();

        this.debug = false;

        this.resources = new Resources();

        this.setTimeScale(1);

        this.worldBounds = new WorldBounds({
            position: vec2.fromValues(-500, -500),
            size: vec2.fromValues(1000, 1000)
        });

        this.cStage = 1;
        this.cLives = 3;
        this.cScore = 0;
        this.spawnInterval = null;

        this.ship = null;

        this.stage = new TextHud({
            textSize: 20,
            textColor: "#f00",
            text: "Stage: 1",
            position: vec2.fromValues(10, 55)
        });
        this.lives = new TextHud({
            textSize: 20,
            textColor: "#f00",
            text: "Lives: 3",
            position: vec2.fromValues(10, 85)
        });
        this.score = new TextHud({
            textSize: 20,
            textColor: "#f00",
            text: "Score: 0",
            position: vec2.fromValues(10, 115)
        });

        this.centeredHud = new CenteredHud();
        const dataHud = new DataHud();
        dataHud.children = [
            new FPSHud({ position: vec2.fromValues(10, 10) }),
            new ObjectCountHud({ position: vec2.fromValues(10, 25) }),
            this.stage,
            this.lives,
            this.score,
            this.centeredHud
        ];

        const collisionDetection = new CollisionDetection([
            this.worldBounds.position,
            this.worldBounds.size
        ]);

        const worldObjects: Array<GameObject> = [this.worldBounds];

        this.camera = new Camera(canvas, { zoom: 1 });

        canvas.addEventListener("contextmenu", function (e) {
            e.preventDefault();
            return false;
        });

        // Add everything into the game. Order matters for both updates and draws.

        // Then world objects
        this.addGameObjects(worldObjects);

        // Then collider
        this.addGameObject(collisionDetection);

        // Then huds
        this.addGameObject(dataHud);

        // Then cameras.
        this.addGameObject(this.camera);

        this.controller = new InputController();
        this.addInputController(this.controller);

        this.controller.registerDevice(
            "keyboard",
            (triggerCall) => {
                document.addEventListener("keydown", triggerCall);
                document.addEventListener("keyup", triggerCall);
            },
            function (event: KeyboardEvent) {
                return {
                    key: event.key,
                    value: event.type == "keydown"
                };
            }
        );

        this.controller.registerDevice(
            "mouse",
            (triggerCall) => {
                document.addEventListener("mousedown", triggerCall);
                document.addEventListener("mouseup", triggerCall);
            },
            function (event: MouseEvent) {
                return {
                    key: `${event.button}`,
                    value: event.type == "mousedown"
                };
            }
        );

        // Load images.
        this.resources
            .load([
                { type: "image", path: "images/asteroid.png", names: ["asteroid"] },
                { type: "image", path: "images/ships.png", names: ["ship"] }
            ])
            .then(() => {
                // Once everything is loaded, we can populate the game.
                this.startGame();
            });
    }

    spawnAsteroids() {
        let numAsteroids = 2 + this.cStage;

        let destroy: null | ((parent: Asteroid) => void) = null;

        for (let x = 0; x < numAsteroids; x++) {
            const mass = 50;
            const radius = 50;

            const position3D = vec3.fromValues(
                1,
                this.worldBounds.size[0] / 2 - radius,
                this.worldBounds.size[1] / 2 - radius
            );
            const rotQuat = quat.identity(quat.create());
            quat.rotateZ(rotQuat, rotQuat, Math.random() * Math.PI * 2);
            vec3.transformQuat(position3D, position3D, rotQuat);

            const position = vec2.fromValues(position3D[0], position3D[1]);
            // Make sure we are inside our boundaries
            const spawnBox = Math2D.inflateBoundingBox(
                [
                    this.worldBounds.position,
                    vec2.add(vec2.create(), this.worldBounds.position, this.worldBounds.size)
                ],
                radius
            );

            vec2.max(position, position, spawnBox[0]);
            vec2.min(position, position, spawnBox[1]);

            this.addGameObject(
                new Asteroid({
                    radius: radius,
                    mass: mass,
                    position: position,
                    image: this.resources.get("asteroid").image,
                    velocity: vec2.fromValues(
                        (numAsteroids / 3) * 50 * (1 - Math.random() * 2),
                        (numAsteroids / 3) * 50 * (1 - Math.random() * 2)
                    ),

                    color: "white",
                    onDestroyed: (obj: Asteroid) => {
                        destroy(obj);
                    }
                })
            );
        }

        // When an asteroid dies, we get points and smaller asteroids spawn!
        destroy = (parent: Asteroid) => {
            this.cScore += parent.radius;
            this.score.text = "Score: " + this.cScore;

            // Spawn some more.
            let newMass = 5;
            if (parent.mass <= 5) return;
            else if (parent.mass == 50) newMass = 20;

            for (let x = 0; x < 3; x++) {
                const vel = vec2.clone(parent.velocity);
                vec2.add(
                    vel,
                    vel,
                    vec2.fromValues(50 * (1 - Math.random() * 2), 50 * (1 - Math.random() * 2))
                );
                this.addGameObject(
                    new Asteroid({
                        mass: newMass,
                        radius: newMass,
                        position: vec2.clone(parent.position),
                        velocity: vel,
                        image: parent.image,
                        onDestroyed: (parent) => {
                            destroy(parent);
                        }
                    })
                );
            }
        };
    }

    spawnShip(on: boolean) {
        if (on && this.ship == null) {
            // Add player ship.
            let destroy: null | (() => void) = null;

            this.ship = new Ship({
                name: "Player 1",
                image: {
                    image: this.resources.get("ship").image,
                    clipSize: vec2.fromValues(50, 50),
                    rotation: Math.PI / 2,
                    animations: {
                        thrust: {
                            framesPerSecond: 10,
                            image: this.resources.get("ship").image,
                            rotation: Math.PI / 2,
                            clipSize: vec2.fromValues(50, 50),
                            clipPosition: vec2.fromValues(0, 50),
                            frameSpacing: vec2.fromValues(0, 50),
                            frames: 9,
                            repeatMethod: "loop"
                        }
                    }
                },
                onDestroyed: () => {
                    destroy();
                }
            });
            this.addGameObject(this.ship).then(() => {
                this.camera.target = this.ship;
            });

            const fire = this.ship.fire.bind(this.ship);
            const thrust = this.ship.thrust.bind(this.ship);
            const rotateCounterClockwise = this.ship.rotateCounterClockwise.bind(this.ship);
            const rotateClockwise = this.ship.rotateClockwise.bind(this.ship);

            this.controller.bindCommand({ device: "mouse", key: "0" }, CONTROLLER_ACTION, fire);
            this.controller.bindCommand(
                { device: "keyboard", key: "w" },
                CONTROLLER_ACTION,
                thrust
            );
            this.controller.bindCommand(
                { device: "keyboard", key: "a" },
                CONTROLLER_ACTION,
                rotateCounterClockwise
            );
            this.controller.bindCommand(
                { device: "keyboard", key: "d" },
                CONTROLLER_ACTION,
                rotateClockwise
            );

            destroy = () => {
                this.ship = null;
                this.cLives--;
                this.lives.text = "Lives: " + this.cLives;

                this.controller.unbindCommand(
                    { device: "mouse", key: "0" },
                    CONTROLLER_ACTION,
                    fire
                );
                this.controller.unbindCommand(
                    { device: "keyboard", key: "w" },
                    CONTROLLER_ACTION,
                    thrust
                );
                this.controller.unbindCommand(
                    { device: "keyboard", key: "a" },
                    CONTROLLER_ACTION,
                    rotateCounterClockwise
                );
                this.controller.unbindCommand(
                    { device: "keyboard", key: "d" },
                    CONTROLLER_ACTION,
                    rotateClockwise
                );

                if (this.cLives > 0) {
                    setTimeout(() => {
                        const fireMsg = new TextHud({
                            textSize: 40,
                            textColor: "#f00",
                            text: "Press Fire to Spawn",
                            justify: "center",
                            position: vec2.fromValues(0, 0)
                        });
                        this.addGameObject(fireMsg, this.centeredHud).then(() => {
                            const fireToSpawn = (on: boolean) => {
                                if (on) {
                                    this.removeGameObject(fireMsg);
                                    this.controller.unbindCommand(
                                        { device: "mouse", key: "0" },
                                        CONTROLLER_ACTION,
                                        fireToSpawn
                                    );

                                    this.spawnShip(on);
                                }
                            };

                            this.controller.bindCommand(
                                { device: "mouse", key: "0" },
                                CONTROLLER_ACTION,
                                fireToSpawn
                            );
                        });
                    }, 1000);
                } else {
                    clearInterval(this.spawnInterval);
                    // Show game over.
                    const gameOver = new TextHud({
                        textSize: 40,
                        textColor: "#f00",
                        text: "Game Over",
                        justify: "center",
                        position: vec2.fromValues(0, 0)
                    });
                    this.addGameObject(gameOver, this.centeredHud).then((obj) => {
                        let restart: () => void = null;
                        restart = () => {
                            this.removeGameObject(obj);
                            this.controller.unbindCommand(
                                { device: "mouse", key: "0" },
                                CONTROLLER_ACTION,
                                restart
                            );

                            this.startGame();
                        };
                        setTimeout(() => {
                            this.controller.bindCommand(
                                { device: "mouse", key: "0" },
                                CONTROLLER_ACTION,
                                restart
                            );
                        }, 1000);
                    });
                }
            };
        }
    }

    startGame() {
        this.cStage = 1;
        this.cLives = 3;
        this.cScore = 0;
        this.stage.text = "Stage: " + this.cStage;
        this.lives.text = "Lives: " + this.cLives;
        this.score.text = "Score: " + this.cScore;

        // Make sure everything is cleared out.
        this.filter("asteroid", "bullet").forEach((obj) => {
            this.removeGameObject(obj);
        });

        const fireMsg = new TextHud({
            textSize: 40,
            textColor: "#f00",
            text: "Press Fire to Spawn",
            justify: "center",
            position: vec2.fromValues(0, 0)
        });
        this.addGameObject(fireMsg, this.centeredHud);

        const fireToSpawn = (on: boolean) => {
            if (on) {
                this.removeGameObject(fireMsg);
                this.controller.unbindCommand(
                    { device: "mouse", key: "0" },
                    CONTROLLER_ACTION,
                    fireToSpawn
                );

                this.spawnShip(on);
            }
        };

        this.controller.bindCommand({ device: "mouse", key: "0" }, CONTROLLER_ACTION, fireToSpawn);

        this.spawnAsteroids();

        this.spawnInterval = setInterval(this.nextStageCheck.bind(this), 1000);
    }

    nextStageCheck() {
        // Check if we should spawn a new stage.
        if (this.filter("asteroid").length == 0) {
            clearInterval(this.spawnInterval);
            this.cStage++;
            this.stage.text = "Stage: " + this.cStage;

            const stageMsg = new TextHud({
                textSize: 40,
                textColor: "#f00",
                text: "Stage " + this.cStage,
                justify: "center",
                position: vec2.fromValues(0, 0)
            });
            this.addGameObject(stageMsg, this.centeredHud);

            setTimeout(() => {
                this.removeGameObject(stageMsg);

                this.spawnAsteroids();
                this.spawnInterval = setInterval(this.nextStageCheck.bind(this), 1000);
            }, 3000);
        }
    }

    /*
    onGameObjectRemoved(obj) {
        if(obj == this.ship) {
            this.ship = null;
        }
    }
  */
}
