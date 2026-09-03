const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/index.jsx',
    output: { path: path.resolve(__dirname, 'dist'), filename: 'bundle.js', publicPath: '/' },
    module: { rules: [
        { test: /\.(js|jsx|ts|tsx)$/, exclude: /node_modules/, use: 'babel-loader' },
        { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]},
    resolve: { extensions: ['*', '.ts', '.tsx', '.js', '.jsx'] },
    plugins: [
        new HtmlWebpackPlugin({ template: './public/index.html', filename: 'index.html' }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'node_modules/@salesforce-ux/design-system/assets/styles/salesforce-lightning-design-system.min.css', to: 'slds/slds.css' },
                { from: 'node_modules/@salesforce-ux/design-system/assets/icons', to: 'slds/icons' },
                { from: 'node_modules/@salesforce-ux/design-system/assets/images', to: 'slds/images' },
            ]
        })
    ],
    devServer: { port: 3001, proxy: { '/api': 'http://localhost:3002' }, hot: true }
};
