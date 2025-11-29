const path = require("path");
const webpack = require("webpack");

const baseConfig = {
    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name].js",
        publicPath: "/static/"
    },
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
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env", "@babel/preset-typescript"]
                    }
                }
            },
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"]
                    }
                }
            }
        ]
    },
    externals: {},
    devServer: {
        static: {
            directory: path.join(__dirname, "static")
        },
        historyApiFallback: true,
        host: "0.0.0.0",
        port: 3000,
        client: {
            logging: "info",
            overlay: {
                errors: true,
                warnings: true
            },
            progress: true
        },
        compress: true,
        devMiddleware: {
            stats: {
                colors: true,
                hash: false,
                version: false,
                timings: false,
                assets: true,
                chunks: false,
                modules: false,
                reasons: false,
                children: false,
                source: false,
                errors: true,
                errorDetails: true,
                warnings: true
            }
        }
    }
};

const productionConfig = Object.assign({}, baseConfig, {
    entry: {
        "n-body": "./source/n-body-entry.ts",
        "bouncing-balls": "./source/bouncing-balls.ts",
        asteroids: "./source/asteroids.ts",
        cube: "./source/cube.ts"
    },
    optimization: { minimize: true }
});

const configs = {
    production: productionConfig,

    development: Object.assign({}, baseConfig, {
        devtool: "inline-source-map",
        entry: {
            "n-body": "./source/n-body-entry.ts",
            "bouncing-balls": "./source/bouncing-balls-entry.ts",
            asteroids: "./source/asteroids-entry.ts",
            cube: "./source/cube-entry.ts"
        }
    })
};

const env = process.env.NODE_ENV;

module.exports = configs[env];
