(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionCode', {
            bindings: {
                version: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-code/version-code.tpl.html',
            controller: NclVersionCodeController
        });

    function NclVersionCodeController($element, $rootScope, $scope, $timeout, lodash, Base64, ConfigService, DialogsService,
                                      VersionHelperService) {
        var ctrl = this;

        var previousEntryType = null;

        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                autoScrollOnFocus: false,
                updateOnContentResize: true
            }
        };
        ctrl.scrollConfigHorizontal = {
            axis: 'x',
            advanced: {
                autoScrollOnFocus: false,
                updateOnContentResize: true
            },
            callbacks: {
                onCreate: function () {
                    ctrl.scrollContainer = this.querySelector('.mCSB_container');
                    ctrl.scrollContainer.style.height = '100%';
                }
            }
        };
        ctrl.codeEntryTypeArray = [
            {
                id: 'sourceCode',
                visible: true,
                name: 'Edit online'
            },
            {
                id: 'image',
                visible: true,
                name: 'Image'
            },
            {
                id: 'archive',
                visible: true,
                name: 'Archive'
            },
            {
                id: 'jar',
                visible: lodash.get(ctrl.version, 'spec.runtime') === 'java',
                name: 'Jar'
            }
        ];
        ctrl.themesArray = [
            {
                id: 'vs',
                name: 'Light',
                visible: true
            },
            {
                id: 'vs-dark',
                name: 'Dark',
                visible: true
            }
        ];
        ctrl.selectedTheme = lodash.get(ctrl.version, 'ui.editorTheme', ctrl.themesArray[0]);

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.onChangeSourceCode = onChangeSourceCode;
        ctrl.selectEntryTypeValue = selectEntryTypeValue;
        ctrl.selectRuntimeValue = selectRuntimeValue;
        ctrl.selectThemeValue = selectThemeValue;

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.isNil(ctrl.version.ui.deployedVersion)) {
                VersionHelperService.checkVersionChange(ctrl.version);
            }

            ctrl.runtimeArray = getRuntimes();
            ctrl.selectedRuntime = lodash.find(ctrl.runtimeArray, ['id', ctrl.version.spec.runtime]);
            ctrl.editorLanguage = ctrl.selectedRuntime.language;

            var sourceCode = lodash.get(ctrl.version, 'spec.build.functionSourceCode', '');
            if (lodash.isEmpty(sourceCode)) {
                var savedSourceCode = lodash.get(ctrl.version, 'ui.versionCode', sourceCode);

                ctrl.sourceCode = savedSourceCode;
            } else {
                ctrl.sourceCode = Base64.decode(sourceCode);

                lodash.set(ctrl.version, 'ui.versionCode', sourceCode);
            }

            if (lodash.has(ctrl.version, 'spec.build.codeEntryType')) {
                ctrl.selectedEntryType = lodash.find(ctrl.codeEntryTypeArray, ['id', ctrl.version.spec.build.codeEntryType]);
            } else {
                ctrl.selectedEntryType = ctrl.codeEntryTypeArray[0];
                lodash.set(ctrl.version, 'spec.build.codeEntryType', ctrl.selectedEntryType.id);
            }

            ctrl.image = lodash.get(ctrl.version, 'spec.image', '');
            ctrl.archive = lodash.get(ctrl.version, 'spec.build.path', '');

            previousEntryType = ctrl.selectedEntryType;
        }

        /**
         * Post linking method
         */
        function postLink() {
            $timeout(onDragNDropFile);
        }

        //
        // Public methods
        //

        /**
         * Sets new value to entity type
         * @param {Object} item
         */
        function selectEntryTypeValue(item) {
            ctrl.selectedEntryType = item;

            lodash.set(ctrl.version, 'spec.build.codeEntryType', ctrl.selectedEntryType.id);

            if (lodash.includes(['image', 'archive', 'jar'], item.id)) {
                var functionSourceCode = lodash.get(ctrl.version, 'spec.build.functionSourceCode', '');
                lodash.merge(ctrl.version, {
                    spec: {
                        build: {
                            functionSourceCode: ''
                        }
                    }
                });

                if (previousEntryType.id === 'sourceCode') {
                    lodash.set(ctrl.version, 'ui.versionCode', functionSourceCode);
                }

                if ((item.id === 'image' && lodash.isEmpty(ctrl.version.spec.image)) ||
                    (item.id !== 'image' && lodash.isEmpty(ctrl.version.spec.build.path))) {
                    $rootScope.$broadcast('change-state-deploy-button', {component: 'code', isDisabled: true});
                }
            } else {
                var savedSourceCode = lodash.get(ctrl.version, 'ui.versionCode', '');
                lodash.set(ctrl.version, 'spec.build.functionSourceCode', savedSourceCode);
                ctrl.sourceCode = Base64.decode(savedSourceCode);

                $rootScope.$broadcast('change-state-deploy-button', {component: 'code', isDisabled: false});
            }

            if (ctrl.scrollContainer) {
                $timeout(function () {
                    ctrl.scrollContainer.style.height = '100%';
                })
            }

            previousEntryType = ctrl.selectedEntryType;
        }

        /**
         * Sets new selected theme for editor
         * @param {Object} item
         */
        function selectThemeValue(item) {
            ctrl.version.ui.editorTheme = item;
            ctrl.selectedTheme = item;
        }

        /**
         * Sets new value to runtime
         * @param {Object} item
         */
        function selectRuntimeValue(item) {
            ctrl.selectedRuntime = item;
            ctrl.editorLanguage = ctrl.selectedRuntime.language;

            lodash.set(ctrl.version, 'spec.runtime', item.id);
            lodash.set(ctrl.version, 'spec.build.functionSourceCode', item.sourceCode);
            lodash.set(ctrl.version, 'ui.versionCode', item.sourceCode);

            VersionHelperService.checkVersionChange(ctrl.version);
        }

        /**
         * Changes function`s source code
         * @param {string} sourceCode
         */
        function onChangeSourceCode(sourceCode) {
            lodash.set(ctrl.version, 'spec.build.functionSourceCode', Base64.encode(sourceCode));
            lodash.set(ctrl.version, 'ui.versionCode', Base64.encode(sourceCode));

            ctrl.sourceCode = sourceCode;

            VersionHelperService.checkVersionChange(ctrl.version);
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.version, field, newData);
            VersionHelperService.checkVersionChange(ctrl.version);

            $timeout(function () {
                $rootScope.$broadcast('change-state-deploy-button', {
                    component: 'code',
                    isDisabled: ctrl.versionCodeForm.$invalid
                });
            });
        }

        //
        // Private methods
        //

        /**
         * Extracts a file name from a provided path
         * @param {string} path - the path including a file name (delimiters: '/' or '\' or both, can be consecutive)
         * @param {boolean} [includeExtension=true] - set to `true` to include extension, or `false` to exclude it
         * @param {boolean} [onlyExtension=false] - set to `true` to include extension only, or `false` to include file name
         * @returns {string} the file name at the end of the given path with or without its extension (depending on the
         *     value of `extension` parameter)
         *
         * @example
         * ```js
         * extractFileName('/path/to/file/file.name.ext');
         * // => 'file.name.ext'
         *
         * extractFileName('\\path/to\\file/file.name.ext', false);
         * // => 'file.name'
         *
         * extractFileName('file.name.ext', false);
         * // => 'file.name'
         *
         * extractFileName('/path/to/////file\\\\\\\\file.name.ext', true);
         * // => 'file.name.ext'
         *
         * extractFileName('/path/to/file\file.name.ext', true, true);
         * // => 'ext'
         *
         * extractFileName('/path/to/file/file.name.ext', false, true);
         * // => '.'
         *
         * extractFileName('');
         * // => ''
         *
         * extractFileName(undefined);
         * // => ''
         *
         * extractFileName(null);
         * // => ''
         * ```
         */
        function extractFileName(path, includeExtension, onlyExtension) {
            var start = path.lastIndexOf(lodash.defaultTo(onlyExtension, false) ? '.' : '/') + 1;
            var end = lodash.defaultTo(includeExtension, true) ? path.length : path.lastIndexOf('.');

            return lodash.defaultTo(path, '').replace('\\', '/').substring(start, end);
        }

        /**
         * Gets all runtimes
         * @returns {Array}
         */
        function getRuntimes() {

            // language identifiers for monaco editor are taken from:
            // https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers
            return [
                {
                    id: 'golang',
                    ext: 'go',
                    name: 'Go',
                    language: 'go',
                    sourceCode: 'cGFja2FnZSBtYWluDQoNCmltcG9ydCAoDQogICAgImdpdGh1Yi5jb20vbnVjbGlvL251Y2xpby1zZGstZ28iDQo' +
                    'pDQoNCmZ1bmMgSGFuZGxlcihjb250ZXh0ICpudWNsaW8uQ29udGV4dCwgZXZlbnQgbnVjbGlvLkV2ZW50KSAoaW50ZXJmYWNle3' +
                    '0sIGVycm9yKSB7DQogICAgcmV0dXJuIG5pbCwgbmlsDQp9', // source code in base64
                    visible: true
                },
                {
                    id: 'python:2.7',
                    ext: 'py',
                    name: 'Python 2.7',
                    language: 'python',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                    visible: true
                },
                {
                    id: 'python:3.6',
                    ext: 'py',
                    name: 'Python 3.6',
                    language: 'python',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                    visible: true
                },
                {
                    id: 'pypy',
                    ext: 'pypy',
                    name: 'PyPy',
                    language: 'python',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                    visible: true
                },
                {
                    id: 'dotnetcore',
                    ext: 'cs',
                    name: '.NET Core',
                    language: 'csharp',
                    sourceCode: 'dXNpbmcgU3lzdGVtOw0KdXNpbmcgTnVjbGlvLlNkazsNCg0KcHVibGljIGNsYXNzIG1haW4NCnsNCiAgICBwdWJ' +
                    'saWMgb2JqZWN0IGhhbmRsZXIoQ29udGV4dCBjb250ZXh0LCBFdmVudCBldmVudEJhc2UpDQogICAgew0KICAgICAgICByZXR1cm' +
                    '4gbmV3IFJlc3BvbnNlKCkNCiAgICAgICAgew0KICAgICAgICAgICAgU3RhdHVzQ29kZSA9IDIwMCwNCiAgICAgICAgICAgIENvb' +
                    'nRlbnRUeXBlID0gImFwcGxpY2F0aW9uL3RleHQiLA0KICAgICAgICAgICAgQm9keSA9ICIiDQogICAgICAgIH07DQogICAgfQ0K' +
                    'fQ==', // source code in base64
                    visible: true
                },
                {
                    id: 'java',
                    ext: 'java',
                    name: 'Java',
                    language: 'java',
                    sourceCode: 'aW1wb3J0IGlvLm51Y2xpby5Db250ZXh0Ow0KaW1wb3J0IGlvLm51Y2xpby5FdmVudDsNCmltcG9ydCBpby5udWN' +
                    'saW8uRXZlbnRIYW5kbGVyOw0KaW1wb3J0IGlvLm51Y2xpby5SZXNwb25zZTsNCg0KcHVibGljIGNsYXNzIEhhbmRsZXIgaW1wbG' +
                    'VtZW50cyBFdmVudEhhbmRsZXIgew0KDQogICAgQE92ZXJyaWRlDQogICAgcHVibGljIFJlc3BvbnNlIGhhbmRsZUV2ZW50KENvb' +
                    'nRleHQgY29udGV4dCwgRXZlbnQgZXZlbnQpIHsNCiAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKCkuc2V0Qm9keSgiIik7DQog' +
                    'ICAgfQ0KfQ==',
                    visible: true
                },
                {
                    id: 'nodejs',
                    ext: 'js',
                    language: 'javascript',
                    sourceCode: 'ZXhwb3J0cy5oYW5kbGVyID0gZnVuY3Rpb24oY29udGV4dCwgZXZlbnQpIHsNCiAgICBjb250ZXh0LmNhbGxiYWN' +
                    'rKCcnKTsNCn07', // source code in base64
                    name: 'NodeJS',
                    visible: true
                },
                {
                    id: 'shell',
                    ext: 'sh',
                    name: 'Shell',
                    language: 'shellscript',
                    sourceCode: '',
                    visible: true
                },
                {
                    id: 'ruby',
                    ext: 'rb',
                    name: 'Ruby',
                    language: 'ruby',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpDQplbmQ=', // source code in base64
                    visible: true
                }
            ];
        }

        /**
         * Tests whether a file is valid for dropping in code editor according to its MIME type and its extension
         * @param {string} type - the MIME type of the file (e.g. 'text/plain', 'application/javascript')
         * @param {string} extension - the extension of the file (e.g. 'txt', 'py', 'html')
         * @returns {boolean} `true` if the file is valid for dropping in code editor, or `false` otherwise
         */
        function isFileDropValid(type, extension) {

            // Drag'n'Drop textual files into the code editor
            var validFileExtensions = ['cs', 'py', 'pypy', 'go', 'sh', 'txt', 'js', 'java'];

            return lodash(type).startsWith('text/') || validFileExtensions.includes(extension);
        }

        /**
         * Sets informational background over monaco editor before dropping a file
         */
        function onDragNDropFile() {
            var codeEditor = $element.find('.monaco-code-editor');
            var nclMonaco = $element.find('.ncl-monaco');
            var codeEditorDropZone = $element.find('.code-editor-drop-zone');

            // Register event handlers for drag'n'drop of files to code editor
            codeEditor
                .on('dragover', null, false)
                .on('dragenter', null, function (event) {
                    codeEditorDropZone.addClass('dragover');

                    codeEditor.css('opacity', '0.4');
                    event.preventDefault();
                })
                .on('dragleave', null, function (event) {
                    var monacoCoords = nclMonaco[0].getBoundingClientRect();

                    if (event.originalEvent.pageX <= monacoCoords.left   || event.originalEvent.pageX >= monacoCoords.right ||
                        event.originalEvent.pageY >= monacoCoords.bottom || event.originalEvent.pageY <= monacoCoords.top) {
                        codeEditorDropZone.removeClass('dragover');
                        codeEditor.css('opacity', '');
                    }

                    event.preventDefault();
                })
                .on('drop', null, function (event) {
                    var itemType = lodash.get(event, 'originalEvent.dataTransfer.items[0].type');
                    var file = lodash.get(event, 'originalEvent.dataTransfer.files[0]');
                    var extension = extractFileName(file.name, true, true);

                    if (isFileDropValid(itemType, extension)) {
                        var reader = new FileReader();

                        reader.onload = function (onloadEvent) {
                            var functionSource = {
                                language: lodash.chain(ctrl.runtimeArray)
                                    .find(['ext', extension])
                                    .defaultTo({
                                        language: 'plaintext'
                                    })
                                    .value()
                                    .language,
                                code: onloadEvent.target.result
                            };
                            ctrl.sourceCode = functionSource.code;
                            ctrl.editorLanguage = functionSource.language;
                            $scope.$apply();

                            codeEditorDropZone.removeClass('dragover');
                            codeEditor.css('opacity', '');
                        };
                        reader.onerror = function () {
                            DialogsService.alert('Could not read file...');
                        };
                        reader.readAsText(file);
                    } else {
                        codeEditorDropZone.removeClass('dragover');
                        codeEditor.css('opacity', '');

                        DialogsService.alert('Invalid file type/extension');
                    }
                    event.preventDefault();
                });
        }
    }
}());
