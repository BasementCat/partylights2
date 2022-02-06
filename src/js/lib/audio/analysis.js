import {FEATURES} from '/src/js/lib/constants';
import * as events from '/src/js/lib/events';

import 'Meyda';
import {RealTimeBPMAnalyzer} from 'realtime-bpm-analyzer';

export class AudioConsumer {
    constructor() {
        events.subscribe('input/audio/start', this.start.bind(this));
        events.subscribe('input/audio/stop', this.stop.bind(this));
    }
    start(event, input) {}
    stop(event, input) {}
}

// TEMP TESTING
// class BeatDetector extends AudioConsumer {
//     constructor() {
//         super();
//         this.min_tempo = 60;
//         this.max_tempo = 160;
//         this.buffer_size = 1024; // TODO: must come from the analyzer as it's the same
//         this.sample_rate = 44100; // TODO: must come from the analyzer as it's the same
//         this.min_beats = 2;
//         this.window_size_s = ((this.min_tempo * this.min_beats) / 60) * 1.1;
//         this.window_size_samples = Math.floor((this.window_size_s * this.sample_rate) / this.buffer_size) * this.buffer_size;
//         this.threshold = 0.95;
//         // this.freq_cutoff = 350;
//         this.freq_cutoff = 200;

//         this.max_bin = Math.ceil(this.freq_cutoff / ((this.sample_rate / 2) / (this.buffer_size / 2)));

//         this.window = null;

//         // console.log(this);
//     }

//     trim() {
//         while (this.window.length > this.window_size_chunks)
//             this.window.shift();
//     }

//     process(data) {
//         if (this.window === null) return;
//         let now = (new Date()).getTime();
//         let samples = data.inputBuffer.getChannelData(0);
//         this.window.copyWithin(0, this.buffer_size, this.window.length);
//         this.window.set(samples, this.window.length - samples.length);

//         // let peak = 0;
//         // for (let i = 0; i < this.max_bin; i++) {
//         //     peak = Math.max(peak, data[i]);
//         // }
//         // this.window.push([(new Date()).getTime(), peak]);
//         // this.trim();

//         // TODO: will include init 0s in the calculation, this is wrong until window_size_s is elapsed
//         let avg = this.window.reduce((p, c) => p + c) / this.window.length;
//         let min = this.window.reduce((p, c) => Math.min(p, c));
//         let max = this.window.reduce((p, c) => Math.max(p, c), min);

//         let thresh = this.threshold * avg;
//         let peaks = [];
//         // let diff = this.sample_rate / 500;
//         for (let i = 0; i < this.window.length; i++) {
//             // if (this.window[i] > thresh) {
//             // if (this.window[i] > avg) {
//             // if (this.window[i] > (0.95 * max)) {
//             // if (this.window[i] > avg * 1.25) {
//             // if (i - diff > 0 && this.window[i - diff] / this.window[i] < 0.1) {
//             if (((this.window[i] - min) / (max - min)) > 0.8) {
//                 peaks.push(i);
//                 i += Math.floor(this.sample_rate / 4);
//             }
//         }

//         // let avg = 0, max = 0;
//         // this.window.forEach(v => { avg += v[1]; max = Math.max(max, v[1]); });
//         // avg /= this.window.length;

//         // let peaks = [], thresh = this.threshold * avg;
//         // this.window.forEach(v => (v[1] > thresh) && peaks.push(v[0]));

//         let dists = [];
//         for (let i = 0; i < peaks.length; i++) {
//             if (i > 0) {
//                 let dist = (peaks[i] - peaks[i - 1]) / this.sample_rate;
//                 dists.push(Math.round((dist + Number.EPSILON) * 10) / 10);
//             }
//         }
//         dists.sort((a, b) => a - b);

//         console.log(dists);
//     }

//     start(event, input) {
//         this.window = new Float32Array(this.window_size_samples);

//         // this.filter = input.context.createBiquadFilter();
//         // this.filter.type = 'lowpass';
//         // this.filter.frequency = this.freq_cutoff;
//         this.filter = new BiquadFilterNode(input.context, {type: 'lowpass', frequency: this.freq_cutoff});
//         input.source.connect(this.filter);

//         this.processor = input.context.createScriptProcessor(this.buffer_size, 1, 1);
//         this.processor.onaudioprocess = this.process.bind(this);
//         this.filter.connect(this.processor);
//         this.processor.connect(input.context.destination);
//     }

//     stop(event, input) {
//         this.processor.disconnect(input.context.destination);
//         this.filter.disconnect(this.processor);
//         input.source.disconnect(this.filter);
//         this.filter = this.processor = this.window = null;
//     }
// }

