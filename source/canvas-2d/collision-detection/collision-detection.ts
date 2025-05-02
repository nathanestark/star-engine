import { vec2 } from "gl-matrix";
import QuadTree from "./quad-tree";
import { ICollider } from "./collider";
import { CollisionResult } from "./collider-operations";
import Canvas2DCamera from "../cameras/canvas-2d-camera";
import { RefreshTime } from "source/core/types";
import GameObject from "source/core/game-object";

export default class CollisionDetection extends GameObject {
    _maxBounds: [vec2, vec2];
    quadTree: QuadTree; // Store the quadtree after each update so we can
    // Debug draw it if requested.

    constructor(maxBounds?: [vec2, vec2]) {
        super();

        if (!maxBounds) {
            this._maxBounds = [
                vec2.fromValues(Number.MIN_VALUE, Number.MIN_VALUE),
                vec2.fromValues(Number.MAX_VALUE, Number.MAX_VALUE)
            ];
        } else this._maxBounds = maxBounds;
    }

    update(tDelta: number) {
        // Grab all colliders.
        const objs = this.game.filter("collider") as unknown as Array<ICollider>;

        const collisionMap = new Map<ICollider, Array<CollisionResult>>();

        // Arrange colliders into a quadtree.
        const quadTree = (this.quadTree = new QuadTree(this._maxBounds, 1));

        for (let i = 0; i < objs.length; i++) {
            if (objs[i].canCollide) quadTree.insert(objs[i]);
        }

        // Test each collider against each other.
        quadTree.test(function (obj1, obj2) {
            // Perform test and get any collision results.
            const collisions = obj1.testCollision(obj2, tDelta);
            if (collisions != null) {
                for (let c = 0; c < collisions.length; c++) {
                    // Add collision to the collisions map for the first collider.
                    const collision = collisions[c];
                    let colList: null | Array<CollisionResult> = null;
                    if (!(colList = collisionMap.get(collision.obj1.collider))) {
                        colList = [];
                        collisionMap.set(collision.obj1.collider, colList);
                    }
                    colList.push(collision);

                    // Add collision to the collisions map for the second collider.
                    colList = null;
                    if (!(colList = collisionMap.get(collision.obj2.collider))) {
                        colList = [];
                        collisionMap.set(collision.obj2.collider, colList);
                    }
                    colList.push({
                        obj1: collision.obj2,
                        obj2: collision.obj1
                    });
                }
            }
        });

        // Go through the collisions map and invoke the onCollision call on each
        // collider.
        for (let [key, value] of collisionMap) {
            key.onCollision(value);
        }

        for (let [key, value] of collisionMap) {
            key.onCollided(value);
        }
    }

    debugDraw(camera: Canvas2DCamera, _time: RefreshTime) {
        if (this.quadTree) {
            let subDraw = function (qt: QuadTree) {
                camera.context.strokeStyle = "red";
                camera.context.lineWidth = 0.5 / camera.zoom[0];
                camera.context.strokeRect(
                    qt.bounds[0][0],
                    qt.bounds[0][1],
                    qt.bounds[1][0] - qt.bounds[0][0],
                    qt.bounds[1][1] - qt.bounds[0][1]
                );

                if (qt._quadrants != null)
                    for (let i = 0; i < qt._quadrants.length; i++) {
                        subDraw(qt._quadrants[i]);
                    }
            };
            subDraw(this.quadTree);
        }
    }
}
