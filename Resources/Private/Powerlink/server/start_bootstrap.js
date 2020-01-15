require('@babel/register')({
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: 'current',
                },
                useBuiltIns: 'usage',
                corejs: '3.5.0',
            },
        ],
    ],
})

require('./server.js')
