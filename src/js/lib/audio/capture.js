import * as events from '/src/js/lib/events';

export class AudioInput {
    constructor() {
        this.selectedDevice = null;
        this.isRunning = false;

        this.stream = null;
        this.context = null;
        this.source = null;

        this.s_inputs = document.getElementById('inputs');
        this.b_startstop = document.getElementById('startstop');

        this.consumers = [];

        this.setup();
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
            });

            this.s_inputs.addEventListener('change', this.selectDevice.bind(this));
            this.b_startstop.addEventListener('click', this.toggleRunning.bind(this));
        });
    }

    start() {
        if (this.isRunning) return;
        if (!this.selectedDevice) return;
        navigator.mediaDevices.getUserMedia({audio: {deviceId: this.selectedDevice}}).then(stream => {
            this.stream = stream;
            this.context = new AudioContext();
            this.source = this.context.createMediaStreamSource(stream);
            this.isRunning = true;
            this.b_startstop.innerHTML = 'Stop';
            events.fire('input/audio/start', this);
        });
    }

    stop() {
        if (!this.isRunning) return;
        events.fire('input/audio/stop', this);
        this.stream.getAudioTracks().forEach(track => track.stop());
        this.isRunning = false;
        this.stream = this.context = this.source = null;
        this.b_startstop.innerHTML = 'Start';
    }

    restart() {
        if (!this.isRunning) return;
        this.stop();
        this.start();
    }

    selectDevice(ev) {
        this.selectedDevice = ev.target.value;
        this.restart();
    }

    toggleRunning() {
        if (this.isRunning)
            this.stop();
        else
            this.start();
    }
}
