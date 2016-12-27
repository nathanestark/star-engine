export const CONTROLLER_ACTION = 'action';
export const CONTROLLER_VALUE = 'value';
export default class InputController {
    constructor() {
        this.classTags = ["controller"];

        this.devices = new Map();
        this.binds = new Map();
        this.on = new Map();
    }

    // Register an input device 
    registerDevice(deviceName, registerCall, triggerCall) {

        if(this.devices.has(deviceName))
            throw "Device '"+deviceName+"' is already registered.";

        const device = {
            name: deviceName,
            triggerCall: tCall,
            values: new Map()
        };

        const tCall = (event) => {
            const tcEvent = triggerCall(event);

            // Set value, or remove value.
            if(typeof(tcEvent.value) !== 'boolean' || tcEvent.value) {
                device.values.set(tcEvent.key, tcEvent.value);
            } else {
                device.values.delete(tcEvent.key);
            }

            // We don't want to trigger bound commands here, since that
            // needs to happen at the proper time during the game loop.
        };
        registerCall(tCall);

        this.devices.set(deviceName, device);
    }

    // Unregister an input device.
    unregisterDevice(deviceName, unregisterCall) {
        if(!this.devices.has(deviceName))
            throw "Device '"+deviceName+"' is not registered.";
        
        // First unregister
        unregisterCall(this.devices.get(deviceName).triggerCall);

        // Should we deactivate any bound actions? What about values?
    }

    // Keys should be one or an array of objects with the properties:
    // {
    //   device: deviceName,
    //   key: key   
    // }
    bindCommand(keys, type, command) {

        if(typeof(command) === 'function' && type != CONTROLLER_ACTION) {
            throw "Only binds of type 'action' can have commands set to a function.";
        }

        if(keys instanceof Array)
            keys.sort((keyA, keyB) => {
                // Device first, key second
                if(keyA.device < keyB.device)
                    return -1;
                else if(keyA.device > keyB.device)
                    return 1;
                else if(keyA.key < keyB.key)
                    return -1;
                else if(keyA.key > keyB.key)
                    return 1;
                return 0;
            });
        else
            keys = [keys];

        for(let i = 0; i < keys.length; i++) { 
            if(!this.devices.has(keys[i].device))
                throw "Device '"+keys[i].device+"' is not registered.";
        }
        
        // Determine the key for the bind.
        const key = type + ":" + keys.map((k) => {
            return k.device + "-" + k.key;
        }).join(",");

        // Find out if this bind is already set or not.
        let curVal = this.binds.get(key);
        if(!curVal)
            curVal = [];
        curVal.push({
            keys: keys,
            type: type,
            command: command,
            isFunction: typeof(command) === 'function'
        });
        this.binds.set(key, curVal);
    }

    unbindCommand(keys, type, command) {
        if(keys instanceof Array)
            keys.sort((keyA, keyB) => {
                // Device first, key second
                if(keyA.device < keyB.device)
                    return -1;
                else if(keyA.device > keyB.device)
                    return 1;
                else if(keyA.key < keyB.key)
                    return -1;
                else if(keyA.key > keyB.key)
                    return 1;
                return 0;
            });
        else
            keys = [keys];
        
        // Determine the key for the bind.
        const key = type + ":" + keys.map((k) => {
            return k.device + "-" + k.key;
        }).join(",");

        // Find out if this bind is already set or not.
        const curVal = this.binds.get(key);
        if(curVal) {
            for(let i = 0; i < curVal.length; i++) {
                if(curVal[i].command == command) {
                    // We found our command to unbind.
                    curVal.splice(i,1);
                    break;
                }                
            }
            // Is curVal empty?
            if(curVal.length == 0) {
                // If curVal is empty, remove it from the binds.
                this.binds.delete(key);
            }
        }
    }

    // During update is when we compare values to binds and trigger commands.
    update() {
        // In general, the user will never have more than a few buttons pressed
        // at one time. Using brute force here is likely just fine.

        // Go through all the 'on' binds and ensure those keys are still down.
        const off = [];
        for(let [key, value] of this.on) {
            for(let i = 0; i < value.keys.length; i++) {
                const device = this.devices.get(value.keys[i].device);
                if(!device || !device.values.has(value.keys[i].key)) {
                    // If one of them no longer has a value, then we need
                    // to delete and break out.
                    this.on.delete(key);
                    off.push(key);
                    break;
                }
            }
        }
        // Go through each one that was turned off and trigger the off.
        for(let i = 0; i < off.length; i++) {
            const curVal = this.binds.get(off[i]);
            if(curVal && curVal.length > 0) {
                for(let j = 0; j < curVal.length; j++){
                    if(curVal[j].isFunction)
                        curVal[j].command(false);
                }
            }
        }

        // Get a list of all pressed binds.
        const keys = []; 
        for(let [dKey, dValue] of this.devices) {
            for(let [vKey, vValue] of dValue.values) {
                keys.push({ device: dKey, key: vKey });
            }
        }

        if(!keys.length)
            return;

        // Sort this list
        keys.sort((keyA, keyB) => {
            // Device first, key second
            if(keyA.device < keyB.device)
                return -1;
            else if(keyA.device > keyB.device)
                return 1;
            else if(keyA.key < keyB.key)
                return -1;
            else if(keyA.key > keyB.key)
                return 1;
            return 0;
        });

        const tried = new Map();
        let _testOnActions = null;
        _testOnActions = (keys) => {
            // Only actions can be triggered.
            const sKey = keys.map((k) => {
                return k.device + "-" + k.key;
            }).join(",");
            let key = CONTROLLER_ACTION + ":" + sKey;

            // Don't try any we've already tried.
            if(tried.has(key))
                return;

            tried.set(key, true);

            // Does this match a bind?
            const curVal = this.binds.get(key);
            if(curVal && curVal.length > 0) {
                // It does!

                // If this bind is not in the 'on' list, it should be turned on.
                if(!this.on.has(key)) {
                    this.on.set(key, { keys: keys, type: CONTROLLER_ACTION });

                    // And trigger the callback
                    for(let j = 0; j < curVal.length; j++){
                        if(curVal[j].isFunction)
                            curVal[j].command(true);
                    }
                }
            } else {
                // Then test for value.
                key = CONTROLLER_VALUE + ":" + sKey;

                // Don't try any we've already tried.
                if(tried.has(key))
                    return;

                tried.set(key, true);

                // Does this match a bind?
                const curVal = this.binds.get(key);
                if(curVal) {
                    // It does!

                    // If this bind is not in the 'on' list, it should be turned on.
                    if(!this.on.has(key)) {
                        this.on.set(key, { keys: keys, type: CONTROLLER_VALUE });

                        // There will never be a function command for this type.
                    }
                } else {
                    // if we didn't match, maybe one of us sub-combinations matches.
                    for(let i = 0; i < keys.length; i++) {
                        const newKeys = keys.slice();
                        newKeys.splice(i, 1);
                        _testOnActions(newKeys);
                    }
                }
            }
        };
        _testOnActions(keys);
    }
}