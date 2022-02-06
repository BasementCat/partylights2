import chroma from 'chroma-js';

import {makeEl, makeText} from '/src/js/lib/ui/components/html';

export class Chart {
    constructor(container, defaults, opts) {
        this.container = container;
        this.opts = {
            key: null,
            title: null,
            description: null,
            background: 'white',
            // type: 'timeseries',
            // timeRange: 10000,
            width: 600,
            height: 200,
        };
        Object.assign(this.opts, defaults || {}, opts || {});
        this.data = {};

        var parts = [];

        if (this.opts.title || this.opts.description) {
            const title_parts = [];
            if (this.opts.title) {
                title_parts.push(makeEl(
                    'span', false, ['title'], [
                        makeEl('strong', false, false, [
                            makeText(this.opts.title),
                        ]),
                    ],
                ));
            }
            if (this.opts.description) {
                if (this.opts.title) {
                    title_parts.push(makeText(' - '));
                }
                title_parts.push(makeEl(
                    'span', false, ['description'], [
                        makeEl('small', false, false, [
                            makeEl('em', false, false, [
                                makeText(this.opts.description),
                            ])
                        ]),
                    ],
                ));
            }
            parts.push(makeEl('div', false, ['title-desc'], title_parts));
        }

        this.canvas = makeEl('canvas', {width: this.opts.width, height: this.opts.height});
        this.ctx = this.canvas.getContext('2d');
        parts.push(this.canvas);

        this.legend = makeEl('ul', false, ['legend']);
        parts.push(this.legend);

        this.el = makeEl('div', false, ['chart', this.opts.type], parts);

        this.container.appendChild(this.el);
    }

    addSeries(series) {
        this.data[series.opts.key] = series;

        this.legend.appendChild(makeEl(
            'li', false, ['series', series.opts.key], [
                makeEl('div', {style: 'background-color: ' + series.opts.color + ';'}, ['color-block']),
                series.opts.description
                    ? makeEl('abbr', {'title': series.opts.description}, ['label'], [makeText(series.opts.title || series.opts.key)])
                    : makeEl('span', false, ['label'], [makeText(series.opts.title || series.opts.key)])
            ]
        ));

        this.render();
    }

    _render() {
        this.ctx.fillStyle = this.opts.background;
        this.ctx.strokeStyle = null;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render() {
        window.requestAnimationFrame(this._render.bind(this));
    }

    destroy() {
        this.container.removeChild(this.el);
    }
}

export class Series {
    constructor(opts, extra) {
        this.opts = {
            key: null,
            title: null,
            description: null,
            color: 'black',
            range: false,
            autoRange: true,
        };
        Object.assign(this.opts, opts || {});
        this.data = [];
        this.xRange = [0, 0];
        this.yScale = [0, 1];
        this.extra = extra || {};

        if (this.opts.range)
            this.yScale = this.opts.range;
    }

    _updateXScale() {
        const xv = this.data.map(v => v[0]);
        this.xRange = [Math.min.apply(Math, xv), Math.max.apply(Math, xv)];
    }

    _updateYScale() {
        if (!this.opts.autoRange)
            return false;
        const yv = this.data.map(v => v[1]);
        let newMin = Math.min.apply(Math, yv);
        let newMax = Math.max.apply(Math, yv);
        if (newMin > 0) newMin = 0;
        if (newMin != this.yScale[0] || newMax != this.yScale[1]) {
            this.yScale = [newMin, newMax];
            // console.log(this.yScale);
            return true;
        }
        return false;
    }

    updateScale() {
        this._updateXScale();
        return this._updateYScale();
    }

    push(x, y, trim) {
        this.data.push([x, y]);
        if (typeof trim !== 'undefined')
            return this.trim(trim);
        return this.updateScale();
    }

