import { vec2 } from "gl-matrix";

export default class QuadTree {
    constructor(bounds, nodeCapacity) {
        this._nodeCapacity = nodeCapacity;
        this._contents = [];
        this._parent = null;
        this._quadrants = null;
        this.bounds = bounds;
    }

    insert(collider) {
        // If we have not been subdivided, add to our contents.
        if (this._quadrants == null) {
            this._contents.push(collider);

            // Did we exceed capacity?
            if (this._nodeCapacity < this._contents.length) {
                this._quadrants = [];

                const nwPoint = this.bounds[0];
                const sePoint = this.bounds[1];
                const cPoint = vec2.fromValues(
                    (nwPoint[0] + sePoint[0]) / 2,
                    (nwPoint[1] + sePoint[1]) / 2
                );
                const cePoint = vec2.fromValues(sePoint[0], cPoint[1]);
                const csPoint = vec2.fromValues(cPoint[0], sePoint[1]);
                const cnPoint = vec2.fromValues(cPoint[0], nwPoint[1]);
                const cwPoint = vec2.fromValues(nwPoint[0], cPoint[1]);

                let qt = new QuadTree([nwPoint, cPoint], this._nodeCapacity);
                qt._parent = this;
                this._quadrants.push(qt);

                qt = new QuadTree([cnPoint, cePoint], this._nodeCapacity);
                qt._parent = this;
                this._quadrants.push(qt);

                qt = new QuadTree([cwPoint, csPoint], this._nodeCapacity);
                qt._parent = this;
                this._quadrants.push(qt);

                qt = new QuadTree([cPoint, sePoint], this._nodeCapacity);
                qt._parent = this;
                this._quadrants.push(qt);

                // Go through each content and try to add to the sub quadrants.
                const tempContents = this._contents;
                this._contents = [];
                for (let c = 0; c < tempContents.length; c++) {
                    this._addToQuadrant(tempContents[c]);
                }
            }
        } else {
            // Determine what quadrant to add to.
            this._addToQuadrant(collider);
        }
    }

    _addToQuadrant(collider) {
        // Test each of the bounds.
        let colVal = 0;
        for (let q = 0; q < this._quadrants.length; q++) {
            colVal = collider.testInsideBoundingBox(this._quadrants[q].bounds);
            if (colVal == 2) {
                // We belong here.
                this._quadrants[q].insert(collider);
                break;
            } else if (colVal == 1) {
                // We're overlapping this quadrant, but not in it, so we need to be
                // placed in the parent.
                break;
            }
            // Otherwise, we're not in it and need to test the next one
        }

        // If we tested as overlapping, add to our contents instead.
        if (colVal == 1) {
            this._contents.push(collider);
        }
    }

    test(callback) {
        for (let i = 0; i < this._contents.length; i++) {
            // First test our contents against each other.
            for (let j = i + 1; j < this._contents.length; j++) {
                callback(this._contents[i], this._contents[j]);
            }

            // Then test our contents against each parent.
            if (this._parent) this._parent._parentTest(this._contents[i], callback);
        }

        // Then do child quadrants.
        if (this._quadrants != null) {
            for (let q = 0; q < this._quadrants.length; q++) {
                this._quadrants[q].test(callback);
            }
        }
    }

    _parentTest(collider, callback) {
        for (let i = 0; i < this._contents.length; i++) {
            callback(collider, this._contents[i]);
        }

        if (this._parent) this._parent._parentTest(collider, callback);
    }
}
