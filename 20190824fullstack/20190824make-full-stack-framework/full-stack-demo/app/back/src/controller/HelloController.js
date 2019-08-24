class HelloController {
    async world(ctx) {
        return 'World';
    }
}

module.exports = new HelloController();