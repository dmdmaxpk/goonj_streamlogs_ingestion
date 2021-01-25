const env = process.env.NODE_ENV || 'development';

let config = {
    development: {
        port: '3030',
        mongoConnectionUrl: 'mongodb://localhost:27017/streamlogs',
        apiGateway: 'http://10.0.1.90',
        goonj_video_service: "http://10.3.7.101:3000"
    },
    staging: {
        port: '3030',
        mongoConnectionUrl: 'mongodb://localhost:27017/streamlogs',
        apiGateway: 'http://localhost:3000',
        goonj_video_service: "http://10.3.7.101:3000"
    },
    production: {
        port: '3030',
        mongoConnectionUrl: 'mongodb://localhost:27017/streamlogs',
        apiGateway: 'http://10.0.1.90',
        goonj_video_service: "http://10.3.7.101:3000"
    }
};

console.log("---", env);

if (env === 'development') config = config.development;
if (env === 'staging') config = config.staging;
if (env === 'production') config = config.production;

module.exports = config;
