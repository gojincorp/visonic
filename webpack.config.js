const path = require('path')
const fs = require('fs')

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    resolve: {
        extensions: ['.js', '.jsx'],
    },
    entry: {
        main: ['./src/App.jsx'],
    },
    output: {
        path: path.join(__dirname, 'Resources/Public/js'),
        chunkFilename: '[name].app.bundle.js',
        filename: 'app.bundle.js',
    },
    optimization: {
        splitChunks: {
            chunks: 'all',
            minSize: 30000,
            maxSize: 0,
            minChunks: 1,
            maxAsyncRequests: 5,
            maxInitialRequests: 3,
            automaticNameDelimiter: '~',
            automaticNameMaxLength: 30,
            name: true,
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/](?!react-bootstrap)(.[a-zA-Z0-9.\-_]+)[\\/]/,
                    name: 'vendors',
                    priority: -10,
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true,
                },
            },
        },
    },
    module: {
        rules: [
            {
                test: /\.jsx$/,
                exclude: /(node_modules)/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-react', '@babel/preset-env'],
                            plugins: ['@babel/plugin-syntax-dynamic-import'],
                        },
                    },
                ],
            },
            {
                test: /\.scss$/,
                exclude: /(node_modules)/,
                use: [{
                    loader: 'style-loader',    // Inject CSS to page
                }, {
                    loader: 'css-loader',      // Translate CSS into CommonJS modules
                }, {
                    loader: 'postcss-loader',  // Run post CSS actions
                    options: {
                        plugins() {
                            return [
                                require('precss'),
                                require('autoprefixer'),
                            ]
                        },
                    },
                }, {
                    loader: 'sass-loader',      // Compile SASS to CSS
                }],
            },
        ],
    },
    devServer: {
        host: '0.0.0.0',
        port: 8080,
        disableHostCheck: true,
        index: '',
        https: {
            key: fs.readFileSync('/Users/ibserveradmin/letsencrypt/config/live/visonic.ideasbeyond.com/privkey.pem'),
            cert: fs.readFileSync('/Users/ibserveradmin/letsencrypt/config/live/visonic.ideasbeyond.com/cert.pem'),
        },
        proxy: {
            '**': {
                target: 'https://localhost:3000',
                secure: false,
            },
        },
    },
    plugins: [],
}
