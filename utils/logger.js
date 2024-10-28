const {createLogger, format, transports} = require('winston');

const {combine, cli, timestamp: timestampFn, printf} = format;

function create({meta = {}, service, k8sPod} = {}) {
    const logger = createLogger({
        level: 'info',
        defaultMeta: {service, ...meta},
        transports: [],
    });


    logger.add(
        new transports.Console({
            format: combine(
                cli(),
                timestampFn(),
                printf(({timestamp, level, message, ...metadata}) => {
                    let msg = `${level}: ${message}`;
                    if (metadata && Object.keys(metadata).length) {
                        msg += ` | Metadata: ${JSON.stringify(metadata, (k, v) => {
                            return typeof v === 'bigint' ? `${v.toString()}__BigInt__` : v;
                        })}`;
                    }
                    return `${msg} ${timestamp}`;
                })
            ),
        })
    );


    return logger;
}

let logger;
const init = ({meta = {}, service, k8sPod} = {}) => {
    if (!logger) {
        logger = create({meta, service, k8sPod});
    }

    return logger;
};

module.exports = init({service: 'api', k8sPod: 'api'});
