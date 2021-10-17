const path = require('path');

module.exports = {
	mode: 'development',
	entry: {
		'demo': './src/demo.js'
	},
	output: {
	    path: path.resolve(__dirname, 'dist/js'),
	    filename: '[name].bundle.js'
    },
    devServer: {
	    static: {
	      directory: path.join(__dirname, 'dist'),
	    },
	    compress: true,
	    port: 9000,
  	},
    module: {
	    rules: [
	      {
	        test: /\.m?js$/,
	        use: {
	          loader: "babel-loader",
	        },
	      },
	    ]
  	}
};