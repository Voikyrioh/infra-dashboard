import process from "node:process";
import Logger from "@logger";
import Server from "./src";

async function graceFullStart() {
    await Server.start().catch(graceFullStop);
}

function graceFullStop(errorCode: number): Promise<void> {
    return new Promise((resolve) => {
        Server.stop().then(() => {
            Logger.info('======== Server stopped ========')
            resolve(process.exit(errorCode))
        });

    })
}

graceFullStart().then(() => Logger.info( '======== Server started ========')).catch(graceFullStop);
process.on('SIGINT', graceFullStop);
