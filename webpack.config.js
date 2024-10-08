// webpack.config.js

const path = require('path');

module.exports = {
    entry: './src/main.ts', // Your entry TypeScript file
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'bundle.js', // Output bundle file
        path: path.resolve(__dirname, 'dist'), // Output directory
    },
    devtool: 'source-map', // Enable source maps
    mode: 'development', // Set to 'production' for production builds
    devServer: {
        static: path.join(__dirname, ''),
        compress: true,
        port: 8082,
    },
};
