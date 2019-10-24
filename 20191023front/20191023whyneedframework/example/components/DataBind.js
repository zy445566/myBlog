export default class DataBind extends HTMLElement {
    constructor() {
        super();
        const template = document.createElement('template');
        this.data = this.dataBind({
            inputVal:'hello'
        }); 
        template.innerHTML = this.getHtml();
        const content = template.content.cloneNode(true);
        this.shadow = this.attachShadow( { mode: 'closed' } );
        this.shadow.appendChild(content);
        this.addEvent()
    }
    dataBind(data) {
        return new Proxy(data, {
            set:  (target, key, receiver) => {
                Reflect.set(target, key, receiver)
                this.shadow.innerHTML = this.getHtml();
                this.addEvent();
                return Reflect.set(target, key, receiver);
        }})
    }
    addEvent() {
        this.myInput = this.shadow.querySelector('input');
        this.myInput.addEventListener('keyup',(e)=>{
            this.changeVal(e)
        })
    }
    changeVal(e) {
        this.data.inputVal = e.target.value;
        this.myInput.selectionStart = e.target.selectionStart;
        this.myInput.selectionEnd = e.target.selectionEnd;
        this.myInput.focus();
    }
    getHtml() {
        return `
        <di>
            <input type="text" value="${this.data.inputVal}"/>
            <h4>${this.data.inputVal}</h4>
        </div>`;
    }
  }