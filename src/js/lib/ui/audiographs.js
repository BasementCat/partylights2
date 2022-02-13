import * as events from '/src/js/lib/events';

export default function setup() {
    let container = document.getElementById('graphs');
    let el = document.createElement('div');
    el.id = 'meter';

    let html = '';
    ['sub', 'bass', 'low_mid', 'mid', 'high_mid', 'presence', 'brilliance'].forEach(b => {
        html += `<div class="bin ${b}"><div class="cover"></div><div class="bar"></div></div>`;
    });
    el.innerHTML = html;
    container.appendChild(el);

    events.subscribe('audio/analysis/data', (ev, analyzer, data) => {
        Object.keys(data).forEach(b => {
            let d = data[b];
            let bin = el.querySelector('.bin.' + b);
            let cover = bin.querySelector('.cover');
            let bar = bin.querySelector('.bar');

            bar.style.bottom = (d.gain * 100) + '%';
            cover.style.height = ((1 - d.smooth) * 100) + '%';

            if (d.onset)
                bin.classList.add('onset');
            else
                bin.classList.remove('onset');
        });
    });
}