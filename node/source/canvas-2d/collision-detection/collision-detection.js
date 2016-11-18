import {vec2} from 'gl-matrix';
import Math2D from '../math-2d';
import QuadTree from './quad-tree';

export default class CollisionDetection {
    constructor(game, maxBounds) {
        this._game = game;

        if(!maxBounds) {
            this._maxBounds = [vec2.fromValues(Number.MIN_VALUE, Number.MIN_VALUE), vec2.fromValues(Number.MAX_VALUE, Number.MAX_VALUE)]
        } else
            this._maxBounds = maxBounds;
    }

    update(tDelta) {

        // Grab all colliders.
        const objs = this._game.filter("collider");

        const collisionMap = new Map();

        // Arrange colliders into a quadtree.
        const quadTree = this.quadTree = new QuadTree(this._maxBounds, 10);

        for (let i = 0; i < objs.length; i++) {
            if (objs[i].removed)
                continue;
            
            quadTree.insert(objs[i]);
        }

        // Test each collider against each other.
        quadTree.test(function(obj1, obj2) {
            // Perform test and get any collision results.
            const collisions = obj1.testCollision(obj2, tDelta);
            if(collisions != null) {
                for(let c = 0; c < collisions.length; c++) {
                    // Add collision to the collisions map for the first collider.
                    const collision = collisions[c];
                    let colList = null;
                    if(!(colList = collisionMap.get(collision.obj1.collider))) {
                        colList = [];
                        collisionMap.set(collision.obj1.collider, colList);
                    }
                    colList.push(collision);

                    // Add collision to the collisions map for the second collider.
                    colList = null;
                    if(!(colList = collisionMap.get(collision.obj2.collider))) {
                        colList = [];
                        collisionMap.set(collision.obj2.collider, colList);
                    }
                    colList.push({ 
                        obj1: collision.obj2,
                        obj2: collision.obj1,
                    });
                }
            }
        });

        // Go through the collisions map and invoke the onCollisions call on each
        // collider.
        for (let [key, value] of collisionMap) {
            key.onCollisions(value);
        }

        for (let [key, value] of collisionMap) {
            key.onCollided(value);
        }
    }

    debugDraw(tDelta, camera, context){

        if(this.quadTree) {
            let subDraw = function(qt) {
                context.strokeStyle = "red";
                context.lineWidth = 0.01;
                context.strokeRect(qt.bounds[0][0], 
                                qt.bounds[0][1], 
                                qt.bounds[1][0] - qt.bounds[0][0], 
                                qt.bounds[1][1] - qt.bounds[0][1]);

                if(qt._quadrants != null)
                    for(let i = 0; i < qt._quadrants.length; i++) {
                        subDraw(qt._quadrants[i]);
                    }
            };
            subDraw(this.quadTree);
        }
    }
}