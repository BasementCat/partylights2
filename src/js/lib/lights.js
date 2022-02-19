import * as events from '/src/js/lib/events';
import {PrefKey} from '/src/js/lib/storage';

export let lightTypes = {};
export let lights = {};

export const lightTypesData = new PrefKey('lights.types', {});
export const lightsData = new PrefKey('lights.lights', {});

class ByProtocol {
    static register(protocol, cls) {
        this.typesByProtocol[protocol] = cls;
    }

    static getForProtocol(protocol) {
        return this.typesByProtocol[protocol];
    }
}

export class LightType extends ByProtocol {
    static typesByProtocol = {};

    static create(id, data) {
        const cls = this.getForProtocol(data.protocol);
        if (cls) {
            const obj = new cls(id, data);
            lightTypes[id] = obj;
            return obj;
        }
    }

    constructor(id, data) {
        super();
        this.id = id;
        this.protocol = data.protocol;
    }
}

class LTFunction {
    constructor(name, data) {
        this.name = name;
    }
}

class DMXLTFunctionMap {
    constructor(cond, data) {
        this.cond = cond || null;
        this.map = data;
    }
}

class DMXLTFunction extends LTFunction {
    constructor(name, data) {
        super(name, data);
        this.channel = data.channel || 0;
        this.speed = data.speed || null;
        this.type = data.type || 'range';
        this.maps = null;
        if (this.type === 'static') {
            if (data.map) {
                this.maps = [new DMXLTFunctionMap(null, data.map)];
            } else if (data.maps) {
                this.maps = [];
                data.maps.forEach(m => this.maps.push(new DMXLTFunctionMap(m.when, m.map)));
            }
        }
        this.invert = !!data.invert;
        this.uiHidden = !!data.ui_hidden;
        this.resets = false;
        if (data.resets) {
            if (typeof data.resets === 'array') {
                this.resets = data.resets;
            } else {
                this.resets = [0, 255];
            }
        }
    }
}

class DMXLightType extends LightType {
    static {
        this.register('dmx', this);
    }

    constructor(id, data) {
        super(id, data);
        this.channels = data.channels || 0;
        this.functions = {};
        Object.entries(data.functions || {}).forEach(f => {
            this.functions[f[0]] = new DMXLTFunction(f[0], f[1]);
        });
        this.initialize = data.initialize || {};
    }
}


export class Light extends ByProtocol {
    static typesByProtocol = {};

    static create(id, data) {
        const type = lightTypes[data.type];
        if (type) {
            const cls = this.getForProtocol(type.protocol);
            if (cls) {
                const obj = new cls(id, type, data);
                lights[id] = obj;
                return obj;
            }
        }
    }

    constructor(id, type, data) {
        super();
        this.id = id;
        this.type = type;
        this.groups = data.groups || [];
    }
}

class DMXLight extends Light {
    static {
        this.register('dmx', this);
    }

    constructor(id, type, data) {
        super(id, type, data);
        this.address = data.address || 0;
        this.initialize = data.initialize || {};

        this.state = {};
        Object.keys(this.type.functions).forEach(f => {
            this.state[f] = this.initialize[f] || this.type.initialize[f] || 0;
        });
        /* TODO:
        way to get state, taking into account inversion
            also opt to get map?
        */
    }
}

function loadLights() {
    lightTypes = {};
    lights = {};

    Object.entries(lightTypesData.val).forEach(lt => LightType.create(lt[0], lt[1]));
    Object.entries(lightsData.val).forEach(l => Light.create(l[0], l[1]));

    events.fire('lights/init', lightTypes, lights);
}

events.subscribe('lights/saved', loadLights);
loadLights();
