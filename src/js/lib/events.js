let events = {}


export function subscribe(event, callback) {
    events[event] = events[event] || [];
    events[event].push(callback);
}

export function fire(event) {
    let args = Array.prototype.slice.call(arguments);
    (events[event] || []).forEach(cb => cb.apply(null, args));
}