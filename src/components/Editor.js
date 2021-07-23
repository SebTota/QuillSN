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

        /*
        * Resize Quill text area when a resize is detected to make sure the toolbar doesn't hide 
        * when scrolling
        */
        window.addEventListener('resize', () => { 
            const quillToolbar = document.getElementsByClassName('ql-toolbar')[0];
            const quillEditor = document.getElementById('editor')

            quillEditor.style.height = (window.innerHeight - quillToolbar.offsetHeight).toString() + "px";
        })
    }

    configureEditorKit() {
        const delegate = {
            insertRawText: (rawText) => {
                rawText = rawText.replace(/<p fsplaceholder=true.*?><\/p>/g, (match) => {return match.replace('></p>', '>FilesafePlaceholder</p>')}).replace(/display: none/g, '')
                let index = 0;
                if (this.quill.getSelection()) {
                    index = this.quill.getSelection().index
                }
                this.quill.clipboard.dangerouslyPasteHTML(index, rawText, 'api')
            },
            setEditorRawText: (rawText) => {
                rawText = rawText.replace(/<p fsplaceholder=true.*?><\/p>/g, (match) => {return match.replace('></p>', '>FilesafePlaceholder</p>')}).replace(/display: none/g, '')
                
                /*
                * Fixes bug where an extra new line is added every time a note is opened
                * Fixes bug where you can't open the Extensions tab when a note is opened
                */
                if (rawText === this.quill.root.innerHTML) {
                    return
                }

                //const quillDelta = this.quill.clipboard.convert(rawText)
                this.quill.setContents([])
                this.quill.clipboard.dangerouslyPasteHTML(0, rawText, 'api-settext')
            },
            getCurrentLineText: () => {
                const line = this.quill.getLine(this.quill.getSelection().index)[0]
                if (line && line.domNode && line.domNode.textContent) {
                    return line.domNode.textContent;
                }
            },
            getPreviousLineText: () => {
                const cursorLocation = this.quill.getSelection().index  // Get current cursor index
                const [line, offset] = this.quill.getLine(cursorLocation);  // Current line
                const previousLineIndex = cursorLocation - offset - 1;

                // Previous line may not exist if on the first line of editor
                if (previousLineIndex < 0) {
                    return false;
                }
                
                const [prevLine, prevOffset] = this.quill.getLine(previousLineIndex); // Get previous line
                return prevLine.domNode.textContent
            },
            replaceText: ({ regex, replacement, previousLine }) => {
                // TODO: Figure out what previousLine is required for

                const cursorLocation = this.quill.getSelection().index  // Get current cursor index
                replacement = replacement.replace(/<p fsplaceholder=true.*?><\/p>/g, (match) => {return match.replace('></p>', '>FilesafePlaceholder</p>')}).replace(/display: none/g, '')

                /*
                * line = line content
                * offset = index representing of where the provided cursorLocation starts in the given line, oh and also... "migos!"
                 */
                let [line, offset] = this.quill.getLine(cursorLocation);
                const newElementDelta = this.quill.clipboard.convert(replacement);

                const beginningOfCurrentLineIndex = cursorLocation - offset;
                const beginningOfRegex = beginningOfCurrentLineIndex + line.domNode.textContent.length;
                const removeLength = line.domNode.textContent.length - line.domNode.textContent.replace(regex, '').replace(/\s$/, '').trim().length;

                const Delta = Quill.import('delta');
                /*
                * Remove the existing item
                 */
                const a = new Delta().retain(beginningOfRegex).delete(removeLength);
                this.quill.updateContents(a, 'api')

                /*
                * Add the new replacement item
                 */
                // Try to not use dangerouslyPasteHTML as this may be deprecated in the next version of QuillJS
                // this.quill.clipboard.dangerouslyPasteHTML(removeIndexStart, replacement, 'api')
                const b = new Delta().retain(beginningOfRegex).concat(newElementDelta);
                this.quill.updateContents(b, 'api')
            },
            getElementsBySelector: (selector) => {
                return this.quill.root.querySelectorAll(selector)
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
            supportsFileSafe: true
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
                },
                clipboard: {
                    matchVisual: false
                }
            },
            theme: 'snow'
        });
        const Block = Quill.import("blots/block");

        const quillToolbar = document.getElementsByClassName('ql-toolbar')[0];
        const quillEditor = document.getElementById('editor')
        quillEditor.style.height = (window.innerHeight - quillToolbar.offsetHeight).toString() + "px";

        this.quill.on('text-change', (delta, oldDelta, source) => {
            if (source === 'api-settext') return
            this.editorKit.onEditorValueChanged(this.quill.root.innerHTML);
        });

        /*
        Create a custom LabelBlot that allows us to hold a <label>
        necessary for Standard Note Filesafe image workflow
         */
        class LabelBlot extends Block {
            static create(value) {
                let node = super.create();
                if (value.id) node.setAttribute('id', value.id);
                if (value.ghost) node.setAttribute('ghost', value.ghost);
                if (value.contenteditable) node.setAttribute('contenteditable', value.contenteditable);
                return node;
            }

            static formats(node) {
                return {
                    id: node.getAttribute('id'),
                    ghost: node.getAttribute('ghost'),
                    contenteditable: node.getAttribute('contenteditable')
                };
            }
        }
        LabelBlot.blotName = 'label';
        LabelBlot.tagName = 'label';
        Quill.register(LabelBlot);

        /*
        * Create a custom Quill/Parchment Blot that allows <p> elements with custom attributes. By default Quill strips all of these attributes
        * making it impossible for the EditorKit to later find the elements when inserting an image. 
        */
        class FilesafePlaceholderBlot extends Block {
            static create(value) {
                let node = super.create();
                if (value.fsplaceholder) node.setAttribute('fsplaceholder', value.fsplaceholder);
                if (value.style) node.setAttribute('style', value.style);
                if (value.fscollapsable) node.setAttribute('fscollapsable', value.fscollapsable);
                if (value.ghost) node.setAttribute('ghost', value.ghost);
                if (value.fsid) node.setAttribute('fsid', value.fsid);
                if (value.fsname) node.setAttribute('fsname', value.fsname);
                return node;
            }

            static formats(node) {
                return {
                    fsplaceholder: node.getAttribute('fsplaceholder'),
                    style: node.getAttribute('style'),
                    fscollapsable: node.getAttribute('fscollapsable'),
                    ghost: node.getAttribute('ghost'),
                    fsid: node.getAttribute('fsid'),
                    fsname: node.getAttribute('fsname')
                };
            }
        }
        FilesafePlaceholderBlot.blotName = 'FilesafePlaceholderBlot';
        FilesafePlaceholderBlot.tagName = 'p';
        Quill.register(FilesafePlaceholderBlot);

        /*
        This will only handle images that are added to the editor when the image button is used in the toolbar.
        Images that are pasted or dragged into the editor will not go through this function and
        drastically slow down the editor.
         */
        function imageHandler() {
            const filesafeModal = document.getElementById("filesafe-modal");
            this.filesafe = window.filesafe_params;
            const mountPoint = document.getElementById('filesafe-react-client');
            this.filesafe.embed.FilesafeEmbed.renderInElement(mountPoint, this.filesafe.client);
            filesafeModal.style.display = "block";

            /*
            * Below can be used if you would rather have the image handler show a regular image upload rather
            * than the FileSafe modal. The FileSafe modal would only show when a key or upload location
            * is not available. 
            */
            // var input = document.createElement('input');
            // input.type = 'file';
            //
            // input.onchange = e => {
            //     var file = e.target.files[0];
            //
            //     if (!c.editorKit.canUploadFiles()) {
            //         console.log('Cant upload files')
            //         // TODO: Show the Filesafe modal
            //         return;
            //     }
            //
            //     c.editorKit.uploadJSFileObject(file).then((descriptor) => {});
            // }
            // input.click();
        }

        
    }

    render() {
        return (
            <div key="editor" className={'sn-component'} />
        );
    }
}