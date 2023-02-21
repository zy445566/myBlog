export default class MyBrowseRoute extends HTMLElement {
    constructor() {
        super();
        const template = document.createElement('template');
        this.path = this.getAttribute('path');
        this.tag = this.getAttribute('tag');
        template.innerHTML = this.getHtml()
        const content = template.content.cloneNode(true);
        const shadow = this.attachShadow( { mode: 'closed' } );
        shadow.appendChild(content);
    }
    getHtml() {
        if(window.location.pathname!=this.path) {return ''};
        return `<${this.tag}/>`
    }
  }