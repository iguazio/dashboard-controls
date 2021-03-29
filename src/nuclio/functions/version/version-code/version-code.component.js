(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionCode', {
            bindings: {
                version: '<'
            },
            templateUrl: 'nuclio/functions/version/version-code/version-code.tpl.html',
            controller: NclVersionCodeController
        });

    function NclVersionCodeController($element, $rootScope, $scope, $timeout, $window, $i18next, i18next, lodash,
                                      Base64, ConfigService, DialogsService, VersionHelperService) {
        var ctrl = this;
        var scrollContainer = null;
        var previousEntryType = null;
        var lng = i18next.language;

        ctrl.githubToken = '';
        ctrl.layout = {
            collapsed: false
        };
        ctrl.scrollConfig = {
            axis: 'xy',
            advanced: {
                autoScrollOnFocus: false
            }
        };
        ctrl.scrollConfigHorizontal = {
            axis: 'x',
            advanced: {
                autoScrollOnFocus: false
            },
            callbacks: {
                onCreate: function () {
                    scrollContainer = this.querySelector('.mCSB_container');
                    scrollContainer.style.height = '100%';
                }
            }
        };
        ctrl.codeEntryTypeArray = [
            {
                id: 'sourceCode',
                visible: true,
                name: 'Source code (edit online)',
                tooltip: 'Provide the function source code in the dashboard',
                tooltipPlacement: 'right'
            },
            {
                id: 'image',
                visible: true,
                name: 'Image',
                defaultValues: {
                    spec: {
                        image: ''
                    }
                },
                tooltip: 'Deploy the function from an existing image',
                tooltipPlacement: 'right'
            },
            {
                id: 'archive',
                visible: true,
                name: 'Archive',
                defaultValues: {
                    spec: {
                        build: {
                            path: '',
                            codeEntryAttributes: {
                                headers: {
                                    'X-V3io-Session-Key': ''
                                },
                                workDir: ''
                            }
                        }
                    }
                },
                tooltip: 'Download a function-code archive file from an Iguazio Data Science Platform (with authentication) or from any other URL (without authentication)',
                tooltipPlacement: 'right'
            },
            {
                id: 'git',
                visible: true,
                name: 'Git',
                defaultValues: {
                    spec: {
                        build: {
                            path: '',
                            codeEntryAttributes: {
                                branch: '',
                                password: '',
                                reference: '',
                                tag: '',
                                username: '',
                                workDir: ''
                            }
                        }
                    }
                },
            },
            {
                id: 'github',
                visible: true,
                name: 'GitHub',
                defaultValues: {
                    spec: {
                        build: {
                            path: '',
                            codeEntryAttributes: {
                                branch: '',
                                headers: {
                                    'Authorization': ''
                                },
                                workDir: ''
                            }
                        }
                    }
                },
                tooltip: 'Download the function code from a GitHub repository',
                tooltipPlacement: 'right'
            },
            {
                id: 'jar',
                visible: lodash.get(ctrl.version, 'spec.runtime') === 'java',
                name: 'Jar',
                defaultValues: {
                    spec: {
                        build: {
                            path: ''
                        }
                    }
                }
            },
            {
                id: 's3',
                visible: true,
                name: 'S3',
                defaultValues: {
                    spec: {
                        build: {
                            codeEntryAttributes: {
                                s3Bucket: '',
                                s3ItemKey: '',
                                s3AccessKeyId: '',
                                s3SecretAccessKey: '',
                                s3Region: '',
                                s3SessionToken: '',
                                workDir: ''
                            }
                        }
                    }
                },
                tooltip: 'Download the function code from an AWS S3 bucket',
                tooltipPlacement: 'right'
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
        ctrl.$onChanges = onChanges;

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.onChangeGithubToken = onChangeGithubToken;
        ctrl.onChangeSourceCode = onChangeSourceCode;
        ctrl.selectEntryTypeValue = selectEntryTypeValue;
        ctrl.selectRuntimeValue = selectRuntimeValue;
        ctrl.selectThemeValue = selectThemeValue;

        /**
         * Initialization method
         */
        function onInit() {
            $scope.$on('navigation-tabs_toggle-test-pane', toggleTestPane);
            $scope.$on('ui.layout.resize', resizeScrollBar);
            $scope.$on('ui.layout.loaded', resizeScrollBar);

            angular.element($window).bind('resize', resizeScrollBar);
        }

        /**
         * Post linking method
         */
        function postLink() {
            $timeout(onDragNDropFile);
        }

        /**
         * On changes hook method.
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.version)) {
                ctrl.runtimeArray = getRuntimes();
                ctrl.selectedRuntime = lodash.find(ctrl.runtimeArray, ['id', ctrl.version.spec.runtime]);
                ctrl.editorLanguage = ctrl.selectedRuntime.language;

                var sourceCode = lodash.get(ctrl.version, 'spec.build.functionSourceCode', '');
                if (lodash.isEmpty(sourceCode)) {
                    ctrl.sourceCode = lodash.get(ctrl.version, 'ui.versionCode', sourceCode);
                } else {
                    ctrl.sourceCode = Base64.decode(sourceCode);

                    lodash.set(ctrl.version, 'ui.versionCode', sourceCode);
                }

                if (lodash.has(ctrl.version, 'spec.build.codeEntryType')) {
                    ctrl.selectedEntryType = lodash.find(ctrl.codeEntryTypeArray, ['id', ctrl.version.spec.build.codeEntryType]);
                    if (ctrl.selectedEntryType.id === 'github') {
                        ctrl.githubToken = lodash.chain(ctrl.version.spec.build)
                            .get('codeEntryAttributes.headers', {})
                            .find(function (value, key) {
                                return key.toLowerCase() === 'authorization';
                            })
                            .defaultTo('token ')
                            .value()
                            .split(/\s+/g)[1];
                    }
                } else {
                    ctrl.selectedEntryType = ctrl.codeEntryTypeArray[0];
                    lodash.set(ctrl.version, 'spec.build.codeEntryType', ctrl.selectedEntryType.id);
                }

                previousEntryType = ctrl.selectedEntryType;
            }
        }

        //
        // Public methods
        //

        /**
         * Sets new value to entity type and prepares the relevant fields for this type.
         * @param {Object} item - the selected option of "Code Entry Type" drop-down field.
         */
        function selectEntryTypeValue(item) {
            ctrl.selectedEntryType = item;

            lodash.set(ctrl.version, 'spec.build.codeEntryType', ctrl.selectedEntryType.id);
            var functionSourceCode = lodash.get(ctrl.version, 'spec.build.functionSourceCode', '');

            // delete the following paths ...
            lodash.forEach([
                'spec.image',
                'spec.build.codeEntryAttributes',
                'spec.build.path',
                'spec.build.functionSourceCode'
            ], lodash.unset.bind(lodash, ctrl.version));

            // ... then fill only the relevant ones with default value according to the selected option
            lodash.merge(ctrl.version, item.defaultValues);

            if (item.id === 'sourceCode') {

                // restore source code that was preserved in memory - if such exists
                var savedSourceCode = lodash.get(ctrl.version, 'ui.versionCode', '');
                lodash.set(ctrl.version, 'spec.build.functionSourceCode', savedSourceCode);
                ctrl.sourceCode = Base64.decode(savedSourceCode);

                if (!lodash.isNil(scrollContainer)) {
                    $timeout(function () {
                        scrollContainer.style.height = '100%';
                    })
                }

                $rootScope.$broadcast('change-state-deploy-button', {component: 'code', isDisabled: false});
            } else {

                // preserve source code (for later using it if the user selects "Edit Online" option)
                if (previousEntryType.id === 'sourceCode') {
                    lodash.set(ctrl.version, 'ui.versionCode', functionSourceCode);
                }

                // disable "Deploy" button if required fields of the selected option are empty
                if ((item.id === 'image' && lodash.isEmpty(ctrl.version.spec.image)) ||
                    (item.id !== 'image' && lodash.isEmpty(ctrl.version.spec.build.path))) {
                    $rootScope.$broadcast('change-state-deploy-button', {component: 'code', isDisabled: true});
                }
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

            VersionHelperService.updateIsVersionChanged(ctrl.version);
        }

        function onChangeGithubToken(newData) {
            ctrl.githubToken = newData;
            lodash.unset(ctrl.version, 'spec.build.codeEntryAttributes.headers.authorization');
            lodash.set(ctrl.version, 'spec.build.codeEntryAttributes.headers.Authorization', 'token ' + newData);
        }

        /**
         * Changes function`s source code
         * @param {string} sourceCode
         */
        function onChangeSourceCode(sourceCode) {
            lodash.set(ctrl.version, 'spec.build.functionSourceCode', Base64.encode(sourceCode));
            lodash.set(ctrl.version, 'ui.versionCode', Base64.encode(sourceCode));

            ctrl.sourceCode = sourceCode;

            VersionHelperService.updateIsVersionChanged(ctrl.version);
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.version, field, newData);
            VersionHelperService.updateIsVersionChanged(ctrl.version);

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
         * @param {boolean} [onlyExtension=false] - set to `true` to include extension only, or `false` to include file
         *     name
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
                    id: 'python:3.6',
                    ext: 'py',
                    name: 'Python 3.6',
                    language: 'python',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                    visible: true
                },
                {
                    id: 'python:3.7',
                    ext: 'py',
                    name: 'Python 3.7',
                    language: 'python',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                    visible: true
                },
                {
                    id: 'python:3.8',
                    ext: 'py',
                    name: 'Python 3.8',
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
            var validFileExtensions = ['cs', 'py', 'go', 'sh', 'txt', 'js', 'java'];

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
                            DialogsService.alert($i18next.t('functions.ERROR_MSG:COULD_NOT_READ_FILE', {lng: lng}));
                        };
                        reader.readAsText(file);
                    } else {
                        codeEditorDropZone.removeClass('dragover');
                        codeEditor.css('opacity', '');

                        DialogsService.alert($i18next.t('common:INVALID_FILE_TYPE_EXTENSION', {lng: lng}));
                    }
                    event.preventDefault();
                });
        }

        /**
         * Resize scrollbar container.
         * Layout directive (splitter) makes changes to width of scrollbar container. But scrollbar doesn't handle
         * those changes in correct way. So we have to set width manually
         * @param {Event} e - native broadcast event object
         * @param {number} [timeout=200] - function invocation delay in milliseconds
         */
        function resizeScrollBar(e, timeout) {
            $timeout(function () {
                var CODE_CONTAINER_MIN_WIDTH = 700;

                // if scrollbar container is wider than minimal code container width (scrollbar is not needed)
                if (angular.element($element.find('.code-scrollable-container')).width() >= CODE_CONTAINER_MIN_WIDTH) {
                    // make sure that scrollbar container takes all available width
                    angular.element($element.find('.mCSB_container')[0]).css('width', '100%');

                    // hide scrollbar (make it disabled)
                    angular.element($element.find('.igz-scrollable-container')[0]).mCustomScrollbar('disable', true);
                } else {
                    // set code's container minimal width to scrollbar container
                    angular.element($element.find('.mCSB_container')[0]).css('width', CODE_CONTAINER_MIN_WIDTH + 'px');
                }

                $timeout(function () {
                    // Enable scrolling again or show scrollbar
                    angular.element($element.find('.igz-scrollable-container')[0]).mCustomScrollbar('update');
                }, 100);
            }, timeout || 200);
        }

        /**
         * Broadcast's callback to toggle test pane
         * @param {Event} event - native broadcast event object
         * @param {Object} data - contains data of test pane state (closed/opened)
         */
        function toggleTestPane(event, data) {
            if (data.closeTestPane) {
                ctrl.layout.collapsed = true;
                angular.element(angular.element('.ui-splitbar')[0]).css('display', 'none');
            } else {
                ctrl.layout.collapsed = false;
                angular.element(angular.element('.ui-splitbar')[0]).css('display', 'block');
            }

            resizeScrollBar(null, 300);
        }
    }
}());
