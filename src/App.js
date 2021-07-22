import React from "react";
import Editor from "./components/Editor";

export default class App extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const filesafeModal = document.getElementById("filesafe-modal");
    const filesafeModalClose = document.getElementsByClassName("filesafe-modal-close")[0];

    filesafeModalClose.onclick = function() {
      filesafeModal.style.display = "none";
    }
    
    window.onclick = function(event) {
      if (event.target == filesafeModal) {
        filesafeModal.style.display = "none";
      }
    }
}

  render() {
    return (
      <div>
        <div id="editor-container">
          <div id="filesafe-modal" class="modal">
            <div class="modal-content">
            <div class="modal-header">
              <span class="filesafe-modal-close">&times;</span>
              <h2 class="modal-header-text">FileSafe</h2>
            </div>
              <div id="filesafe-react-client"></div>
            </div>
          </div>

          <div key="editor" id="editor">
            <Editor />
          </div>
        </div>
      </div>
    );
  }
}
