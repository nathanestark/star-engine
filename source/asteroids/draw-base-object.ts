import { vec2 } from "gl-matrix";
import * as Math2D from "../canvas-2d/math-2d";
import GameObject from "source/core/game-object";
import DefaultCamera from "./default-camera";
import { RefreshTime } from "source/core/types";

interface RenderableImage {
    image: HTMLImageElement;
    rotation: number;
    offsetPosition?: vec2;
    offsetSize?: vec2;
    clipSize?: vec2;
    clipPosition?: vec2;
}
interface Animation extends RenderableImage {
    repeatMethod?: "loop" | "bounce";
    frames: number | Array<RenderableImage>;
    framesPerSecond?: number;
    framesPerMillisecond?: number;
    frameSpacing: vec2;
}

interface RenderableImageWithAnimation extends RenderableImage {
    defaultAnimation?: string;
    animations?: Record<string, Animation>;
}

interface RenderImage extends RenderableImage {
    animations?: Record<string, RenderAnimation>;
    defaultAnimation?: string;
    animationDir: number;
    curAnimation?: RenderAnimation;
    animationStartTime?: number;
    offsetPosition: vec2;
    offsetSize: vec2;
    clipSize: vec2;
    clipPosition: vec2;
}

interface RenderAnimation {
    repeatMethod: "none" | "loop" | "bounce";
    framesPerMillisecond: number;
    frames: Array<RenderableImage>;
    getFrame: (animFrame: number) => number;
}

export interface DrawBaseObjectProperties {
    position?: vec2;
    radius?: number;
    rotation?: number;
    color?: string;
    image?: HTMLImageElement | RenderableImageWithAnimation | RenderImage;
}

export default class DrawBaseObject extends GameObject {
    position: vec2;
    radius: number;
    rotation: number;
    color: string;
    image: RenderImage;

    constructor({ radius, position, rotation, color, image }: DrawBaseObjectProperties = {}) {
        super();

        this.radius = 1;
        this.position = vec2.create();
        this.rotation = 0;

        if (position) {
            this.position = position;
        }
        if (typeof rotation == "number") {
            this.rotation = rotation;
        }
        if (typeof radius == "number") {
            this.radius = radius;
        }

        if (color) this.color = color;

        if (image) {
            this.image = this._processImage(image);
        }
    }

