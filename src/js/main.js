import {AudioInput} from '/src/js/lib/audio/capture';
import {AudioAnalyzer} from '/src/js/lib/audio/analysis';

import * as lights from '/src/js/lib/lights';
import * as dmx from '/src/js/lib/outputs/dmx';

import {TabGroup} from '/src/js/lib/ui/components/tabs';

import setup_audio_ui from '/src/js/ui/audio';
import setup_lights_ui from '/src/js/ui/lights';
import setup_outputs_ui from '/src/js/ui/outputs';


const input = new AudioInput();
const analyzer = new AudioAnalyzer();

// TODO: global ui stuff?
new TabGroup(document.querySelector('main.container'), 'editor-tabs');

setup_audio_ui();
setup_lights_ui();
setup_outputs_ui();

dmx.setup();
