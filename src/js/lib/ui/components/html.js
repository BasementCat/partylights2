export function makeEl(tag, attrs, classes, children) {
    const el = document.createElement(tag);
    Object.entries(attrs || {}).forEach(e => {
        el.setAttribute(e[0], e[1]);
    });
    (classes || []).forEach(c => {
        el.classList.add(c);
    });
    (children || []).forEach(c => {
        el.appendChild(c);
    });
    return el;
}

export function makeText(text) {
    return document.createTextNode(text);
}