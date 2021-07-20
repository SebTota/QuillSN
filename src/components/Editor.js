import React from 'react';
import Quill from 'quill';
import FilesafeEmbed from 'filesafe-embed';
import Filesafe from 'filesafe-js';
import EditorKit from '@standardnotes/editor-kit';


export default class Editor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        this.configureEditorKit();
        this.configureEditor();
    }

    configureEditorKit() {
        const delegate = {
            insertRawText: (rawText) => {
                let index = 0;
                if (this.quill.getSelection()) {
                    index = this.quill.getSelection().index
                }
                this.quill.clipboard.dangerouslyPasteHTML(index, rawText, 'api')
            },
            setEditorRawText: (rawText) => {
                const quillDelta = this.quill.clipboard.convert(rawText)
                this.quill.setContents(quillDelta)
            },
            getCurrentLineText: () => {
            },
            getPreviousLineText: () => {
            },
            replaceText: ({ regex, replacement, previousLine }) => {
            },
            getElementsBySelector: (selector) => {
                document.getElementsByClassName('ql-editor')[0].querySelectorAll('p')
            },
            insertElement: (element, inVicinityOfElement, insertionType) => {
                if (inVicinityOfElement) {
                    if (insertionType === 'afterend') {
                        inVicinityOfElement.insertAdjacentElement('afterend', element);
                    } else if (insertionType === 'child') {
                        inVicinityOfElement.after(element);
                    }
                } else {
                    let index = 0;
                    if (this.quill.getSelection()) {
                        index = this.quill.getSelection().index
                    }
                    this.quill.clipboard.dangerouslyPasteHTML(index, element.outerHTML, 'api')
                }
            },
            preprocessElement: (element) => {
                return element;
            },
            clearUndoHistory: () => {
                // Called when switching notes to prevent history mixup.
                this.quill.history.clear()
            },
            onNoteLockToggle: (isLocked) => {
                this.quill.enable(!isLocked)
            }
        };

        this.editorKit = new EditorKit(delegate, {
            mode: 'html',
            supportsFileSafe: false,
            coallesedSavingDelay: 0
        });
    }

    async configureEditor() {
        this.quill = new Quill('#editor', {
            modules: { toolbar: '#toolbar' },
            theme: 'snow'
        });

        const c = this;
        this.quill.on('text-change', function(delta, oldDelta, source) {
            c.editorKit.onEditorValueChanged(c.quill.root.innerHTML);
        });
    }

    render() {
        return (
            <div key="editor" className={'sn-component'} />
        );
    }
}