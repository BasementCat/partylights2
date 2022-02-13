import * as events from '/src/js/lib/events';

export class AudioConsumer {
    constructor() {
        events.subscribe('input/audio/start', this.start.bind(this));
        events.subscribe('input/audio/stop', this.stop.bind(this));
    }
    start(event, input) {}
    stop(event, input) {}
}

class ExpFilter {
    constructor(val, alpha_decay, alpha_rise) {
        this.val = val;
        this.alpha_decay = alpha_decay || 0.5;
        this.alpha_rise = alpha_rise || 0.5;
    }

    update_one(vOld, vNew) {
        let alpha = vNew > vOld ? this.alpha_rise : this.alpha_decay;
        return alpha * vNew + (1 - alpha) * vOld;
    }

    update(val, subkey) {
        if (typeof val === 'object') {
            Object.keys(val).forEach(k => {
                let vNew = val[k];
                if (subkey) vNew = vNew[subkey];
                this.val[k] = this.update_one(this.val[k], vNew);
            });
        } else if (typeof val === 'array') {
            val.forEach((v, i) => {
                this.val[i] = this.update_one(this.val[i], v);
            });
        } else {
            this.val = this.update_one(this.val, val);
        }
        return this.val;
    }
}

export class AudioAnalyzer extends AudioConsumer {
    constructor() {
        super();
        this.filter = null;
        this.analyzer = null;
        this.interval = null;

        this.fftSize = 2048;
        this.fps = 60;

        this.freqGroups = {
            sub: [0, 60],
            bass: [60, 250],
            low_mid: [250, 500],
            mid: [500, 2000],
            high_mid: [2000, 4000],
            presence: [4000, 6000],
            brilliance: [6000, 20000],
        };

        this.samplesLen = parseInt(this.fps * 2.2);
        this._resetProps();
    }

    _resetProps() {
        this.analyzer = this.buffer = this.interval = this.sampleRate = this.freqPerBin = this.fGain = this.fSmooth = null;
        this.samples = {};
        Object.keys(this.freqGroups).forEach(k => this.samples[k] = {samples: [], ignorePeaks: 0});
    }

    start(event, input) {
        this.sampleRate = input.context.sampleRate;
        this.freqPerBin = ((this.sampleRate / 2) / (this.fftSize / 2));
        this.analyzer = new AnalyserNode(input.context, {fftSize: this.fftSize});
        this.buffer = new Uint8Array(this.analyzer.frequencyBinCount);
        input.source.connect(this.analyzer);
        this.interval = window.setInterval(this.process.bind(this), 1 / this.fps);

        let temp = {};
        Object.keys(this.freqGroups).forEach(k => temp[k] = 0);
        this.fGain = new ExpFilter(temp, 0.01, 0.99);

        temp = {};
        Object.keys(this.freqGroups).forEach(k => temp[k] = 0);
        this.fSmooth = new ExpFilter(temp, 0.5, 0.99);
    }

    process() {
        this.analyzer.getByteFrequencyData(this.buffer);
        // 60-250hz
        let bins = {};
        this.buffer.forEach((v, i) => {
            let lfreq = this.freqPerBin * i;
            for (let key in this.freqGroups) {
                if (lfreq >= this.freqGroups[key][0] && lfreq < this.freqGroups[key][1]) {
                    bins[key] = bins[key] || [];
                    bins[key].push(v / 255);
                }
            }
        });
        for (let key in bins) {
            let max = bins[key].reduce((p, c) => p > c ? p : c);
            let avg = bins[key].reduce((p, c) => p + c) / bins[key].length;
            bins[key] = {'max': max, 'avg': avg};
        }
        this.fGain.update(bins, 'max');
        this.fSmooth.update(bins, 'max');
        Object.keys(bins).forEach(k => {
            bins[k].gain = this.fGain.val[k];
            bins[k].smooth = this.fSmooth.val[k];
            bins[k].onset = false;
            this.samples[k].samples.push(bins[k].max);
            while (this.samples[k].samples.length > this.samplesLen) this.samples[k].samples.shift();
            if (this.samples[k].ignorePeaks == 0) {
                let avg = this.samples[k].samples.reduce((p, c) => p + c) / this.samples[k].samples.length;
                if (bins[k].max >= Math.max(0.25, avg)) {
                    bins[k].onset = true;
                    this.samples[k].ignorePeaks = parseInt(this.fps / 4);
                }
            }
            this.samples[k].ignorePeaks = Math.max(0, --this.samples[k].ignorePeaks);
        });
        events.fire('audio/analysis/data', this, bins);
    }

    stop(event, input) {
        window.clearInterval(this.interval);
        input.source.disconnect(this.analyzer);
        this._resetProps();
    }
}