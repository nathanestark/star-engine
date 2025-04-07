import { vec2 } from "gl-matrix";

import Game from "../core/game";
import Camera from "./default-camera";
import FollowCamera from "./follow-camera";
import FPSHud from "../canvas-2d/huds/fps-hud";
import ObjectCountHud from "./object-count-hud";
import Gravity from "./gravity";
// import Collider from './collider';
// import Body from './body';

import RandomWorldObjects from "./random-system";
// import ResonenceWorldObjects from './resonence-system';
// import SolarSystemObjects from './solar-system';
// import Generator, { PregeneratedSystem as PregeneratedSystemObjects } from './system-generator';

export default class SolarSystem extends Game {
    constructor(canvases) {
        super();

        this.setTimeScale(0); //3153600);

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

        const gravity = new Gravity(this);
        const actionData = {
            children: [
                gravity /*,
                new Collider(this)*/
            ]
        };

        //        const worldObjects = new SolarSystemObjects(gravity).objects;
        const worldObjects = new RandomWorldObjects(gravity).objects;
        //        const worldObjects = new ResonenceWorldObjects(gravity).objects;
        //        const worldObjects = new PregeneratedSystemObjects(new Generator().generateSystem()).objects;
        worldObjects.childrenSort = (camera, children) => {
            // Sort children by view depth.
            let ret = children.slice();

            ret.sort((a, b) => {
                if (camera.view == "x") {
                    return a.position[2] - b.position[2];
                } else if (camera.view == "y") {
                    return a.position[1] - b.position[1];
                } else if (camera.view == "z") {
                    return a.position[0] - b.position[0];
                }
            });

            return ret;
        };

        // Determine initial zoom based on objects in scene.
        const maxX = worldObjects.children.reduce(
            (p, o) => Math.max(p, Math.abs(o.position[0]) + o.radius),
            0
        );
        const maxY = worldObjects.children.reduce(
            (p, o) => Math.max(p, Math.abs(o.position[1]) + o.radius),
            0
        );
        const maxZ = worldObjects.children.reduce(
            (p, o) => Math.max(p, Math.abs(o.position[2]) + o.radius),
            0
        );

        const zoomX = Math.min(canvases[0].width / maxX, canvases[0].height / maxY);
        const zoomY = Math.min(canvases[1].width / maxX, canvases[1].height / maxZ);
        const zoomZ = Math.min(canvases[2].width / maxY, canvases[2].height / maxZ);

        const camera1 = new Camera(canvases[0], { view: "x", zoom: zoomX });
        const fCamera1 = new FollowCamera(canvases[0], { view: "x", zoom: zoomX, disabled: true });
        const camera2 = new Camera(canvases[1], { view: "y", zoom: zoomY });
        const fCamera2 = new FollowCamera(canvases[1], { view: "y", zoom: zoomY, disabled: true });
        const camera3 = new Camera(canvases[2], { view: "z", zoom: zoomZ });
        const fCamera3 = new FollowCamera(canvases[2], { view: "z", zoom: zoomZ, disabled: true });

        fCamera1.isDisabled = fCamera2.isDisabled = fCamera3.isDisabled = true;

        const cameras = {
            children: [camera1, fCamera1, camera2, fCamera2, camera3, fCamera3]
        };

        let target = null;
        const pos = [0, 0];
        document.addEventListener("mousedown", (e) => {
            e.target.focus();
            if (e.button == 2) {
                target = e.target;
                pos[0] = e.pageX;
                pos[1] = e.pageY;

                e.preventDefault();
                return false;
            }
        });

        document.addEventListener("mouseup", (e) => {
            if (e.button == 2) {
                target = null;

                e.preventDefault();
                return false;
            }
        });

        document.addEventListener("mousemove", (e) => {
            let camera = null;
            let fCamera = null;
            if (target == canvases[0]) {
                camera = camera1;
                fCamera = fCamera1;
            } else if (target == canvases[1]) {
                camera = camera2;
                fCamera = fCamera2;
            } else if (target == canvases[2]) {
                camera = camera3;
                fCamera = fCamera3;
            }
            if (camera != null && !camera.isDisabled) {
                camera.position[0] -= (e.pageX - pos[0]) / camera.zoom[0];
                camera.position[1] -= (e.pageY - pos[1]) / camera.zoom[1];
                pos[0] = e.pageX;
                pos[1] = e.pageY;
            } else if (fCamera != null && !fCamera.isDisabled) {
                fCamera.offset[0] -= (e.pageX - pos[0]) / fCamera.zoom[0];
                fCamera.offset[1] -= (e.pageY - pos[1]) / fCamera.zoom[1];
                pos[0] = e.pageX;
                pos[1] = e.pageY;
            }
        });
        document.addEventListener("mousewheel", (e) => {
            let cameras = [];
            if (e.target == canvases[0]) {
                cameras.push(camera1);
                cameras.push(fCamera1);
            } else if (e.target == canvases[1]) {
                cameras.push(camera2);
                cameras.push(fCamera2);
            } else if (e.target == canvases[2]) {
                cameras.push(camera3);
                cameras.push(fCamera3);
            }
            cameras.forEach((c) => {
                let ticks = e.wheelDelta / 120;
                c.zoom[0] *= Math.pow(2, ticks / 5);
                c.zoom[1] *= Math.pow(2, ticks / 5);
            });
            e.preventDefault();
            return false;
        });
        document.addEventListener("keydown", (e) => {
            console.log(e.key);
            if (e.key == "+" || e.key == "-") {
                let cameras = [];
                cameras.push(camera1);
                cameras.push(fCamera1);
                cameras.push(camera2);
                cameras.push(fCamera2);
                cameras.push(camera3);
                cameras.push(fCamera3);

                +cameras.forEach((c) => {
                    const ticks = e.key == "-" ? -1 : 1;

                    c.zoom[0] *= Math.pow(2, ticks / 5);
                    c.zoom[1] *= Math.pow(2, ticks / 5);
                });
                e.preventDefault();
                return false;
            } else if (e.key == " ") {
                if (this.isPaused()) this.resume();
                else this.pause();
            }
        });

        for (let x = 0; x < canvases.length; x++) {
            const canvas = canvases[x];
            canvas.addEventListener("click", (e) => {
                let camera = null;
                if (e.target == canvases[0]) {
                    camera = camera1.isDisabled ? fCamera1 : camera1;
                } else if (e.target == canvases[1]) {
                    camera = camera2.isDisabled ? fCamera2 : camera2;
                } else if (e.target == canvases[2]) {
                    camera = camera3.isDisabled ? fCamera3 : camera3;
                }
                if (camera != null) {
                    // Convert to world
                    const posA =
                        camera.position[0] + (e.offsetX - camera.size.width / 2) / camera.zoom[0];
                    const posB =
                        camera.position[1] + (e.offsetY - camera.size.height / 2) / camera.zoom[1];

                    const bodies = this.filter("body");
                    let best = null;

                    const pClick = vec2.fromValues(posA, posB);
                    let minDist = Number.MAX_VALUE;
                    for (let x = 0; x < bodies.length; x++) {
                        const body = bodies[x];
                        let pBody = null;
                        if (camera.view == "x") {
                            pBody = vec2.fromValues(body.position[0], body.position[1]);
                        } else if (camera.view == "y") {
                            pBody = vec2.fromValues(body.position[0], body.position[2]);
                        } else if (camera.view == "z") {
                            pBody = vec2.fromValues(-body.position[1], body.position[2]);
                        }
                        const dist = vec2.dist(pClick, pBody);
                        if (minDist > dist) {
                            minDist = dist;
                            best = body;
                        }
                    }

                    if (this.selected) {
                        this.selected.selected = false;
                        if (this.drawOrbitLengthSelectedOnly) this.selected.maxSavedPositions = 0;
                    }
                    if (best != null) {
                        best.selected = true;
                        this.selected = best;

                        if (this.drawOrbitLengthSelectedOnly)
                            this.selected.maxSavedPositions = this.drawnOrbitLength;

                        // Swap camera to focus on this object.
                        camera1.isDisabled = camera2.isDisabled = camera3.isDisabled = true;
                        fCamera1.isDisabled = fCamera2.isDisabled = fCamera3.isDisabled = false;
                        fCamera1.target = fCamera2.target = fCamera3.target = this.selected;

                        fCamera1.offset = vec2.create();
                        fCamera2.offset = vec2.create();
                        fCamera3.offset = vec2.create();
                    }
                }
                e.preventDefault();
                return false;
            });
            canvas.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                return false;
            });
        }

        // Add everything in to the game. Order matters for both updates and draws.

        // Actions should update first.
        this.addGameObject(actionData);

        // Then world objects
        this.addGameObject(worldObjects);

        // Then huds
        this.addGameObject(hudData);

        // Then cameras.
        this.addGameObject(cameras);
    }

    setMinShowRadius(val) {
        this.filter("camera").forEach(function (c) {
            c.minShowRadius = val;
        });
    }

    setObjectScale(val) {
        this.filter("camera").forEach(function (c) {
            c.objectScale = val;
        });
    }

    setDrawnOrbitLength(val, selectedOnly) {
        // If we we were showing everyone previously, set them all to 0.
        if (!this.drawOrbitLengthSelectedOnly) {
            this.filter("body").forEach(function (b) {
                b.maxSavedPositions = 0;
            });
        }

        // Update our values.
        this.drawnOrbitLength = val;
        this.drawOrbitLengthSelectedOnly = selectedOnly;

        // If we're showing everybody now...
        if (!this.drawOrbitLengthSelectedOnly) {
            this.filter("body").forEach(function (b) {
                b.maxSavedPositions = val;
            });
        } else if (this.selected) {
            // Only selected shown.
            this.selected.maxSavedPositions = val;
        }
    }

    getDrawnOrbitLength() {
        return this.drawnOrbitLength;
    }

    isPaused() {
        return this._timeScale == 0;
    }

    pause() {
        if (!this.isPaused()) {
            this._lastTimeScale = this._timeScale;
            this._timeScale = 0;
        }
    }

    resume() {
        if (this.isPaused()) {
            this._timeScale = this._lastTimeScale || 1000000;
        }
    }
}
