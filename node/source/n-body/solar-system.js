import {vec2, vec3, quat} from 'gl-matrix';

import Body from './body';

export default class SolarSystemObjects {
    constructor(gravity) {
        this.objects = { 
            children: []
        };

        this.objects.children.push(new Body({
            position: vec3.fromValues(0, 0, 0),
            velocity: vec3.fromValues(0, 0, 0),
            mass: 1988550000000000000000000000000, // kg
            radius: 696342000, // m
            color: "#e9e8e2",
            name: "Sun"
        }));
        
        this.objects.children.push(new Body({
            position: vec3.fromValues(57900000000, 0, 0),
            velocity: vec3.fromValues(0, -47400, 0),
            mass: 330200000000000000000000, // kg
            radius: 2439700, // m 
            color: "#e9e8e2",
            name: "Mercury"
        }));
        
        this.objects.children.push(new Body({
            position: vec3.fromValues(108200000000, 0, 0),
            velocity: vec3.fromValues(0, -35000, 0),
            mass: 4868500000000000000000000, // kg
            radius: 6051800, // m  
            color: "#e9e8e2",
            name: "Venus"
        }));
        
        this.objects.children.push(new Body({
            position: vec3.fromValues(149600000000, 0, 0),
            velocity: vec3.fromValues(0, -29800, 0),
            mass: 5973600000000000000000000, // kg
            radius: 6371000, //m 
            color: "#e9e8e2",
            name: "Earth"
        }));
        
        this.objects.children.push(new Body({
            position: vec3.fromValues(227900000000, 0, 0),
            velocity: vec3.fromValues(0, -24100, 0),
            mass: 641850000000000000000000, // kg
            radius: 3389500, // m
            color: "#e9e8e2",
            name: "Mars"
        }));
        
        this.objects.children.push(new Body({
            position: vec3.fromValues(778600000000, 0, 0),
            velocity: vec3.fromValues(0, -13100, 0),
            mass: 1898600000000000000000000000, // kg
            radius: 69911000, // m
            color: "#e9e8e2",
            name: "Jupiter"
        }));
        
        this.objects.children.push(new Body({
            position: vec3.fromValues(1433500000000, 0, 0),
            velocity: vec3.fromValues(0, -9700, 0),
            mass: 568460000000000000000000000, // kg
            radius: 58232000, // m
            color: "#e9e8e2",
            name: "Saturn"
        }));
        
        this.objects.children.push(new Body({
            position: vec3.fromValues(2872500000000, 0, 0),
            velocity: vec3.fromValues(0, -6800, 0),
            mass: 86832000000000000000000000, // kg
            radius: 25362000, // m
            color: "#e9e8e2",
            name: "Uranus"
        }));
        
        this.objects.children.push(new Body({
            position: vec3.fromValues(4495100000000, 0, 0),
            velocity: vec3.fromValues(0, -5400, 0),
            mass: 102430000000000000000000000, // kg
            radius: 24622000, // m
            color: "#e9e8e2",
            name: "Neptune"
        }));
        
        this.objects.children.push(new Body({
            position: vec3.fromValues(5906400000000, 0, 0),
            velocity: vec3.fromValues(0, -4700, 0),
            mass: 1310500000000000000000, // kg
            radius: 1186000, // m
            color: "#e9e8e2",
            name: "Pluto"
        }));
    }
}
