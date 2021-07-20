import React from 'react';
import Quill from 'quill';


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

    }

    async configureEditor() {
        var editor = new Quill('#editor', {
            modules: { toolbar: '#toolbar' },
            theme: 'snow'
        });
    }

    render() {
        return (
            <div key="editor" className={'sn-component'} />
        );
    }
}