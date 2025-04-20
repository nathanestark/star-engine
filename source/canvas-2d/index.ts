import { GameObject2D, Size } from "./types";
import * as Math2D from "./math-2d";
import { formatVector } from "./format";
import Canvas2DCamera, { Canvas2DCameraProperties } from "./cameras/canvas-2d-camera";
import FollowCamera, { FollowCameraProperties } from "./cameras/follow-camera";
import Collider, { Collidable, ColliderProperties } from "./collision-detection/collider";
import CollisionDetection from "./collision-detection/collision-detection";
import QuadTree from "./collision-detection/quad-tree";
import CircleCollider, {
    CircleCollidable,
    CircleColliderProperties
} from "./collision-detection/circle-collider";
import BoundingBoxCollider, {
    BoundingBoxCollidable,
    BoundingBoxColliderProperties
} from "./collision-detection/bounding-box-collider";
import {
    testCircleOnCircleCollisons,
    testCircleOnBoundingBoxCollisions,
    testBoundingBoxOnBoundingBoxCollisions,
    CollisionResult,
    ColliderResult,
    CircleColliderResult,
    BoundingBoxColliderResult
} from "./collision-detection/collider-operations";
import Hud, { HudProperties } from "./huds/hud";
import FPSHud, { FPSHudProperties } from "./huds/fps-hud";
import TextHud, { TextHudProperties } from "./huds/text-hud";

export {
    GameObject2D,
    Size,
    Math2D,
    formatVector,
    Canvas2DCamera,
    Canvas2DCameraProperties,
    FollowCamera,
    FollowCameraProperties,
    Collider,
    Collidable,
    ColliderProperties,
    CollisionDetection,
    QuadTree,
    CircleCollider,
    CircleCollidable,
    CircleColliderProperties,
    BoundingBoxCollider,
    BoundingBoxCollidable,
    BoundingBoxColliderProperties,
    testCircleOnBoundingBoxCollisions,
    testCircleOnCircleCollisons,
    testBoundingBoxOnBoundingBoxCollisions,
    CollisionResult,
    ColliderResult,
    CircleColliderResult,
    BoundingBoxColliderResult,
    Hud,
    HudProperties,
    FPSHud,
    FPSHudProperties,
    TextHud,
    TextHudProperties
};
