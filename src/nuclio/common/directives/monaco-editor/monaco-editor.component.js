(function () {
    'use strict';

    require.config({ paths: { 'vs': '/assets/monaco-editor/min/vs' } });

    angular.module('iguazio.dashboard-controls')
        .directive('igzMonacoEditor', function ($interval) {
            // console.log('in igzMonacoEditor');
            function link(scope, element, attrs) {
                var editorElement = element[0];
                var interval = null;
                require(['vs/editor/editor.main'], function () {
                    var editorContext = {
                        scope: scope,
                        element: element,
                        attrs: attrs,
                        getValueOrDefault: function getValueOrDefault(value, defaultValue) {
                            if (angular.isUndefined(value) || value === null) {
                                return defaultValue;
                            } else {
                                return value;
                            }
                        },
                        onThemeChanged: function onThemeChanged(newValue, oldValue) {
                            window.monaco.editor.setTheme(this.getValueOrDefault(newValue, 'vs-dark'));
                        },
                        updateScope: function updateScope() {
                            this.scope.codeFile.code = this.editor.getValue();
                        },
                        onCodeFileChanged: function onCodeFileChanged(newValue, oldValue) {

                            // update the language model (and set `insertSpaces`)
                            var newModel = window.monaco.editor.createModel('', newValue.language);
                            newModel.updateOptions({ insertSpaces: this.getValueOrDefault(newValue.useSpaces, true) });
                            this.editor.setModel(newModel);

                            // update the code
                            this.editor.setValue(newValue.code);
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
                        language: scope.codeFile.language,
                        theme: 'vs',
                        // fontFamily: 'Roboto, sans-serif',
                        // lineNumbersMinChars: 2,
                        // lineHeight: 30,
                        // lineDecorationsWidth: 5,
                        automaticLayout: true
                        // scrollBeyondLastLine: false
                    });

                    // TODO - look up api docs to find a suitable event to handle as the onDidChangeModelContent event only seems to fire for certain changes!
                    // As a fallback, currently updating scope on a timer...
                    // editor.onDidChangeModelContent = function(e){
                    //   console.log('modelContent changed');
                    //   scope.code = editor.getValue();
                    //   scope.$apply();
                    // }
                    interval = $interval(editorContext.updateScope.bind(editorContext), 1000);

                    // set up watch for codeFile changes to reflect updates
                    scope.$watch('codeFile', editorContext.onCodeFileChanged.bind(editorContext));
                    scope.$watch('editorTheme', editorContext.onThemeChanged.bind(editorContext));

                    scope.$on('$destroy', function () {
                        if (interval !== null) {
                            $interval.cancel(interval);
                            interval = null;
                        }
                    });
                });
            }

            return {
                link: link,
                scope: {
                    codeFile: '=codeFile',
                    editorTheme: '=editorTheme'
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
                ]
            }
        })
    });
}());
