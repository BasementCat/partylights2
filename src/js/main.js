import {AudioInput} from '/src/js/lib/audio/capture';
import {AudioAnalyzer} from '/src/js/lib/audio/analysis';

import {TabGroup} from '/src/js/lib/ui/components/tabs';

import setup_audio_ui from '/src/js/ui/audio';


const input = new AudioInput();
const analyzer = new AudioAnalyzer();

// TODO: global ui stuff?
new TabGroup(document.querySelector('main.container'), 'editor-tabs');

setup_audio_ui();
