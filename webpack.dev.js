const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const config = {
    mode: 'development',
    entry : "./src/index.js",
    output: {
        path: path.resolve(__dirname, './build'),
        filename: 'bundle.js',
    },
    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".js"]
    },
    module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-react', '@babel/preset-env'],
					},
				},
			},{
				test: /\.css$/,
                exclude: /node_modules/,
				use: {
                    loader :'css-loader'
                }
			},
		],
	},
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html',
            filename: 'index.html',
            inject: true,
            minify: true,
        }),
    ],
    devServer: {
        open: ['index.html'],
        hot: true,
        compress: true,
        port: 4000,
        proxy: { 
            '/wvproxy':{
                host:'localhost',
                target: 'https://wv.drm.tvb.com',
                secure: false
            },
            '/video/mpd':{
                host:'localhost',
                target: 'https://www.mytvsuper.com',
                secure: false,
                changeOrigin: true
            },
            '/video_info':{
                host:'localhost',
                target: 'http://127.0.0.1:5000',
                secure: false
            }
        }
    }
};

module.exports = config;