    trim(minX) {
        while (this.data.length && this.data[0][0] < minX) {
            this.data.shift();
        }
        return this.updateScale();
    }
}

export class SpectSeries extends Series {
    constructor(opts, extra) {
        super(opts, extra)
        if (!this.opts.fftCount)
            this.opts.fftCount = 0;
        this.yScale = [0, this.opts.fftCount];
        this.zScale = this.opts.range || [0, 1]
    }

    _updateYScale() {
        // also updates z scale
        if (!this.opts.autoRange)
            return false;
        let newYMax = this.yScale[1];
        let newZMax = this.zScale[1];
        this.data.forEach(point => {
            const yv = point[1];
            newYMax = Math.max(newYMax, yv.length);
            yv.forEach(zv => {
                newZMax = Math.max(newZMax, zv);
            });
        });
        if (newYMax != this.yScale[1] || newZMax != this.zScale[1]) {
            this.yScale[1] = newYMax;
            this.zScale[1] = newZMax;
            return true;
        }
        return false;
    }
}

export class TSChart extends Chart {
    constructor(container, opts, sub_defaults) {
        const defaults = {
            'type': 'timeseries',
            'xRange': 10000,
        }
        Object.assign(defaults, sub_defaults || {});
        super(container, defaults, opts);
    }

    push(series, value, ts) {
        if (!this.data[series]) return;
        const now = (new Date()).getTime();
        ts = ts || now;
        const scaleUpdated = this.data[series].push(ts, value, now - this.opts.xRange);
        this.render();
    }

    _render() {
        super._render();
        for (var key in this.data) {
            const series = this.data[key];
            const data = series.data;
            const xRange = Math.abs(series.xRange[1] - series.xRange[0]);
            const yRange = Math.abs(series.yScale[1] - series.yScale[0]);
            this.ctx.strokeStyle = series.opts.color;
            this.ctx.beginPath();
            data.forEach((p, i) => {
                const x = ((p[0] - series.xRange[0]) / xRange) * this.canvas.width;
                const y = this.canvas.height - (((p[1] - series.yScale[0]) / yRange) * this.canvas.height);
                if (i == 0)
                    this.ctx.moveTo(x, y);
                else
                    this.ctx.lineTo(x, y);
            });
            this.ctx.stroke();
        }
    }
}

export class SpectChart extends TSChart {
    constructor(container, opts, sub_defaults) {
        const defaults = {
            'type': 'spectrogram',
            'background': 'black',
        };
        Object.assign(defaults, sub_defaults || {});
        super(container, opts, defaults);
        this.color_scale = chroma.scale(['black', 'blue', 'green', 'yellow', 'red']);
    }

    _render() {
        // super.render();
        // Chart.prototype.render.apply(this);
        for (var key in this.data) {
            const series = this.data[key];
            const data = series.data;
            const xRange = Math.abs(series.xRange[1] - series.xRange[0]);
            const yRange = Math.abs(series.yScale[1] - series.yScale[0]);
            const zRange = Math.abs(series.zScale[1] - series.zScale[0]);

            const xs = Math.floor(Math.max(1, this.canvas.width / data.length));
            const ys = Math.floor(Math.max(1, this.canvas.height / yRange));

            if (!data.length || xs === Infinity || xs === this.canvas.width) {
                return;
            }
            const im = this.ctx.getImageData(xs, 0, this.canvas.width - xs, this.canvas.height);
            this.ctx.putImageData(im, 0, 0);

            this.ctx.strokeStyle = null;
            const [ts, zvals] = data[data.length - 1];
            const x = this.canvas.width - xs;
            // const x = Math.floor(Math.max(1, ((ts - series.xRange[0]) / xRange) * this.canvas.width));
            zvals.forEach((v, i) => {
                this.ctx.fillStyle = this.color_scale(v).css();
                const y = Math.floor(Math.max(1, this.canvas.height - ((i / zvals.length) * this.canvas.height)));
                this.ctx.fillRect(
                    x,
                    y,
                    x + xs,
                    y - ys
                );
            });
        }
    }
}
