import React from 'react';
import Editor from './components/Editor';

export default class App extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
        <div id="editor-container">
            <div id="filesafe-react-client"></div>
            <div key="editor" id="editor">
              <Editor />
          </div>
        </div>
    );
  }
}