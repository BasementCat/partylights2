import * as events from '/src/js/lib/events';
import {makeEl, makeText} from '/src/js/lib/ui/components/html';
import {addNavItem} from '/src/js/lib/ui/components/nav';
import {TabGroup} from '/src/js/lib/ui/components/tabs';
import {PrefKey} from '/src/js/lib/storage';

export default function setup() {
    // Device selection & control
    let inputSelect = addNavItem('<select class="form-select" id="inputs"></select>').querySelector('#inputs');
    let startStopButton = addNavItem('<button class="btn btn-danger" id="startstop">Start</button>').querySelector('#startstop');
    let selectedDevice = new PrefKey('capture.selectedDevice', null);
    let isRunning = new PrefKey('capture.isRunning', false);

    events.subscribe('input/audio/setup', (ev, input, devices) => {
        let didSelect = false;
        devices.forEach(d => {
            let el = makeEl('option', {value: d.deviceId}, false, [makeText(d.label)]);
            if (selectedDevice.val && el.value === selectedDevice.val) {
                el.selected = true;
                input.selectDevice(selectedDevice.val);
                didSelect = true;
            }
            inputSelect.appendChild(el);
        });

        if (!didSelect) {
            if (devices) {
                let opt = inputSelect.querySelectorAll('option')[0];
                opt.selected = true;
                input.selectDevice(opt.value);
                selectedDevice.val = opt.value;
            } else {
                selectedDevice.val = null;
            }
        }

        let updateButton = () => {
            if (isRunning.val) {
                startStopButton.innerHTML = 'Stop';
                startStopButton.classList.remove('btn-danger');
                startStopButton.classList.add('btn-success');
            } else {
                startStopButton.innerHTML = 'Start';
                startStopButton.classList.add('btn-danger');
                startStopButton.classList.remove('btn-success');
            }
        };

        if (isRunning.val) {
            if (selectedDevice.val) {
                input.start();
            } else {
                isRunning.val = false;
            }
            updateButton();
        }

        inputSelect.addEventListener('change', e => {
            let opt = inputSelect.querySelector('option:selected');
            if (!opt) {
                selectedDevice.val = null;
                input.stop();
                updateButton();
            } else {
                input.selectDevice(opt.value);
                selectedDevice.val = opt.value;
            }
        });

        startStopButton.addEventListener('click', e => {
            isRunning.val = input.toggleRunning();
            updateButton();
        });
    });


    // Monitoring
    let editorTabs = TabGroup.getGroup('editor-tabs');
    editorTabs.addTab(
        'audio-monitor',
        'Monitor',
        true,
        '<div id="audio-monitor-graphs"></div>',
    );

    let graphContainer = document.getElementById('audio-monitor-graphs');
    let meterContainer;
    events.subscribe('audio/analysis/start', (ev, analyzer) => {
        meterContainer = document.createElement('div');
        meterContainer.id = 'meter';

        let bins = Object.keys(analyzer.freqGroups).map(k => [k, analyzer.freqGroups[k][0]]);
        bins.sort((a, b) => a[1] - b[1]);
        bins = bins.map(b => b[0]);

        let html = '';
        bins.forEach(b => {
            html += `<div class="bin ${b}"><div class="cover"></div><div class="bar"></div></div>`;
        });
        meterContainer.innerHTML = html;
        graphContainer.appendChild(meterContainer);
    });

    events.subscribe('audio/analysis/data', (ev, analyzer, data) => {
        Object.keys(data.bins).forEach(b => {
            let d = data.bins[b];
            let bin = meterContainer.querySelector('.bin.' + b);
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
        graphContainer.innerHTML = '';
        meterContainer = null;
    });
}