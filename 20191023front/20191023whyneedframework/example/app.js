
import './element-registry.js';
class AppContainer extends HTMLElement {
    constructor() {
        super();
        const template = document.createElement('template');
        template.innerHTML = `
        <style>
            .container > h1 {
                width:120px;
                border: solid;
                cursor: pointer;
            }
        </style>
        <div class="container">
            <h1>Click Me!</h1>
            <my-router>
                <my-browse-route path="/data-bind" tag="data-bind"></my-browse-route>
                <my-browse-route path="/add-list" tag="add-list"></my-browse-route>
            </my-router>
        </div>`;
        const content = template.content.cloneNode(true);
        const shadow = this.attachShadow( { mode: 'closed' } );
        const paths = ['/', '/data-bind', '/add-list'];
        content.querySelector('h1').addEventListener('click',()=>{
            let pathIndex = paths.indexOf(window.location.pathname);
            pathIndex=(pathIndex==paths.length-1?0:pathIndex+1);
            window.location.pathname = paths[pathIndex]
        })
        shadow.appendChild(content);
    }
  }
window.customElements.define('app-container', AppContainer);
