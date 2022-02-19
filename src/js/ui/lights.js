// import * as events from '/src/js/lib/events';
// import {makeEl, makeText} from '/src/js/lib/ui/components/html';
// import {addNavItem} from '/src/js/lib/ui/components/nav';
import {TabGroup} from '/src/js/lib/ui/components/tabs';
import {PrefKey} from '/src/js/lib/storage';

export default function setup() {
    let editorTabs = TabGroup.getGroup('editor-tabs');
    let lightsTab = editorTabs.addTab(
        'lights-edit',
        'Lights',
        false,
        `<div class="container">
            <div class="row">
                <div class="col-xs-12 col-lg-6">
                    <h2>Light Types</h2>
                    <textarea name="light-types" class="form-control"></textarea>
                    <button type="button" class="btn btn-primary" name="save-light-types">Save</button>
                    <button type="button" class="btn btn-default" name="reset-light-types">Reset</button>
                </div>
                <div class="col-xs-12 col-lg-6">
                    <h2>Lights</h2>
                    <textarea name="lights" class="form-control"></textarea>
                    <button type="button" class="btn btn-primary" name="save-lights">Save</button>
                    <button type="button" class="btn btn-default" name="reset-lights">Reset</button>
                </div>
            </div>
        </div>`,
    );
    let lightTypesInput = lightsTab.pane.querySelector('[name=light-types]');
    let lightsInput = lightsTab.pane.querySelector('[name=lights]');
    let lightTypesData = new PrefKey('lights.types', {});
    let lightsData = new PrefKey('lights.lights', {});
    lightTypesInput.value = JSON.stringify(lightTypesData.val, null, 4);
    lightsInput.value = JSON.stringify(lightsData.val, null, 4);

    lightsTab.pane.querySelector('[name=save-light-types]').addEventListener('click', e => lightTypesData.val = JSON.parse(lightTypesInput.value));
    lightsTab.pane.querySelector('[name=save-lights]').addEventListener('click', e => lightsData.val = JSON.parse(lightsInput.value));

    lightsTab.pane.querySelector('[name=reset-light-types]').addEventListener('click', e => lightTypesInput.value = JSON.stringify(lightTypesData.val, null, 4));
    lightsTab.pane.querySelector('[name=reset-lights]').addEventListener('click', e => lightsInput.value = JSON.stringify(lightsData.val, null, 4));
}