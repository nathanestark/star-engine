import {vec2, vec3, quat} from 'gl-matrix';

import Game from '../core/game';
import Camera from './default-camera';
import FPSHud from '../canvas-2d/huds/fps-hud';
import ObjectCountHud from './object-count-hud';
import Gravity from './gravity';
import Collider from './collider';
import Body from './body';

import RandomWorldObjects from './random-system';
import SolarSystemObjects from './solar-system';

export default class SolarSystem extends Game {
    constructor(canvases) {
        super();

        this.setTimeScale(3153600);

        const hudData = {
            children: [
                new FPSHud({position: vec2.fromValues(10, 10)}),
                new ObjectCountHud(this, {position: vec2.fromValues(10, 25)})
            ],
            draw: function (tDelta, camera, context) {
                // HUDs should be drawn relative to the canvas.
                context.setTransform(1, 0, 0, 1, 0, 0);
            }
        };

        const gravity = new Gravity(this);
        const actionData = {
            children: [
                gravity/*,
                new Collider(this)*/
            ]
        };


        const worldObjects = new SolarSystemObjects(gravity).objects;

        const camera1 = new Camera(canvases[0], { view: "x", zoom: 0.0000000005 });
        const camera2 = new Camera(canvases[1], { view: "y", zoom: 0.0000000005 });
        const camera3 = new Camera(canvases[2], { view: "z", zoom: 0.0000000005 });

        const cameras = {
            children: [
                camera1,
                camera2,
                camera3
            ]
        };

        let target = null;
        let lastTarget = null
        const pos = [0,0];
        document.addEventListener('mousedown', function (e) {
            lastTarget = e.target;
            e.target.focus()
            if (e.button == 2) {
                target = e.target;
                pos[0] = e.pageX;
                pos[1] = e.pageY;

                e.preventDefault();
                return false;
            }
        });

        document.addEventListener('mouseup', function (e) {
            if (e.button == 2) {
                target = null;

                e.preventDefault();
                return false;
            }
        });

        document.addEventListener('mousemove', function (e) {
            let camera = null;
            if (target == canvases[0]) {
                camera = camera1;
            } else if (target == canvases[1]) {
                camera = camera2;
            } else if (target == canvases[2]) {
                camera = camera3;
            }
            if(camera != null) {
                camera.position[0] -= (e.pageX - pos[0]) / camera.zoom[0];
                camera.position[1] -= (e.pageY - pos[1]) / camera.zoom[1];
                pos[0] = e.pageX;
                pos[1] = e.pageY;
            }
        });
        document.addEventListener('mousewheel', function (e) {
            lastTarget = e.target;
            let camera = null;
            if (e.target == canvases[0]) {
                camera = camera1;
            } else if (e.target == canvases[1]) {
                camera = camera2;
            } else if (e.target == canvases[2]) {
                camera = camera3;
            }
            if (camera != null) {
                let ticks = e.wheelDelta / 120;
                //if(ticks > 0) {
                    camera.zoom[0] *= Math.pow(2, ticks / 5);
                    camera.zoom[1] *= Math.pow(2, ticks / 5);
                //}
                //else if(ticks < 0) {
                //    camera.zoom[0] /= Math.Pow(2, -ticks);
                //    camera.zoom[1] /= Math.Pow(2, -ticks);
                //}
                e.preventDefault();
                return false;
            }
        });
        document.addEventListener('keydown', function(event) {
            let camera = null;
            if (lastTarget == canvases[0]) {
                camera = camera1;
            } else if (lastTarget == canvases[1]) {
                camera = camera2;
            } else if (lastTarget == canvases[2]) {
                camera = camera3;
            }
            if (camera != null) {
                let ticks = 0;
                if(event.which == 107)
                    ticks = -1;
                else if(event.which == 109)
                    ticks = 1;

                camera.zoom[0] *= Math.pow(2, ticks / 5);
                camera.zoom[1] *= Math.pow(2, ticks / 5);

                e.preventDefault();
                return false;
            }
        });

        for(let x=0;x<canvases.length;x++) {
            const canvas = canvases[x];
            const self = this;
            canvas.addEventListener('click', function (e) {
                let camera = null;
                if (e.target == canvases[0]) {
                    camera = camera1;
                } else if (e.target == canvases[1]) {
                    camera = camera2;
                } else if (e.target == canvases[2]) {
                    camera = camera3;
                }
                if (camera != null) {
                    // Convert to world
                    const posA = camera.position[0] + (e.offsetX - camera.size.width / 2) / camera.zoom[0];
                    const posB = camera.position[1] + (e.offsetY - camera.size.height / 2) / camera.zoom[1];

                    const bodies = self.filter("worldObject");
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

                    if (self.selected) {
                        self.selected.selected = false;
                        if (self.drawOrbitLengthSelectedOnly)
                            self.selected.maxSavedPositions = 0;
                    }
                    if (best != null) {
                        best.selected = true;
                        self.selected = best;

                        if (self.drawOrbitLengthSelectedOnly)
                            self.selected.maxSavedPositions = self.drawnOrbitLength;
                    }
                }
                e.preventDefault();
                return false;
            });
            canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); return false; });
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
        this.filter('camera').forEach(function (c) {
            c.minShowRadius = val;
        });
    }

    setObjectScale(val) {
        this.filter('camera').forEach(function (c) {
            c.objectScale = val;
        });
    }

    setDrawnOrbitLength(val, selectedOnly) {

        // If we we were showing everyone previously, set them all to 0.
        if (!this.drawOrbitLengthSelectedOnly) {
            this.filter('worldObject').forEach(function (b) {
                b.maxSavedPositions = 0;
            });
        }
        
        // Update our values.
        this.drawnOrbitLength = val;
        this.drawOrbitLengthSelectedOnly = selectedOnly;

        // If we're showing everybody now...
        if (!this.drawOrbitLengthSelectedOnly) {
            this.filter('worldObject').forEach(function (b) {
                b.maxSavedPositions = val;
            });
        } else if(this.selected) {
            // Only selected shown.
            this.selected.maxSavedPositions = val;
        }
    }

    getDrawnOrbitLength() {
        return this.drawnOrbitLength;
    }
}
