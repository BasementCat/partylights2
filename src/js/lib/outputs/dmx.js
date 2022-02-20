import * as events from '/src/js/lib/events';

const devices = [];
let selectedDevice = null;

const defaultRate = 57600;
const knownDevices = [
    {vid: 1027, pid: 24577, name: 'DMXKing UltraDMX Micro', rate: 57600},
];

let dmxDevId = 0;

const dmxDataPrefix = new Uint8Array([
    0x7E,  // open,
    6,
    (512 + 1) & 0xFF,
    ((512 + 1) >> 8) & 0xFF,
    0,
]);
const dmxDataSuffix = new Uint8Array([0xE7]);

class DMXDevice {
    constructor(port) {
        this.id = --dmxDevId;
        this.isSelected = false;
        this.port = port;
        this.usb = this.port.getInfo();
        this.name = 'Unknown';
        this.rate = defaultRate;
        if (this.usb && this.usb.usbVendorId && this.usb.usbProductId) {
            // For consistency - set ID to something useful
            this.id = (this.usb.usbProductId << 16) | this.usb.usbVendorId;
            this.name += ' (' + this.usb.usbVendorId.toString(16) + ':' + this.usb.usbProductId.toString(16) + ')';
            knownDevices.forEach(d => {
                if (d.vid === this.usb.usbVendorId && d.pid === this.usb.usbProductId) {
                    this.name = d.name;
                    this.rate = d.rate;
                }
            });
        }
        this.isOpen = false;
        this.data = new Uint8Array(512);
    }

    setChannel(chan, val) {
        this.data[chan - 1] = val;
    }

    setChannels(start, values) {
        values.forEach((v, i) => {
            this.data[start + i] = v;
        });
    }

    async render() {
        if (!this.isOpen) {
            await this.port.open({baudRate: this.rate});
            this.isOpen = true;
        }
        const writer = this.port.writable.getWriter();
        try {
            await writer.write(dmxDataPrefix.buffer);
            await writer.write(this.data.buffer);
            await writer.write(dmxDataSuffix.buffer);
        } finally {
            writer.releaseLock();
        }
    }
}

export function selectDevice(id) {
    console.debug("[DMX] Attempting to select device %s", id);
    let origSelectedDevice = selectedDevice;
    selectedDevice = null;
    devices.forEach((d, i) => {
        d.isSelected = ((id === null && i === 0) || d.id === id);
        selectedDevice = d.isSelected ? d : selectedDevice;
        if (d.isSelected)
            console.debug("[DMX] Selected device %s", id);
    });
    if (selectedDevice !== origSelectedDevice) {
        events.fire('dmx/selected', selectedDevice);
    }
}

export function detectDevices() {
    console.debug('[DMX] performing device detection');
    navigator.serial.requestPort().then(port => {
        let dev = null;
        devices.forEach(d => {
            if (d.port === port) {
                dev = d;
            }
        });
        if (dev === null) {
            console.debug("[DMX] new device selected in browser UI");
            devices.push(new DMXDevice(port));
            events.fire('dmx/devices', devices);
        }
        console.debug("[DMX] selecting new device from UI");
        selectDevice(dev.id);
    });
}

let setupCompleted = false,
    devicesDetected = false;

function finishSetup() {
    if (setupCompleted && devicesDetected)
        events.fire('dmx/setup');
}

export function setup() {
    console.debug('[DMX] performing setup, detecting ports')
    navigator.serial.getPorts().then(ports => {
        ports.forEach(port => {
            devices.push(new DMXDevice(port));
        });
        events.fire('dmx/devices', devices);
        console.debug('[DMX] %d devices found', devices.length);
        devicesDetected = true;
        finishSetup();
    });

    navigator.serial.addEventListener('connect', e => {
        console.debug('[DMX] device connected');
        devices.push(new DMXDevice(e.target));
        events.fire('dmx/devices', devices);
    });

    navigator.serial.addEventListener('disconnect', e => {
        let dev = null;
        devices.forEach(d => {
            if (d.port === e.target) {
                dev = d;
            }
        });
        if (dev !== null) {
            devices.splice(devices.indexOf(dev), 1);
            events.fire('dmx/devices', devices);
            if (selectedDevice === dev) {
                console.debug('[DMX] device disconnected, selecting first device');
                selectDevice(null);
            }
        }
    });

    events.subscribe('dmx/send', (e, data) => {
        if (!selectedDevice) return;
        if (!data.channel) return;
        if (data.hasOwnProperty('value')) {
            selectedDevice.setChannel(data.channel, data.value);
        } else if (data.hasOwnProperty('values')) {
            selectedDevice.setChannels(data.channel, data.values);
        } else {
            return;
        }
        selectedDevice.render();
    });

    setupCompleted = true;
    finishSetup();





    window.setInterval(() => {
        events.fire('dmx/send', {channel: 1, value: 0});
    }, 100);
}
