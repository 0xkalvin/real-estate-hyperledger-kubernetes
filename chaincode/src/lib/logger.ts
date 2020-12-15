import { configure, getLogger } from "log4js";

const setupLogger = () => {
    configure({
        appenders: {
            out: {
                type: "stdout",
                layout: {
                    type: "coloured",
                    pattern: "%d %p %m%n",
                },
            },
        },
        categories: {
            default: {
                appenders: ["out"],
                level: "info",
            },
        },
    });

    const logger = getLogger();
    
    logger.level = "ALL";

    return logger;
};

const logger = setupLogger();

export default logger;
