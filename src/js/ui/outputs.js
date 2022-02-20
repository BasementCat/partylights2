import * as events from '/src/js/lib/events';
import {makeEl, makeText} from '/src/js/lib/ui/components/html';
import {TabGroup} from '/src/js/lib/ui/components/tabs';
import * as dmx from '/src/js/lib/outputs/dmx';
import {PrefKey} from '/src/js/lib/storage';

export default function setup() {
    let editorTabs = TabGroup.getGroup('editor-tabs');
    let outputTab = editorTabs.addTab(
        'output',
        'Output',
        false,
        `<div class="container input-types">
            <div class="row input-types">
                <div class="col-xs-12 col-md-6 col-lg-4 dmx">
                    <h2>DMX</h2>
                    <div>
                        <label>
                            DMX Device
                            <select name="dmx-device" class="form-select"></select>
                        </label>
                        <label>
                            &nbsp;
                            <button type="button" class="btn btn-primary detect-devices">Detect</button>
                        </label>
                    </div>
                </div>
            </div>
        </div>`
    );

    let dmxSelectedId = new PrefKey('dmx.device', null);
    let dmxSelect = outputTab.pane.querySelector('.input-types .dmx [name=dmx-device]');
    let dmxDetect = outputTab.pane.querySelector('.input-types .dmx .detect-devices');

    events.subscribe('dmx/devices', (ev, devices) => {
        dmxSelect.innerHTML = '';
        devices.forEach(d => {
            dmxSelect.appendChild(makeEl('option', {value: d.id}, false, [makeText(d.name)]));
        });
    });

    events.subscribe('dmx/selected', (ev, dev) => {
        dmxSelectedId.val = dmxSelect.value = dev ? dev.id : null;
    });

    dmxSelect.addEventListener('change', e => {
        dmx.selectDevice(parseInt(dmxSelect.value));
    });
    dmxDetect.addEventListener('click', dmx.detectDevices);

    events.subscribe('dmx/setup', (e) => dmx.selectDevice(dmxSelectedId.val));
}
