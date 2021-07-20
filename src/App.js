import React from 'react';
import Editor from './components/Editor';

export default class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
        <div id="editor-container">
            <div id="toolbar">
                <button className="ql-bold">Bold</button>
                <button className="ql-italic">Italic</button>
            </div>
          <div key="editor" id="editor">
              <p>Hello, world</p>
              <Editor />
          </div>
        </div>
    );
  }
}