import {AudioInput} from '/src/js/lib/audio/capture';
import {AudioAnalyzer} from '/src/js/lib/audio/analysis';

import setup_audio_ui from '/src/js/ui/audio';

import setup_audiographs from '/src/js/lib/ui/audiographs';

const input = new AudioInput();
const analyzer = new AudioAnalyzer();

setup_audio_ui();

setup_audiographs();
