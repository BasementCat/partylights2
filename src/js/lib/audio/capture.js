import * as events from '/src/js/lib/events';

export class AudioInput {
    constructor() {
        this.selectedDevice = null;
        this.isRunning = false;

        this.stream = null;
        this.context = null;
        this.source = null;

        this.consumers = [];

        navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(stream => {
            stream.getAudioTracks().forEach(track => track.stop());

            navigator.mediaDevices.enumerateDevices().then((devices) => {
                devices = devices.filter((d) => d.kind === 'audioinput');
                events.fire('input/audio/setup', this, devices);
            });
        });
    }

    start() {
        if (this.isRunning) return;
        if (!this.selectedDevice) {
            this.isRunning = false;
            return;
        }
        navigator.mediaDevices.getUserMedia({audio: {deviceId: this.selectedDevice}}).then(stream => {
            this.stream = stream;
            this.context = new AudioContext();
            this.source = this.context.createMediaStreamSource(stream);
            this.isRunning = true;
            events.fire('input/audio/start', this);
        });
    }

    stop() {
        if (!this.isRunning) return;
        events.fire('input/audio/stop', this);
        this.stream.getAudioTracks().forEach(track => track.stop());
        this.isRunning = false;
        this.stream = this.context = this.source = null;
    }

    restart() {
        if (!this.isRunning) return;
        this.stop();
        this.start();
    }

    selectDevice(device) {
        this.selectedDevice = device;
        this.restart();
    }

    toggleRunning() {
        if (this.isRunning) {
            this.stop();
            return false;
        } else {
            this.start();
            return true;
        }
    }
}