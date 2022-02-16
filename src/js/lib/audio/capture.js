import * as events from '/src/js/lib/events';
import {PrefKey} from '/src/js/lib/storage';

export class AudioInput {
    constructor() {
        this.selectedDevice = new PrefKey('capture.selectedDevice', null);
        this.isRunning = new PrefKey('capture.isRunning', false);

        this.stream = null;
        this.context = null;
        this.source = null;

        this.s_inputs = document.getElementById('inputs');
        this.b_startstop = document.getElementById('startstop');

        this.consumers = [];

        this.setup();

        if (this.isRunning.val) {
            this.start(true);
        }
    }

    setup() {
        navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(stream => {
            stream.getAudioTracks().forEach(track => track.stop());

            navigator.mediaDevices.enumerateDevices().then((devices) => {
                devices = devices.filter((d) => d.kind === 'audioinput');
                devices.forEach(d => {
                    let el = document.createElement('option');
                    el.value = d.deviceId;
                    el.innerHTML = d.label;
                    this.s_inputs.appendChild(el);
                });
                if (!this.selectedDevice.val) this.selectDevice({target: this.s_inputs}, true);
            });

            this.s_inputs.addEventListener('change', this.selectDevice.bind(this));
            this.b_startstop.addEventListener('click', this.toggleRunning.bind(this));
        });
    }

    start(isSetup) {
        if (this.isRunning.val && !isSetup) return;
        if (!this.selectedDevice.val) {
            this.isRunning.val = false;
            return;
        }
        navigator.mediaDevices.getUserMedia({audio: {deviceId: this.selectedDevice.val}}).then(stream => {
            this.stream = stream;
            this.context = new AudioContext();
            this.source = this.context.createMediaStreamSource(stream);
            this.isRunning.val = true;
            this.b_startstop.innerHTML = 'Stop';
            this.b_startstop.classList.remove('btn-danger');
            this.b_startstop.classList.add('btn-success');
            events.fire('input/audio/start', this);
        });
    }

    stop() {
        if (!this.isRunning.val) return;
        events.fire('input/audio/stop', this);
        this.stream.getAudioTracks().forEach(track => track.stop());
        this.isRunning.val = false;
        this.stream = this.context = this.source = null;
        this.b_startstop.innerHTML = 'Start';
        this.b_startstop.classList.add('btn-danger');
        this.b_startstop.classList.remove('btn-success');
    }

    restart() {
        if (!this.isRunning.val) return;
        this.stop();
        this.start();
    }

    selectDevice(ev, isSetup) {
        this.selectedDevice.val = ev.target.value;
        if (!isSetup) this.restart();
    }

    toggleRunning() {
        if (this.isRunning.val)
            this.stop();
        else
            this.start();
    }
}
