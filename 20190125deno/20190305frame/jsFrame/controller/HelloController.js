import HelloServer from '../server/HelloServer.js'
export default class HelloController {
    constructor() {
        this.helloServer = new HelloServer();
    }

    hello() {
        return this.helloServer.hello();
    }
}