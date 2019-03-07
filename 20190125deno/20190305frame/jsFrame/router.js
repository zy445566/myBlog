import HelloController from './controller/HelloController.js'
const helloController = new HelloController();
export default {
    '/':{controller:helloController,method:'hello'},
    'default':'/'
}