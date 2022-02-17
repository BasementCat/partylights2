import {makeEl} from '/src/js/lib/ui/components/html';

let navbar = document.querySelector('body>nav.navbar');
let navbar_ul = navbar.querySelector('ul.navbar-nav');

export function addNavItem(item) {
    let el = makeEl('li', false, ['nav-item']);
    if (typeof item === 'string') {
        el.innerHTML = item;
    } else {
        el.appendChild(item);
    }
    navbar_ul.appendChild(el);
    return el;
}