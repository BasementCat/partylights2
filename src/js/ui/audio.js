import * as events from '/src/js/lib/events';
import {makeEl, makeText} from '/src/js/lib/ui/components/html';
import {addNavItem} from '/src/js/lib/ui/components/nav';
import {PrefKey} from '/src/js/lib/storage';

export default function setup() {
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
}