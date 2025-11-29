import { Light, LightProperties } from "../light";

export interface AmbientLightProperties extends LightProperties {}

export class AmbientLight extends Light {
    constructor(props: AmbientLightProperties) {
        super(props);

        this.classTags.push("ambient");
    }
}
