import React from 'react';
import Quill from 'quill';
import FilesafeEmbed from 'filesafe-embed';
import EditorKit from '@standardnotes/editor-kit';
import { SKAlert } from 'sn-stylekit';
import Filesafe from 'filesafe-js';

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
                console.log(`insert raw text: ${rawText}`)
                let index = 0;
                if (this.quill.getSelection()) {
                    index = this.quill.getSelection().index
                }
                this.quill.clipboard.dangerouslyPasteHTML(index, rawText, 'api')
            },
            setEditorRawText: (rawText) => {
                console.log('set raw text')
                const quillDelta = this.quill.clipboard.convert(rawText)
                this.quill.setContents(quillDelta)
            },
            getCurrentLineText: () => {
                console.log('get current line')
                const line = this.quill.getLine(this.quill.getSelection().index)
                if (line && line.domNode) {
                    console.log(line.domNode)
                    return line.domNode;
                }
            },
            getPreviousLineText: () => {
                console.log('get previous line')
                return ""
            },
            replaceText: ({ regex, replacement, previousLine }) => {
                console.log('replace text')
                console.log(regex)
                console.log(replacement)
                console.log(previousLine)
            },
            getElementsBySelector: (selector) => {
                console.log(`get elements by selector ${selector}`)
                return document.getElementsByClassName('ql-editor')[0].querySelectorAll(selector)
            },
            insertElement: (element, inVicinityOfElement, insertionType) => {
                console.log(element)
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
            supportsFileSafe: true,
            coallesedSavingDelay: 150
        });
    }

    async configureEditor() {
        const filesafeInstance = await this.editorKit.getFileSafe();
        window.filesafe_params = {
            embed: FilesafeEmbed,
            client: filesafeInstance
        };

        var toolbarOptions = [
            ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
            ['blockquote', 'code-block'],

            [{ 'header': 1 }, { 'header': 2 }],               // custom button values
            [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
            [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
            [{ 'direction': 'rtl' }],                         // text direction
            [ 'link', 'image'],

            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

            [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
            [{ 'align': [] }],

            ['clean']                                         // remove formatting button
        ];

        this.quill = new Quill('#editor', {
            modules: {
                toolbar: {
                    container: toolbarOptions,
                    handlers: {
                        image: imageHandler
                    }
                }
            },
            theme: 'snow'
        });

        const c = this;
        const Delta = Quill.import('delta');
        const Inline = Quill.import('blots/inline');

        this.quill.on('text-change', function(delta, oldDelta, source) {
            c.editorKit.onEditorValueChanged(c.quill.root.innerHTML);
        });

        /*
        Create a custom LabelBlot that allows us to hold a <label>
        necessary for Standard Note Filesafe image workflow
         */
        class LabelBlot extends Inline {
            static create(value) {
                let node = super.create();
                node.setAttribute('id', value);
                node.setAttribute('ghost', value);
                node.setAttribute('contenteditable', value);
                return node;
            }

            static formats(node) {
                return node.getAttribute('id');
            }
        }
        LabelBlot.blotName = 'label';
        LabelBlot.tagName = 'label';
        Quill.register(LabelBlot);


        /*
        This will only handle images that are added to the editor when the image button is used in the toolbar.
        Images that are pasted or dragged into the editor will not go through this function and
        drastically slow down the editor.
         */
        function imageHandler() {
            var range = this.quill.getSelection();
            //var value = prompt('What is the image URL');
            //this.quill.insertEmbed(range.index, 'image', value, Quill.sources.USER);

            //this.filesafe = window.filesafe_params;
            //const mountPoint = document.getElementById('filesafe-react-client');
            //this.filesafe.embed.FilesafeEmbed.renderInElement(mountPoint, this.filesafe.client);

            var input = document.createElement('input');
            input.type = 'file';

            input.onchange = e => {

                // getting a hold of the file reference
                var file = e.target.files[0];

                console.log(c.editorKit)

                if (!c.editorKit.canUploadFiles()) {
                    console.log('Cant upload files')
                    // TODO: Show the Filesafe modal
                    return;
                }

                c.editorKit.uploadJSFileObject(file).then((descriptor) => {
                    console.log(descriptor)
                    if (!descriptor || !descriptor.uuid) {
                        alert("File failed to upload. Please try again");
                    }
                });
            }
            input.click();
        }
    }

    render() {
        return (
            <div key="editor" className={'sn-component'} />
        );
    }
}