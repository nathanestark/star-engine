const path = require("path");
const webpack = require("webpack");

module.exports = {
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        library: {
            name: "StarEngine",
            type: "umd"
        }
    },
    entry: {
        index: "./source/index.ts"
    },
    optimization: { minimize: false },
    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV)
            }
        })
    ],
    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            source: path.resolve(__dirname, "source")
        }
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                exclude: /node_modules/,
                use: {
                    loader: "ts-loader"
                }
            }
        ]
    }
};
