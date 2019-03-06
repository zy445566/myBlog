import HelloController from './controller/HelloController.js'
const helloController = new HelloController();
export default {
    '/':helloController.hello,
}