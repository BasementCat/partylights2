let prefs = null;

const STORAGE_KEY = 'partylights2-prefs';

export class Prefs {
    constructor(data) {
        Object.entries(data || {}).forEach(pair => this[pair[0]] = pair[1]);
    }

    static load() {
        if (prefs === null) {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                try {
                    prefs = new Prefs(JSON.parse(data));
                } catch (e) {
                    console.error("Failed to load prefs from %s: %o", STORAGE_KEY, e);
                    prefs = new Prefs();
                }
            } else {
                prefs = new Prefs();
            }
        }
        return prefs;
    }

    save() {
        let data = {};
        Object.entries(this).forEach(pair => {
            if (this.hasOwnProperty(pair[0]) && typeof pair[1] !== 'function')
                data[pair[0]] = pair[1];
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    get(key, dfl) {
        let val = this;
        key.split('.').forEach(part => {
            if (typeof val === 'object') {
                val = val[part];
            } else if (typeof val === 'array') {
                val = val[parseInt(part)];
            } else {
                val = undefined;
            }
        });
        if (val === undefined)
            return dfl;
        return val;
    }

    set(key, val) {
        let obj = this;
        let parts = key.split('.');
        let lastkey = parts.pop();
        parts.forEach((part, i) => {
            let dflNextVal = i + 1 >= parts.length ? lastkey : parts[i + 1];
            let dflNext = isNaN(parseInt(dflNextVal)) ? {} : [];
            if (typeof obj === 'object') {
                if (obj[part] === undefined) obj[part] = dflNext;
                obj = obj[part];
            } else if (typeof obj === 'array') {
                if (obj[parseInt(part)] === undefined) obj[parseInt(part)] = dflNext;
                obj = obj[parseInt(part)];
            } else {
                obj = undefined;
            }
        });
        if (typeof obj === 'object') {
            obj[lastkey] = val;
        } else if (typeof obj === 'array') {
            obj[parseInt(lastkey)] = val;
        } else {
            throw `Key ${key} is invalid`;
        }
    }
}

export class PrefKey {
    constructor(name, dfl) {
        this.name = name;
        this.dfl = dfl;
        this.prefs = Prefs.load();
    }

    get val() {
        return this.prefs.get(this.name, this.dfl);
    }

    set val(value) {
        this.prefs.set(this.name, value);
        this.prefs.save();
    }
}