import * as events from '/src/js/lib/events';

export default function setup() {
    let container = document.getElementById('graphs');
    let el;
    events.subscribe('audio/analysis/start', (ev, analyzer) => {
        el = document.createElement('div');
        el.id = 'meter';

        let bins = Object.keys(analyzer.freqGroups).map(k => [k, analyzer.freqGroups[k][0]]);
        bins.sort((a, b) => a[1] - b[1]);
        bins = bins.map(b => b[0]);

        let html = '';
        bins.forEach(b => {
            html += `<div class="bin ${b}"><div class="cover"></div><div class="bar"></div></div>`;
        });
        el.innerHTML = html;
        container.appendChild(el);
    });

    events.subscribe('audio/analysis/data', (ev, analyzer, data) => {
        Object.keys(data.bins).forEach(b => {
            let d = data.bins[b];
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

    events.subscribe('audio/analysis/stop', (ev, analyzer) => {
        container.innerHTML = '';
        el = null;
    });
}