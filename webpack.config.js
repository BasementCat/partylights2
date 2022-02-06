const path = require('path');

module.exports = {
    entry: ['./src/js/main.js', './src/sass/main.scss', './src/index.html'],
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.s[ac]ss$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].css'
                        },
                    },
                    'sass-loader'
                ]
            },
            {
                test: /\.html?$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].html'
                        }
                    }
                ]
            }
        ]
    }
};