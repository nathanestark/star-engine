import {vec3} from 'gl-matrix';

export default class Body {
    constructor(properties = {}) {
        this.classTags = ["body"];

        this.color = "#000";
        this.radius = 10;
        this.position = vec3.create();
        this.velocity = vec3.create();
        this.mass = 0;
        this.totalForce = vec3.create();
        this.name = null;
        this.selected = false;
        this.maxSavedPositions = 0;
        
        this._twoPi = 2 * Math.PI;
        this._lastPositions = [];

        if (properties.position
            && properties.position instanceof Float32Array) {
            this.position = properties.position;
        }
        if (properties.velocity
            && properties.velocity instanceof Float32Array) {
            this.velocity = properties.velocity;
        }
        if (typeof (properties.mass) == 'number') {
            this.mass = properties.mass;
        }
        if (typeof (properties.radius) == 'number') {
            this.radius = properties.radius;
        }
        if (properties.color)
            this.color = properties.color;

        if (properties.name)
            this.name = properties.name;

    }

    update(tDelta) {
        // Save our last position
        if (this.maxSavedPositions > 0) {
            this._lastPositions.push(vec3.clone(this.position))
            if (this._lastPositions.length > this.maxSavedPositions)
                this._lastPositions.splice(0, 1);
        }
        else if (this._lastPositions.length > 0)
            this._lastPositions = [];
        
        // Apply our total force to our velocity.
        vec3.scale(this.totalForce, this.totalForce, tDelta / (this.mass));
        vec3.add(this.velocity, this.velocity, this.totalForce);

        // Apply our velocity to our position, but don't destroy velocity.
        const vel = vec3.clone(this.velocity);
        vec3.scale(vel, vel, tDelta);
        vec3.add(this.position, this.position, vel);

        // Reset force.
        this.totalForce = vec3.create();
    }

    draw(tDelta, camera, context){
        context.fillStyle = this.color;
        context.beginPath();
        
        let p1 = 0;
        let p2 = 0;
        if (camera.view == "x") {
            p1 = this.position[0] + camera.size.width / 2;
            p2 = this.position[1] + camera.size.height / 2;
        } else if (camera.view == "y") {
            p1 = this.position[0] + camera.size.width / 2;
            p2 = this.position[2] + camera.size.height / 2;
        } else if (camera.view == "z") {
            p1 = -this.position[1] + camera.size.width / 2;
            p2 = this.position[2] + camera.size.height / 2;
        }

        let doDraw = true;

        const drawRadius = this.radius * camera.objectScale;
        if (drawRadius * camera.zoom[0] < 0.5) {
            if (this.radius >= camera.minShowRadius || this.selected) {
                context.arc(p1, p2, 0.5 / camera.zoom[0], 0, this._twoPi);
            } else
                doDraw = false;
        } else
            context.arc(p1, p2, drawRadius, 0, this._twoPi);
        context.fill();


        if (this.name) {
            context.save();
            context.resetTransform();

            let t1 = p1 * camera.zoom[0] + camera.size.width / 2 - camera.position[0] * camera.zoom[0];
            let t2 = p2 * camera.zoom[0] + camera.size.height / 2 - camera.position[1] * camera.zoom[0];

            // Offset it so it isn't right on top of our object.
            const offset = Math.max(1, this.radius * camera.zoom[0] * camera.objectScale);
            t1 += offset + 5;
            t2 += offset + 10;

            context.fillStyle = "red";
            context.lineWidth = 1;
            context.font = "10px Tahoma";
            context.fillText(this.name, t1, t2);
            context.restore();
        }

        if (this.selected) {
            context.beginPath();
            context.lineWidth = 0.5 / camera.zoom[0];
            context.strokeStyle = "#888";
            context.rect(p1 - 5 / camera.zoom[0], p2 - 5 / camera.zoom[0], 10 / camera.zoom[0], 10 / camera.zoom[0]);
            context.stroke();
        }

        if (doDraw) {
            context.beginPath();
            context.strokeStyle = "#333";
            context.lineWidth = 0.5 / camera.zoom[0];
            for (let x = 0; x < this._lastPositions.length; x++) {
                if (camera.view == "x") {
                    p1 = this._lastPositions[x][0] + camera.size.width / 2;
                    p2 = this._lastPositions[x][1] + camera.size.height / 2;
                } else if (camera.view == "y") {
                    p1 = this._lastPositions[x][0] + camera.size.width / 2;
                    p2 = this._lastPositions[x][2] + camera.size.height / 2;
                } else if (camera.view == "z") {
                    p1 = -this._lastPositions[x][1] + camera.size.width / 2;
                    p2 = this._lastPositions[x][2] + camera.size.height / 2;
                }
                if (x == 0)
                    context.moveTo(p1, p2);
                else
                    context.lineTo(p1, p2);
            }
            context.stroke();
        }
    }
}