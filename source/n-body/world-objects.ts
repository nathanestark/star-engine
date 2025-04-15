import DefaultCamera from "./default-camera";
import GameObject from "source/core/game-object";
import Body from "./body";

export default class WorldObjects extends GameObject {
    childrenSort(camera: DefaultCamera, children: Array<Body>): Array<GameObject> {
        // Sort children by view depth.
        let ret = children.slice();

        ret.sort((a, b) => {
            if (camera.view == "x") {
                return a.position[2] - b.position[2];
            } else if (camera.view == "y") {
                return a.position[1] - b.position[1];
            } else if (camera.view == "z") {
                return a.position[0] - b.position[0];
            }
        });

        return ret;
    }
}
