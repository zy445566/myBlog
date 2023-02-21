
import React from "react";
import ReactDOM from "react-dom";
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {serverResp:'NO RESP'};
    fetch('/api/hello/world').then((resp)=>{
      if (!resp.ok) {return;}
      return resp.json()
    }).then((res)=>{
      this.setState({
        serverResp:res.data
      })
    })
  }
  render() {
    return (
      <div>
        Hello {this.state.serverResp}
      </div>
    );
  }
}
const domContainer = document.querySelector('#root');
ReactDOM.render(<App />, domContainer);