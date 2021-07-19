import React from 'react';

export default class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
        <div id="editor-container">
          <div key="editor" id="editor">
            <p>Hello, world</p>
          </div>
        </div>
    );
  }
}