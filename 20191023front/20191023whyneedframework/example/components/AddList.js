export default class AddList extends HTMLElement {
    constructor() {
        super();
        const template = document.createElement('template');
        this.data = {
            inputVal:'hello',
            list:[]
        }
        template.innerHTML = this.getHtml()
        const content = template.content.cloneNode(true);
        const shadow = this.attachShadow( { mode: 'closed' } );
        const myInput = content.querySelector('input');
        const myBtn = content.querySelector('button');
        const myUl = content.querySelector('ul');
        myBtn.addEventListener('click',()=>{
            if(myInput.value) {
                this.data.list.push(myInput.value);
                myUl.innerHTML = this.getLi()
            }
        })
        shadow.appendChild(content);
    }
    getHtml() {
        return `
        <di>
            <input type="text" value="${this.data.inputVal}"/><button type="button">add</button>
            <ul>${this.getLi()}</ul>
        </div>`;
    }
    getLi() {
        return `${this.data.list.map((val)=>{
                return `<li>${val}</li>`
            }).join('')}`
    }
  }