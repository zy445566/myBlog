
import AddList from './components/AddList.js'
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
            <add-list/>
        </div>`;
        const content = template.content.cloneNode(true);
        const shadow = this.attachShadow( { mode: 'closed' } );
        content.querySelector('h1').addEventListener('click',()=>{
            console.log('Click Me!')
        })
        window.customElements.define('add-list', AddList);
        shadow.appendChild(content);
    }
  }
  window.customElements.define('app-container', AppContainer);