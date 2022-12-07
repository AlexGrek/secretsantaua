import React, { Component } from 'react'
import ChatInput from './ChatInput'
import ChatMessage from './ChatMessage'

const URL = 'ws://localhost:3030'

class Chat extends Component {
  state = {
    name: 'Anonim',
    messages: [],
    isOpen: false
  }

  componentDidMount() {
    this.props.ws.onopen = () => {
      console.log('connected')
    }

    this.props.ws.onmessage = evt => {
      const message = JSON.parse(evt.data)
      if (message.update !== undefined) {
        console.log(this.props);
        this.props.onUpdate(message.update);
      }
      if (message.personal !== undefined) {
        this.props.onUpdate(message);
      }
      this.addMessage(message)
    }

    this.props.ws.onclose = () => {
      console.log('disconnected')
      this.setState({
        ws: new WebSocket(URL),
      })
    }
  }

  addMessage = message =>
    this.setState(state => ({ messages: [message, ...state.messages] }))

  submitMessage = messageString => {
    const message = { name: this.state.name, message: messageString }
    this.props.ws.send(JSON.stringify(message))
    this.addMessage(message)
  }

  changeChatVisibility = (bool) => {
    this.setState({isOpen: bool});
  }

  render() {
    return (
      <div>
        <div className='reveal-chat-button' style={{ visibility: this.state.isOpen ? 'hidden' : 'visible' }}>
            <button onClick={() => this.changeChatVisibility(true)}>Жахливий чат</button>
          </div>
        <div class="fixed-chat" style={{ visibility: this.state.isOpen ? 'visible' : 'hidden' }}>
          <div class="panel-chat">
            <div class="header-chat">
              <label htmlFor="name">
                Name:&nbsp;
                <input
                  type="text"
                  id={'name'}
                  placeholder={'Enter your name...'}
                  value={this.state.name}
                  onChange={e => this.setState({ name: e.target.value })}
                />
                <button className="hide-chat-button" onClick={() => this.changeChatVisibility(false)}> _ </button>
              </label>
            </div>
            <div class="body-chat">
              {this.state.messages.map((message, index) =>
                <ChatMessage
                  key={index}
                  message={message.message}
                  name={message.name}
                />,
              )}
            </div>
            <div class="message-chat">
              <ChatInput
                ws={this.props.ws}
                onSubmitMessage={messageString => this.submitMessage(messageString)}
              />
              <div className='chat-close-button'>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Chat
