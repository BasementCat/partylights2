import * as events from '/src/js/lib/events';
import {FEATURES} from '/src/js/lib/constants';
import {Series, TSChart, SpectSeries, SpectChart} from '/src/js/lib/ui/components/chart';

let graphs = [];

function destroy_graphs() {
    graphs.forEach(g => g.destroy());
    graphs = [];
}

export default function setup() {
    events.subscribe('audio/analysis/features', (ev, analyzer, opts) => {
        destroy_graphs();
        const timelen = (opts.sampleRate / opts.bufferSize) * 10;
        const make_graph = function(key, title, description, cls, opts) {
            let graph = null;
            graphs.forEach(g => {
                if (g.opts.key === key)
                    graph = g;
            });
            if (graph === null) {
                const config = {
                    'key': key,
                    'title': title,
                    'description': description || null
                };
                Object.assign(config, opts || {});
                graph = new (cls || TSChart)(document.getElementById('graphs'), config);
                graphs.push(graph);
            }
            return graph;
        };

        let features = {}
        opts.features.forEach(f => {
            let feature = {key: f};
            Object.assign(feature, FEATURES._default, FEATURES[f]);
            ['range', 'fftCount'].forEach(k => {
                if (typeof feature[k] === 'function')
                    feature[k] = feature[k](opts.sampleRate, opts.bufferSize, analyzer.mfccCoefficients);
            });
            features[f] = feature;
        });

        ['rms', 'energy'].forEach(k => {
            let feature = features[k];
            let graph = make_graph('volume', 'Volume');
            graph.addSeries(new Series(
                {
                    key: feature.key,
                    title: feature.title,
                    description: feature.description,
                    color: feature.color,
                    range: feature.range,
                    autoRange: feature.autoRange,
                },
                feature
            ));
        });

        ['spectralFlatness', 'spectralSlope', 'spectralKurtosis'].forEach(k => {
            let feature = features[k];
            let graph = make_graph('spectrum-shape', 'Spectrum Shape');
            graph.addSeries(new Series(
                {
                    key: feature.key,
                    title: feature.title,
                    description: feature.description,
                    color: feature.color,
                    range: feature.range,
                    autoRange: feature.autoRange,
                },
                feature
            ));
        });

        ['spectralCentroid', 'spectralSpread'].forEach(k => {
            // TODO: fft-type graph
            let feature = features[k];
            let graph = make_graph('spectrum-spread', 'Spectrum Spread');
            graph.addSeries(new Series(
                {
                    key: feature.key,
                    title: feature.title,
                    description: feature.description,
                    color: feature.color,
                    range: feature.range,
                    autoRange: feature.autoRange,
                },
                feature
            ));
        });

        ['spectralRolloff'].forEach(k => {
            let feature = features[k];
            let graph = make_graph('spectrum-rolloff', 'Spectrum Rolloff');
            graph.addSeries(new Series(
                {
                    key: feature.key,
                    title: feature.title,
                    description: feature.description,
                    color: feature.color,
                    range: feature.range,
                    autoRange: feature.autoRange,
                },
                feature
            ));
        });

        ['zcr', 'spectralSkewness'].forEach(k => {
            let feature = features[k];
            let graph = make_graph('spectrum-misc', 'Spectrum');
            graph.addSeries(new Series(
                {
                    key: feature.key,
                    title: feature.title,
                    description: feature.description,
                    color: feature.color,
                    range: feature.range,
                    autoRange: feature.autoRange,
                },
                feature
            ));
        });

        ['perceptualSpread', 'perceptualSharpness'].forEach(k => {
            let feature = features[k];
            let graph = make_graph('perceptual', 'Perceptual Features');
            graph.addSeries(new Series(
                {
                    key: feature.key,
                    title: feature.title,
                    description: feature.description,
                    color: feature.color,
                    range: feature.range,
                    autoRange: feature.autoRange,
                },
                feature
            ));
        });

        ['amplitudeSpectrum'].forEach(k => {
            let feature = features[k];
            let graph = make_graph('amplitudeSpectrum', 'amplitudeSpectrum', false, SpectChart);
            graph.addSeries(new SpectSeries(
                {
                    key: feature.key,
                    title: feature.title,
                    description: feature.description,
                    color: feature.color,
                    range: feature.range,
                    autoRange: feature.autoRange,
                    fftCount: feature.fftCount,
                },
                feature
            ));
        });

        ['powerSpectrum'].forEach(k => {
            let feature = features[k];
            let graph = make_graph('powerSpectrum', 'powerSpectrum', false, SpectChart);
            graph.addSeries(new SpectSeries(
                {
                    key: feature.key,
                    title: feature.title,
                    description: feature.description,
                    color: feature.color,
                    range: feature.range,
                    autoRange: feature.autoRange,
                    fftCount: feature.fftCount,
                },
                feature
            ));
        });

        ['mfcc'].forEach(k => {
            let feature = features[k];
            let graph = make_graph('mfcc', 'mfcc', false, SpectChart);
            graph.addSeries(new SpectSeries(
                {
                    key: feature.key,
                    title: feature.title,
                    description: feature.description,
                    color: feature.color,
                    range: feature.range,
                    autoRange: feature.autoRange,
                    fftCount: feature.fftCount,
                },
                feature
            ));
        });


        // chroma - pitch
        // loudness - loudness

    });

    events.subscribe('audio/analysis/stop', destroy_graphs);

    events.subscribe('audio/analysis/data', (ev, analyzer, features) => {
        const now = (new Date()).getTime() / 1000;
        graphs.forEach(graph => {
            Object.keys(graph.data).forEach(k => {
                let feature = graph.data[k].extra;
                switch (feature.type) {
                    case 'scalar':
                    case 'fft':
                        graph.push(k, features[feature.key]);
                        break;
                    case 'pitch':
                        break;
                    case 'loudness':
                        break;
                    default:
                        console.error("Invalid feature type %s", config.feature.type);
                        break;
                }
            });
        });
    });
}
