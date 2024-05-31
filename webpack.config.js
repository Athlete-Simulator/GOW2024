const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const distFolder = "./dist";

module.exports = {
    mode: 'development',
    entry: './src/app.ts',
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: 'src/index.ejs'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: './models', to: 'models' },
                { from: './sprites', to: 'sprites' },
                { from: './sounds', to: 'sounds' }
            ]
        }),
        new webpack.ProvidePlugin({
            Ammo: 'ammo.js' // Ensure Ammo is available globally
        })
    ],

    devtool: 'inline-source-map',
    devServer: {
        https: {
            key: path.resolve(__dirname, 'key.pem'),
            cert: path.resolve(__dirname, 'cert.pem'),
        },
        historyApiFallback: true, // Add this if you're dealing with routing
        port: 8080, // Specify the port (if needed)
        open: true // Opens the browser when the server starts
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader', // Creates `style` nodes from JS strings
                    'css-loader' // Translates CSS into CommonJS
                ]
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource', // Add this rule if you need to handle images
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource', // For handling fonts
            }
        ]
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendors",
                    chunks: "all"
                }
            }
        }
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        fallback: {
            "fs": false,
            "path": require.resolve("path-browserify")
        }
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, distFolder),
        clean: true, // Clean the output directory before emit
        publicPath: '/' // Important for deep linking
    }
};