class BeatDetector extends AudioConsumer {
    constructor() {
        super();
        // this.min_tempo = 60;
        // this.max_tempo = 160;
        this.buffer_size = 8192; // TODO: must come from the analyzer as it's the same
        // this.sample_rate = 44100; // TODO: must come from the analyzer as it's the same
        // this.min_beats = 2;
        // this.window_size_s = ((this.min_tempo * this.min_beats) / 60) * 1.1;
        // this.window_size_samples = Math.floor((this.window_size_s * this.sample_rate) / this.buffer_size) * this.buffer_size;
        // this.threshold = 0.95;
        // // this.freq_cutoff = 350;
        // this.freq_cutoff = 200;

        // this.max_bin = Math.ceil(this.freq_cutoff / ((this.sample_rate / 2) / (this.buffer_size / 2)));

        // this.window = null;

        // // console.log(this);
    }

    process(data) {
        this.analyzer.analyze(data);
    }

    start(event, input) {
        this.analyzer = new RealTimeBPMAnalyzer({
            scriptNode: {
                bufferSize: this.bufferSize
            },
            pushTime: 2000,
            pushCallback: (err, bpm) => {
                console.error(err);
                console.log('bpm', bpm);
            }
        });
        this.processor = input.context.createScriptProcessor(this.buffer_size, 1, 1);
        this.processor.onaudioprocess = this.process.bind(this);
        input.source.connect(this.processor);
        this.processor.connect(input.context.destination);
    }

    stop(event, input) {
        this.processor.disconnect(input.context.destination);
        input.source.disconnect(this.processor);
        this.processor = this.analyzer = null;
    }
}

// let bd = new BeatDetector();

let l = Math.floor(43 * 2.2);
let v = [], t = [];
for (let i = 0; i < l; i++) {
    v.push(0);
}
let ign = 0;
let intv = null;

export class AudioAnalyzer extends AudioConsumer {
    constructor() {
        super();
        this.analyzer = null;
        this.bufferSize = 1024;
        this.mfccCoefficients = 13;
        this.features = Object.keys(FEATURES).filter(f => f !=='_default');
    }

    start(event, input) {
        let last_log = (new Date()).getTime(), count = 0;
        events.fire('audio/analysis/features', this, {input, sampleRate: input.context.sampleRate, bufferSize: this.bufferSize, features: this.features});
        this.analyzer = Meyda.createMeydaAnalyzer({
            audioContext: input.context,
            source: input.source,
            bufferSize: this.bufferSize,
            numberOfMFCCCoefficients: this.mfccCoefficients,
            featureExtractors: this.features,
            callback: (features) => {
                count++;
                if ((new Date()).getTime() - last_log > 1000) {
                    console.log(features);
                    console.log(count);
                    last_log = (new Date()).getTime();
                    count = 0;
                }
                events.fire('audio/analysis/data', this, features);

                let p = 0;
                for (let i = 0; i < 5; i ++) {
                    p = Math.max(p, features.amplitudeSpectrum[i]);
                }
                v.push(p);
                v.shift();
                if (ign > 0) {
                    ign--;
                    return;
                }
                let max = v.reduce((p, c) => Math.max(p, c));
                let min = v.reduce((p, c) => Math.min(p, c));
                // console.log((p - min) / (max - min));
                let is_beat = false;
                if ((p - min) / (max - min) > 0.8) {
                    console.log('onset?');
                    is_beat = true;
                    ign = 4;
                    t.push((new Date()).getTime());
                }
                t = t.filter(n => n > (new Date()).getTime() - 7000);

                let dists = t
                    .map((n, i) => i > 0 ? n - t[i - 1] : null)
                    .filter(n => n !== null && n <= 1000 && n >=300)
                    .map(n => Math.floor(n / 10) * 10);

                // dists.sort((a, b) => a - b);
                let out = {};
                dists.map(n => {
                    out[n] = out[n] || 0;
                    out[n]++;
                });

                out = Object.entries(out).filter(n => n[1] >= 2);
                if (out.length) {
                    out.sort((a, b) => a > b ? 1 : (a < b ? -1 : 0));
                    // console.log('bpm', 60000 / parseInt(out[0][0]));
                    if (is_beat) {
                        if (intv)
                            window.clearInterval(intv);
                        intv = window.setInterval(function() { console.log('beat'); }, parseInt(out[0][0]));
                    }
                }

                // console.log(dists);
            },
        });
        this.analyzer.start();
    }

    stop(event, input) {
        events.fire('audio/analysis/stop', this);
        this.analyzer.stop();
        this.analyzer = null;
    }
}

/* basic algo:
props: min/max tempo (60,160?), buffer size, window size (min tempo * 1.1), C=0.95?
lpf of signal
put chunk in rolling window w/ ts
find peaks where peak > C * avg(window)
histogram of distances between peaks
confidence is 2nd highest hist / max hist
calc tempo: 60 / (window size / sample rate)
while tempo < min tempo, *=2
while tempo > max tempo, /= 2
if current block contains a peak, & distance from last peak in max hist, this is probably a beat
likewise, if block @ now - tempo looks like a beat, probably a beat (predicted)
*/