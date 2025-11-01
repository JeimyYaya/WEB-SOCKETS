class WSClient extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      msg: ""
    };
  }

  componentDidMount() {
    this.wsocket = new WebSocket("ws://localhost:8080/timer");
    this.wsocket.onmessage = (evt) => this.onMessage(evt);
    this.wsocket.onerror = (evt) => this.onError(evt);
  }

  onMessage(evt) {
    console.log("In onMessage", evt);
    this.setState({isLoaded:true, msg: evt.data});
  }

  onError(evt) {
    console.error("In onError", evt);
    this.setState({error: evt});
  }

  render() {
    console.log("Rendering...");
    const {error, isLoaded, msg} = this.state;
    if (error) {
      return <div>Error: {error.message ? error.message : JSON.stringify(error)}</div>;
    } else if (!isLoaded) {
      return <div>Loading...</div>;
    } else {
      return (
        <div>
          <h1>The server status is:</h1>
          <p>{msg}</p>
        </div>
      );
    }
  }
}

ReactDOM.render(<WSClient />, document.getElementById('timer'));
