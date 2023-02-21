import HelloController from './controller/HelloController.js'
export default class Router {
    constructor() {
        this.helloController = new HelloController();
    }
    getRouterMap() {
        return {
            '/':{controller:this.helloController,method:'hello'},
            'default':'/'
        }
    }
}