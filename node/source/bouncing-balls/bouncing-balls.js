import {vec2} from 'gl-matrix';

import Game from '../core/game';
import Camera from './default-camera';
import FPSHud from '../canvas-2d/huds/fps-hud';
import ObjectCountHud from './object-count-hud';
import Gravity from './gravity';
import CollisionDetection from '../canvas-2d/collision-detection/collision-detection';
import Ball from './ball';
import WorldBounds from './world-bounds';

export default class BouncingBalls extends Game {
    constructor(canvas) {
        super();

        this.debug = false;

        this.setTimeScale(1);

        const worldBounds = new WorldBounds({
            position: vec2.fromValues(-250, -250),
            size: vec2.fromValues(500, 500)
        });

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
        const collisionDetection = new CollisionDetection(this, [vec2.fromValues(-500, -500), vec2.fromValues(500, 500)]);

        const game = this;

        const worldObjects1 = {
          children: [
              worldBounds,
              new Ball(game, {
                radius: 0.2,
                mass: 2,
                elasticity: 0.0,
                position: vec2.fromValues(-1, 1),   
                velocity: vec2.fromValues(1, 1),

                color: "red"
              }),
              new Ball(game, {
                radius: 0.2,
                mass: 1,
                elasticity: 0.2,
                position: vec2.fromValues(1, 1),   
                velocity: vec2.fromValues(-1,1),

                color: "white"
              }),/*
              new Ball(game, {
                radius: 0.2,
                mass: 1,
                elasticity: 0.4,
                position: vec2.fromValues(0, 1),   
                velocity: vec2.fromValues(1,1),

                color: "blue"
              }),
              
              new Ball(game, {
                radius: 0.2,
                mass: 1,
                elasticity: 0.6,
                position: vec2.fromValues(1, 1.5),   
                velocity: vec2.fromValues(0,0),

                color: "green"
              }),
              
              new Ball(game, {
                radius: 0.2,
                mass: 1,
                elasticity: 0.8,
                position: vec2.fromValues(4, -1),   
                velocity: vec2.fromValues(1,0),

                color: "yellow"
              })*/
          ]  
        };
        
        const worldObjects2 = {
          children: [
              worldBounds,
              new Ball( {
                radius: 0.2,
                mass: 1,
                elasticity: 0.9,
                position: vec2.fromValues(0, 1),   
                velocity: vec2.fromValues(0,0),

                color: "red"
              }),
              new Ball( {
                radius: 0.2,
                mass: 1,
                elasticity: 0.9,
                position: vec2.fromValues(0.22,1.36),   
                velocity: vec2.fromValues(0,0),

                color: "gray"
              }),
              new Ball( {
                radius: 0.2,
                mass: 1,
                elasticity: 0.9,
                position: vec2.fromValues(-0.22,1.36),   
                velocity: vec2.fromValues(0,0),

                color: "blue"
              }),
              
              new Ball( {
                radius: 0.2,
                mass: 1,
                elasticity: 0.9,
                position: vec2.fromValues(0.44,1.72),   
                velocity: vec2.fromValues(0,0),

                color: "green"
              }),
              
              new Ball( {
                radius: 0.2,
                mass: 1,
                elasticity: 0.9,
                position: vec2.fromValues(0,1.72),   
                velocity: vec2.fromValues(0,0),

                color: "orange"
              }),
              
              new Ball( {
                radius: 0.2,
                mass: 1,
                elasticity: 0.9,
                position: vec2.fromValues(-0.44,1.72),   
                velocity: vec2.fromValues(0,0),

                color: "purple"
              }),
              
              new Ball( {
                radius: 0.2,
                mass: 1,
                elasticity: 0.9,
                position: vec2.fromValues(0, -1),   
                velocity: vec2.fromValues(0,10),

                color: "white"
              })
          ]  
        };

        const worldObjects = {
            children: [
                worldBounds
            ]
        }

        let balls = 350;
        let bX = Math.floor(Math.sqrt(balls));
        let bY = Math.ceil(balls/bX);
        let padX = (worldBounds.size[0] / bX);
        let padY = (worldBounds.size[1] / bY);
        let tBalls = 0;

        for(let x= 0; x < bX && balls > tBalls; x++) {
            for(let y= 0; y < bY && balls > tBalls; y++) {
                
                let r = 1;//Math.random();
                worldObjects.children.push(
                    new Ball(game, {
                        radius: r*10,
                        mass: r,
                        elasticity: 1,
                        position: vec2.fromValues(worldBounds.position[0] + padX/2 + x*padX, 
                                                  worldBounds.position[1] + padY/2 + y*padY),   
                        velocity: vec2.fromValues(10* (1-Math.random()*2), 10*(1-Math.random()*2)),

                        color: "white"
                    })
                );
                tBalls++;
            }            
        }

        const camera = new Camera(canvas, { zoom: 1 });

        const cameras = {
            children: [
                camera,
            ]
        };

/*
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
            if (target == canvas) {
                camera = camera1;
            }
            if(camera != null) {
                camera.position[0] -= (e.pageX - pos[0]) / camera.zoom[0];
                camera.position[1] -= (e.pageY - pos[1]) / camera.zoom[1];
                pos[0] = e.pageX;
                pos[1] = e.pageY;
            }
        });
        document.addEventListener('keydown', function(event) {
            let camera = null;
            if (lastTarget == canvas) {
                camera = camera1;
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

        canvas.addEventListener('click', function (e) {
            let camera = null;
            if (e.target == canvas) {
                camera = camera1;
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
        */

        canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); return false; });

        // Add everything in to the game. Order matters for both updates and draws.

        // Then world objects
        this.addGameObject(worldObjects);

        // Then gravity
        //this.addGameObject(gravity);

        // Then collider
        this.addGameObject(collisionDetection);

        // Then huds
        this.addGameObject(hudData);

        // Then cameras.
        this.addGameObject(cameras);
    }
}
