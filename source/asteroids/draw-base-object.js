import {vec2} from 'gl-matrix';
import CircleCollider from '../canvas-2d/collision-detection/circle-collider';
import Math2D from '../canvas-2d/math-2d';

export default class DrawBaseObject {
    constructor(game, properties = {}) {
        this.game = game;
        this.radius = 1;
        this.position = vec2.create();
        this.rotation = 0;

        if (properties.position
            && properties.position instanceof Float32Array) {
            this.position = properties.position;
        }
        if (typeof (properties.rotation) == 'number') {
            this.rotation = properties.rotation;
        }
        if (typeof (properties.radius) == 'number') {
            this.radius = properties.radius;
        }

        if (properties.color)
            this.color = properties.color;

        if (properties.image) {
            this.image = this._processImage(properties.image);
        }
    }
    
    _processImage(imgDef) {
        let ret = {};
        // If it is just an image, use defaults. 
        if(imgDef instanceof Image) {
            ret = {
                image: imgDef
            };
        }

        if(imgDef.image)
            ret.image = imgDef.image;

        if(ret.image) {
            if(typeof(imgDef.rotation) === 'undefined' || imgDef.rotation === null)
                ret.rotation =  0;
            else
                ret.rotation = imgDef.rotation;

            if(!(imgDef.offsetPosition instanceof Float32Array))
                ret.offsetPosition = vec2.create();
            else
                ret.offsetPosition = vec2.clone(imgDef.offsetPosition);

            if(!(imgDef.offsetSize instanceof Float32Array))
                if(imgDef.clipSize instanceof Float32Array)
                    ret.offsetSize = vec2.clone(imgDef.clipSize);
                else
                    ret.offsetSize = vec2.fromValues(ret.image.width, ret.image.height);
            else 
                ret.offsetSize = vec2.clone(imgDef.offsetSize);

            if(!(imgDef.clipPosition instanceof Float32Array))
                ret.clipPosition = vec2.create();
            else
                ret.clipPosition = vec2.clone(imgDef.clipPosition);

            if(!(imgDef.clipSize instanceof Float32Array))
                ret.clipSize = vec2.fromValues(ret.image.width, ret.image.height);
            else
                ret.clipSize = vec2.clone(imgDef.clipSize);
        }
        if(imgDef.animations) {
            ret.animations = {};
            for(let name in imgDef.animations) {
                const animation = imgDef.animations[name];
                const newAnimation = {};
                ret.animations[name] = newAnimation;

                if(!animation.framesPerSecond) {
                    newAnimation.framesPerSecond = 30;
                } else 
                    newAnimation.framesPerSecond = animation.framesPerSecond;

                // Put in frames per millisecond.
                newAnimation._framesPerMillisecond = newAnimation.framesPerSecond / 1000;

                newAnimation._getFrame = (animFrame) => {
                    return animFrame % newAnimation.frames.length;
                };
                newAnimation.repeatMethod = 'loop';
                if(animation.repeatMethod == 'repeat') {
                    newAnimation.repeatMethod = 'repeat';
                    let dir = 1;
                    newAnimation._getFrame = (animFrame) => {
                        
                        const reversals = Math.floor(animFrame/(newAnimation.frames.length-1));
                        const left = animFrame - reversals * (newAnimation.frames.length-1);

                        ret.dir *= Math.pow(-1, reversals);
                        if(ret.dir == 1)
                            return left;
                        else
                            return newAnimation.frames.length - 1 - left;
                    };
                }

                newAnimation.frames = [];
                if(animation.frames instanceof Array) {
                    for(let i = 0; i < animation.frames.length; i++) {
                        newAnimation.frames.push(this._processImage(animation.frames[i]));
                    }
                } else if(typeof(animation.frames) === 'number') {
                    const frameTemplate = this._processImage(animation);
                    for(let i = 0; i < animation.frames; i++) {
                        newAnimation.frames.push({
                            image: frameTemplate.image,
                            rotation: frameTemplate.rotation,
                            offsetPosition: frameTemplate.offsetPosition,
                            offsetSize: frameTemplate.offsetSize,
                            clipSize: frameTemplate.clipSize,
                            clipPosition: vec2.fromValues(frameTemplate.clipPosition[0] + animation.frameSpacing[0]*i,
                                                          frameTemplate.clipPosition[1] + animation.frameSpacing[1]*i)
                        });
                    }
                }
            }

            // Setting default animation is up to them. If it isn't set, then
            // the 'default' is to show the image at the root.
            if(typeof(imgDef.defaultAnimation) === 'string') {
                ret.defaultAnimation = imgDef.defaultAnimation; 
                ret._curAnimation = ret.animations[ret.defaultAnimation];
            }
        }
        return ret;
    }

    startAnimation(animation) {
        if(this.image.animations[animation]) {
            this.image._curAnimation = this.image.animations[animation];
            this.image._startTime = 0;
        }
    }

    stopAnimation() {
        this.image._curAnimation = null;
        this.image._startTime = 0;
        if(this.image.defaultAnimation) {
            this.startAnimation(this.image.defaultAnimation);
        }
    }

    drawImage(context, image) {
        context.save();

        const diam = this.radius * 2;
        const ratioX = diam / this.image.offsetSize[0];
        const ratioY = diam / this.image.offsetSize[1];
        context.rotate(image.rotation);
        context.translate(-(this.radius + this.image.offsetPosition[0] * ratioX),
                          -(this.radius + this.image.offsetPosition[1] * ratioY));

        context.drawImage(this.image.image, 
                          image.clipPosition[0], image.clipPosition[1],
                          image.clipSize[0], image.clipSize[1],
                          0, 0, 
                          this.image.clipSize[0]*ratioX, this.image.clipSize[1]*ratioY,
                         );

        context.restore();
    }

    _getFrame(animationTime) {
        let frame = 0;
        if(!this.image._startTime)
            this.image._startTime = animationTime;
        else
            frame = Math.floor((animationTime - this.image._startTime) 
                                * this.image._curAnimation._framesPerMillisecond);

        // Constrain frame to total animation frames.
        frame = this.image._curAnimation._getFrame(frame);

        return this.image._curAnimation.frames[frame];
    }

    draw(time, camera, context){

        context.translate(this.position[0], this.position[1]);
        context.rotate(this.rotation);

        if(this.image) {
            if(this.image._curAnimation) {
                this.drawImage(context, this._getFrame(time.animationTime));
            } else {
                this.drawImage(context, this.image);
            }
        } else {
            context.fillStyle = this.color;
            context.beginPath();
            
            context.arc(0, 0, this.radius, 0, Math2D.twoPi);
            context.fill();
        }
    }
}