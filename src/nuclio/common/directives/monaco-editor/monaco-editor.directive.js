/*
Copyright 2018 Iguazio Systems Ltd.
Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.
In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
(function () {
    'use strict';

    require.config({ paths: { 'vs': '/assets/monaco-editor/min/vs' } });

    angular.module('iguazio.dashboard-controls')
        .directive('igzMonacoEditor', function (lodash) {
            function link(scope, element, attrs) {
                var editorElement = element[0];
                require(['vs/editor/editor.main'], function () {
                    var editorContext = {
                        scope: scope,
                        element: element,
                        attrs: attrs,
                        onThemeChanged: function onThemeChanged(newValue, oldValue) {
                            window.monaco.editor.setTheme(lodash.defaultTo(newValue, 'vs-dark'));
                        },
                        onFileLanguageChanged: function (newValue) {
                            // update the language model (and set `insertSpaces`)
                            var newModel = window.monaco.editor.createModel('', newValue.language);
                            newModel.updateOptions({ insertSpaces: lodash.defaultTo(newValue.useSpaces, true) });
                            this.editor.setModel(newModel);

                            // update the code
                            this.editor.setValue(scope.codeFile.code);
                        },
                        onCodeFileChanged: function () {
                            if (!lodash.isEqual(this.editor.getValue(), scope.codeFile.code)) {
                                this.editor.setValue(scope.codeFile.code);
                            }
                        },
                        onReadOnlyCodeFileChanged: function () {
                            this.editor.setValue(scope.codeFile.code);
                        },
                        onWrapStateChanged: function onWrapStateChanged(newState) {
                            this.editor.updateOptions({ wordWrap: newState ? 'on' : 'off' });
                        },
                        onFontSizeChanged: function (newFontSize) {
                            this.editor.updateOptions({ fontSize: newFontSize });
                        },
                        onReadOnlyChanged: function (newReadOnly) {
                            this.editor.updateOptions({ readOnly: newReadOnly });
                        }
                    };

                    editorContext.editor = window.monaco.editor.defineTheme('custom-vs', {
                        base: 'vs',
                        inherit: true,
                        rules: [
                            { token: '', foreground: '474056', background: 'ffffff' },
                            { token: 'number', foreground: '474056' },
                            { token: 'delimiter', foreground: '474056' },
                            { token: 'string', foreground: '21d4ac' }
                        ],
                        colors: {
                            'editor.foreground': '#474056',
                            'editor.background': '#ffffff',
                            'editorLineNumber.foreground': '#474056',
                            'editorGutter.background': '#e1e0e5',
                            'textBlockQuote.border': '#ffffff',
                            'editorCursor.foreground': '#8B0000',
                            'editor.lineHighlightBackground': '#e1e0e5',
                            'editorMarkerNavigation.background': '#000000',
                            'editor.selectionBackground': '#239bca',
                            'editorIndentGuide.background': '#e1e0e5'
                        }
                    });

                    editorContext.editor = window.monaco.editor.create(editorElement, {
                        value: scope.codeFile.code,
                        language: scope.fileLanguage.language,
                        theme: 'vs',
                        automaticLayout: true,
                        dragAndDrop: true,
                        lineNumbersMinChars: scope.miniMonaco ? 2 : 5,
                        lineNumbers: scope.miniMonaco && !scope.showLineNumbers ? 'off' : 'on', // hide line number if it's a mini-monaco
                        minimap: {
                            enabled: !scope.miniMonaco // hide mini-map if it's a mini-monaco
                        },
                        readOnly: scope.readOnly,
                        wordWrap: scope.wordWrap ? 'on' : 'off'
                    });

                    // change content callback
                    editorContext.editor.onDidChangeModelContent(function () {

                        // call callback from upper scope (monaco component) with new changed code
                        scope.onCodeChange(editorContext.editor.getValue());
                    });

                    // set up watch for codeFile changes to reflect updates
                    scope.$watch('fileLanguage', editorContext.onFileLanguageChanged.bind(editorContext));
                    scope.$watch('editorTheme', editorContext.onThemeChanged.bind(editorContext));
                    scope.$watch('wordWrap', editorContext.onWrapStateChanged.bind(editorContext));
                    scope.$watch('codeFile', editorContext.onCodeFileChanged.bind(editorContext));
                    scope.$watch('fontSize', editorContext.onFontSizeChanged.bind(editorContext));
                    scope.$watch('readOnly', editorContext.onReadOnlyChanged.bind(editorContext));

                    scope.$on('function-import-source-code', editorContext.onReadOnlyCodeFileChanged.bind(editorContext));
                });
            }

            return {
                link: link,
                scope: {
                    codeFile: '=codeFile',
                    editorTheme: '=editorTheme',
                    fontSize: '=fontSize',
                    fileLanguage: '=fileLanguage',
                    miniMonaco: '=miniMonaco',
                    showLineNumbers: '=showLineNumbers',
                    onCodeChange: '=onCodeChange',
                    readOnly: '=readOnly',
                    wordWrap: '=wordWrap'
                }
            };
        });

    require(['vs/editor/editor.main'], function () {
        window.monaco.languages.registerCompletionItemProvider('python', {
            provideCompletionItems: function () {
                return [
                    {
                        label: 'def',
                        kind: window.monaco.languages.CompletionItemKind.Keyword,
                        insertText: {
                            value: 'def ${1:name}():\r\t$0'
                        }
                    }
                ];
            }
        });
    });
}());
