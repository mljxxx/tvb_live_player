const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
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
                use: [MiniCssExtractPlugin.loader, 'css-loader']
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
        new MiniCssExtractPlugin({
			filename: './src/App.css',
		})
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
            },
            '/get_user_info':{
                host:'localhost',
                target: 'http://127.0.0.1:5000',
                secure: false
            },
            '/images/B649d56d13c63ce869.jpeg': {
                host:'localhost',
                target: 'https://lbsugc.cdn.bcebos.com',
                secure: false,
                changeOrigin: true
            },
            '/fps': {
                host:'localhost',
                target: 'https://fps.drm.tvb.com',
                secure: false,
                changeOrigin: true
            }
        }
    }
};

module.exports = config;
