const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MergeIntoSingleFilePlugin = require('webpack-merge-and-include-globally');

module.exports = {
    context: __dirname,
    entry: [
        path.resolve(__dirname, 'src/index.js')
    ],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'dist.min.js'
    },
    module: {
        rules: [
            {
                test: /\.s[ac]ss$/i,
                exclude: /node_modules/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    {
                        loader: "sass-loader",
                        options: {
                            sassOptions: {
                                includePaths: [
                                ],
                            },
                        },
                    },
                ],
            },
            {
                test: /\.js[x]?$/,
                include: [
                    path.resolve(__dirname, 'src'),
                ],
                exclude: /node_modules/,
                use: ['babel-loader']
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        alias: {
            stylekit: path.join(__dirname, 'node_modules/sn-stylekit/dist/stylekit.css'),
            '@Components': path.resolve(__dirname, 'app/components'),
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: "Bold Editor",
            template: 'editor.index.ejs',
            filename: 'index.html'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: './node_modules/@standardnotes/editor-kit/dist/filesafe-js/EncryptionWorker.js', to: 'filesafe-js/EncryptionWorker.js' },
            ],
        }),
        new MergeIntoSingleFilePlugin({
            files: {
                "vendor.css": [
                    'node_modules/filesafe-embed/dist/dist.css',
                    'quill/quill.snow.css'
                ],
                "style.css": [
                    'public/style.scss'
                ]
            }
        }),
    ]
};