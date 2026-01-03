import { vec3, quat } from "gl-matrix";

import Game from "../core/game";
import Camera from "./default-camera";
import ShapeEntity from "./shape-entity";
import GameObject from "source/core/game-object";
import Hud from "./hud";
import { AmbientLight, LightManager, Mesh, Shader } from "source/canvas-3d";
import { Container, Resources } from "source/core";
import { ColorTexture, ImageTexture } from "source/canvas-3d/textures";
import { Material } from "source/canvas-3d/materials";
import { UboBindPointManager, UboDataType } from "source/canvas-3d/ubo-bind-point-manager";
import { PulseLight } from "./pulse-light";
import { SpinLight } from "./spin-light";
import { ModelManager } from "source/canvas-3d/models";

export default class Cube extends Game {
    resources: Resources;

    constructor(canvas: HTMLCanvasElement) {
        super();

        this.debug = false;

        this.setTimeScale(10);

        this.resources = new Resources();

        // Load images.
        this.resources
            .load([{ type: "image", path: "images/cube.png", names: ["cube"] }, { type: "image", path: "images/earth.png", names: ["earth"] }])
            .then(() => {
                const context = canvas.getContext("webgl2");

                const hud = new Hud();
                hud.children = [];

                const worldObjects: Array<GameObject> = [];

                // Define UBO bind points.
                const bindPointManager = new UboBindPointManager([
                    {
                        name: "camera",
                        variables: [
                            {
                                name: "viewMatrix",
                                dataType: UboDataType.mat4
                            },
                            {
                                name: "projectionMatrix",
                                dataType: UboDataType.mat4
                            }
                        ]
                    },
                    {
                        name: "lighting",
                        variables: [
                            {
                                name: "ambientLight",
                                dataType: UboDataType.vec3
                            },
                            {
                                name: "directionalLightDirections",
                                dataType: UboDataType.vec3,
                                length: 8
                            },
                            {
                                name: "directionalLightColors",
                                dataType: UboDataType.vec3,
                                length: 8
                            },
                            {
                                name: "directionalLightCount",
                                dataType: UboDataType.int
                            }
                        ]
                    }
                ]);

                // Create a material
                const cubeTexture = new ImageTexture(this.resources.get("cube").image);
                const sphereTexture = new ImageTexture(this.resources.get("earth").image);
                const cubeShader = Shader.createBasicShader(bindPointManager);
                const cubeMaterial = new Material({
                    textures: [
                        {
                            texture: cubeTexture,
                            location: "texture"
                        }
                    ],
                    shader: cubeShader
                });
                const sphereMaterial = new Material({
                    textures: [
                        {
                            texture: sphereTexture,
                            location: "texture"
                        }
                    ],
                    shader: cubeShader
                });

                // Create our mesh
                const cubeMesh = Mesh.createCube(cubeMaterial);

                // Create our mesh
                const sphereMesh = Mesh.createSphere(sphereMaterial);

                // Set up some lights
                const lightManager = new LightManager({
                    bindPoint: bindPointManager.getBindPoint("lighting")
                });
                const ambientLight = new AmbientLight({ color: [0.05, 0.05, 0.05] });
                const pulseLight = new PulseLight();
                const spinLight = new SpinLight();

                const modelManager = new ModelManager(10000);

                const models = new Container();
                const extraCubes = [];
                for (let x = 0; x < 100; x++) {
                    const rotation = quat.create();
                    quat.rotateX(rotation, rotation, (-Math.PI / 2) * Math.random());
                    quat.rotateY(rotation, rotation, (-Math.PI / 2) * Math.random());
                    quat.rotateZ(rotation, rotation, (-Math.PI / 2) * Math.random());

                    extraCubes.push(
                        new ShapeEntity({
                            scale: vec3.fromValues(1, 1, 1),
                            mass: 1,
                            position: vec3.fromValues(
                                (-5 + (x % 10)) * 4,
                                (-5 + Math.floor((x % 100) / 10)) * 4,
                                5 + (-5 + -Math.floor(x / 100)) * 4
                            ),
                            center: vec3.fromValues(0, 0, 0),
                            velocity: vec3.fromValues(0, 0, 0),
                            pivot: vec3.fromValues(0, 0, 0),
                            rotation,
                            mesh: Math.round(Math.random()) == 0 ? cubeMesh : sphereMesh
                        })
                    );
                }
                models.children = extraCubes;
                for (let i = 1; i < 10; i++) {
                    setTimeout(() => {
                        for (let x = 100 * i; x < (i + 1) * 100; x++) {
                            const rotation = quat.create();
                            quat.rotateX(rotation, rotation, (-Math.PI / 2) * Math.random());
                            quat.rotateY(rotation, rotation, (-Math.PI / 2) * Math.random());
                            quat.rotateZ(rotation, rotation, (-Math.PI / 2) * Math.random());

                            this.addGameObject(
                                new ShapeEntity({
                                    scale: vec3.fromValues(1, 1, 1),
                                    mass: 1,
                                    position: vec3.fromValues(
                                        (-5 + (x % 10)) * 4,
                                        (-5 + Math.floor((x % 100) / 10)) * 4,
                                        5 + (-5 + -Math.floor(x / 100)) * 4
                                    ),
                                    center: vec3.fromValues(0, 0, 0),
                                    velocity: vec3.fromValues(0, 0, 0),
                                    pivot: vec3.fromValues(0, 0, 0),
                                    rotation,
                                    mesh: Math.round(Math.random()) == 0 ? cubeMesh : sphereMesh
                                }),
                                models
                            );
                        }
                    }, i * 1000);
                }
                setTimeout(() => {
                    for (let i = 0; i < 1000; i++) {
                        setTimeout(() => {
                            this.removeGameObject(
                                models.children[Math.floor(models.children.length * Math.random())]
                            );
                        }, 100 * i);
                    }
                }, 10000);

                worldObjects.push(
                    bindPointManager,
                    lightManager,
                    ambientLight,
                    pulseLight,
                    spinLight,
                    cubeTexture,
                    sphereTexture,
                    cubeShader,
                    cubeMaterial,
                    sphereMaterial,
                    cubeMesh,
                    sphereMesh,
                    new ShapeEntity({
                        scale: vec3.fromValues(1, 1, 1),
                        mass: 1,
                        position: vec3.fromValues(0, 0, 0),
                        center: vec3.fromValues(0, 0, 0),
                        velocity: vec3.fromValues(0, 0, 0),
                        pivot: vec3.fromValues(0, 0, 0),
                        // rotation: quat.rotateX(quat.create(), quat.create(), -Math.PI / 2)
                        mesh: cubeMesh
                    }),
                    new ShapeEntity({
                        scale: vec3.fromValues(1, 1, 1),
                        mass: 1,
                        position: vec3.fromValues(-5, 0, 0),
                        center: vec3.fromValues(0, 0, 0),
                        velocity: vec3.fromValues(0, 0, 0),
                        pivot: vec3.fromValues(0, 0, 0),
                        // rotation: quat.rotateX(quat.create(), quat.create(), -Math.PI / 2)
                        mesh: sphereMesh
                    }),
                    models,
                    modelManager
                );

                // Set up our camera.
                const rotation = quat.create();
                // quat.rotateY(rotation, rotation, -0.9);

                const camera = new Camera(context, bindPointManager.getBindPoint("camera"), {
                    position: vec3.fromValues(0, 0, 10),
                    rotation: rotation,
                    zoom: 1
                });

                cubeTexture.init(camera);
                sphereTexture.init(camera);
                cubeShader.init(camera);
                lightManager.init(camera);

                canvas.addEventListener("contextmenu", function (e) {
                    e.preventDefault();
                    return false;
                });

                // Add everything in to the game. Order matters for updates.

                // Then world objects
                this.addGameObjects(worldObjects);

                // Then huds
                this.addGameObject(hud);

                // Then cameras.
                this.addGameObject(camera);
            });
    }
}
