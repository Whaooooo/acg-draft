// webpack.config.js

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
    const isDevelopment = argv.mode === 'development';

    return {
        entry: './src/main.ts',
        mode: isDevelopment ? 'development' : 'production',
        output: {
            filename: 'bundle.js',
            path: path.resolve(__dirname, 'dist'),
            clean: true,
            publicPath: './',
        },
        resolve: {
            extensions: ['.ts', '.js'],
        },
        module: {
            rules: [
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.(png|jpg|jpeg|gif|mp3|wav|ogg)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'assets/[hash][ext][query]'
                    },
                },
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader'],
                },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: 'index.html',
            }),
            new CopyWebpackPlugin({
                patterns: [
                    { from: 'assets', to: 'assets' },    // Copy assets/ to dist/assets/
                    { from: 'webpage', to: 'webpage' },  // Copy webpage/ to dist/webpage/
                ],
            }),
        ],
        devServer: {
            static: {
                directory: path.join(__dirname, 'dist'),
            },
            compress: true,
            port: 3000,
            open: true,
            hot: true, // Enable Hot Module Replacement
            watchFiles: ['src/**/*', 'index.html', 'webpage/**/*'], // Watch these files for changes
        },
        devtool: isDevelopment ? 'inline-source-map' : false, // Source maps in development
    };
};