    _processImage(
        imgDef: HTMLImageElement | RenderableImage | RenderableImageWithAnimation | RenderImage
    ): RenderImage {
        const iImgDef = imgDef as HTMLImageElement;
        const rImgDef = imgDef as RenderableImage;
        const aImgDef = imgDef as RenderableImageWithAnimation;

        let ret: RenderImage = {
            image: rImgDef.image ? rImgDef.image : iImgDef,
            rotation: 0,
            offsetPosition: vec2.create(),
            offsetSize: vec2.create(),
            clipSize: vec2.create(),
            clipPosition: vec2.create(),
            animationDir: 1
        };

        if (rImgDef.image) ret.image = rImgDef.image;

        if (ret.image) {
            if (typeof rImgDef.rotation === "number") ret.rotation = rImgDef.rotation;

            if (rImgDef.offsetPosition) ret.offsetPosition = vec2.clone(rImgDef.offsetPosition);

            if (!rImgDef.offsetSize)
                if (rImgDef.clipSize) ret.offsetSize = vec2.clone(rImgDef.clipSize);
                else ret.offsetSize = vec2.fromValues(ret.image.width, ret.image.height);
            else ret.offsetSize = vec2.clone(rImgDef.offsetSize);

            if (rImgDef.clipPosition) ret.clipPosition = vec2.clone(rImgDef.clipPosition);

            if (!rImgDef.clipSize)
                ret.clipSize = vec2.fromValues(ret.image.width, ret.image.height);
            else ret.clipSize = vec2.clone(rImgDef.clipSize);
        }

        if (aImgDef.animations) {
            ret.animations = {};
            for (let name in aImgDef.animations) {
                const animation = aImgDef.animations[name];

                // Put in frames per millisecond.
                let framesPerMillisecond: number = animation.framesPerMillisecond;
                if (!framesPerMillisecond) {
                    if (!animation.framesPerSecond) {
                        framesPerMillisecond = 30000; // default to 30/sec
                    } else {
                        framesPerMillisecond = animation.framesPerSecond / 1000;
                    }
                }

                let repeatMethod: "none" | "loop" | "bounce" = "none";
                if (animation.repeatMethod) {
                    repeatMethod = animation.repeatMethod;
                }
                const newAnimation: RenderAnimation = {
                    framesPerMillisecond,
                    repeatMethod,
                    frames: [],
                    getFrame: (animFrame: number) => animFrame
                };
                ret.animations[name] = newAnimation;

                // Only play once, by default.
                newAnimation.getFrame = (animFrame: number) => {
                    return Math.min(animFrame, newAnimation.frames.length - 1);
                };
                if (newAnimation.repeatMethod == "loop") {
                    // Or loop back to the beginning
                    newAnimation.getFrame = (animFrame: number) => {
                        return animFrame % newAnimation.frames.length;
                    };
                } else if (newAnimation.repeatMethod == "bounce") {
                    // Or bounce front to back to front to back
                    newAnimation.getFrame = (animFrame: number) => {
                        const reversals = Math.floor(animFrame / (newAnimation.frames.length - 1));
                        const left = animFrame - reversals * (newAnimation.frames.length - 1);

                        ret.animationDir *= Math.pow(-1, reversals);
                        if (ret.animationDir == 1) return left;
                        else return newAnimation.frames.length - 1 - left;
                    };
                }

                newAnimation.frames = [];
                if (animation.frames instanceof Array) {
                    for (let i = 0; i < animation.frames.length; i++) {
                        newAnimation.frames.push(this._processImage(animation.frames[i]));
                    }
                } else if (typeof animation.frames === "number") {
                    const frameTemplate = this._processImage(animation);
                    for (let i = 0; i < animation.frames; i++) {
                        newAnimation.frames.push({
                            image: frameTemplate.image,
                            rotation: frameTemplate.rotation,
                            offsetPosition: frameTemplate.offsetPosition,
                            offsetSize: frameTemplate.offsetSize,
                            clipSize: frameTemplate.clipSize,
                            clipPosition: vec2.fromValues(
                                frameTemplate.clipPosition[0] + animation.frameSpacing[0] * i,
                                frameTemplate.clipPosition[1] + animation.frameSpacing[1] * i
                            )
                        });
                    }
                }
            }

            // Setting default animation is up to them. If it isn't set, then
            // the 'default' is to show the image at the root.
            if (typeof aImgDef.defaultAnimation === "string") {
                ret.defaultAnimation = aImgDef.defaultAnimation;
                ret.curAnimation = ret.animations[ret.defaultAnimation];
            }
        }

        return ret;
    }

    startAnimation(animation: string) {
        if (this.image.animations[animation]) {
            this.image.curAnimation = this.image.animations[animation];
            this.image.animationStartTime = 0;
        }
    }

    stopAnimation() {
        this.image.curAnimation = null;
        this.image.animationStartTime = 0;
        if (this.image.defaultAnimation) {
            this.startAnimation(this.image.defaultAnimation);
        }
    }

    drawImage(camera: DefaultCamera, image: RenderableImage) {
        camera.context.save();

        const diam = this.radius * 2;
        const ratioX = diam / this.image.offsetSize[0];
        const ratioY = diam / this.image.offsetSize[1];
        camera.context.rotate(image.rotation);
        camera.context.translate(
            -(this.radius + this.image.offsetPosition[0] * ratioX),
            -(this.radius + this.image.offsetPosition[1] * ratioY)
        );

        camera.context.drawImage(
            this.image.image,
            image.clipPosition[0],
            image.clipPosition[1],
            image.clipSize[0],
            image.clipSize[1],
            0,
            0,
            this.image.clipSize[0] * ratioX,
            this.image.clipSize[1] * ratioY
        );

        camera.context.restore();
    }

    _getFrame(animationTime: number) {
        let frame = 0;
        if (!this.image.animationStartTime) this.image.animationStartTime = animationTime;
        else
            frame = Math.floor(
                (animationTime - this.image.animationStartTime) *
                    this.image.curAnimation.framesPerMillisecond
            );

        // Constrain frame to total animation frames.
        frame = this.image.curAnimation.getFrame(frame);

        return this.image.curAnimation.frames[frame];
    }

    draw(camera: DefaultCamera, time: RefreshTime) {
        camera.context.translate(this.position[0], this.position[1]);
        camera.context.rotate(this.rotation);

        if (this.image) {
            if (this.image.curAnimation) {
                this.drawImage(camera, this._getFrame(time.animationTime));
            } else {
                this.drawImage(camera, this.image);
            }
        } else {
            camera.context.fillStyle = this.color;
            camera.context.beginPath();

            camera.context.arc(0, 0, this.radius, 0, Math2D.twoPi);
            camera.context.fill();
        }
    }
}
