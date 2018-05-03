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

    function NclVersionCodeController($element, $stateParams, $timeout, lodash, PreventDropdownCutOffService) {
        var ctrl = this;

        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                autoScrollOnFocus: false,
                updateOnContentResize: true
            }
        };
        ctrl.codeEntryTypeArray = [
            {
                id: 'online',
                visible: true,
                name: 'Edit online'
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
        ctrl.selectedTheme = ctrl.themesArray[0];

        // Config for scrollbar on code-tab view
        ctrl.scrollConfig = {
            axis: 'xy',
            advanced: {
                autoScrollOnFocus: false,
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;

        ctrl.selectEntryTypeValue = selectEntryTypeValue;
        ctrl.selectRuntimeValue = selectRuntimeValue;
        ctrl.selectThemeValue = selectThemeValue;
        ctrl.onCloseDropdown = onCloseDropdown;
        ctrl.inputValueCallback = inputValueCallback;

        ctrl.onChangeSourceCode = onChangeSourceCode;

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.isNil(ctrl.version) && !lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            ctrl.runtimeArray = getRuntimes();
            ctrl.selectedRuntime = lodash.find(ctrl.runtimeArray, ['id', ctrl.version.spec.runtime]);
            ctrl.selectedEntryType = ctrl.codeEntryTypeArray[0];
            ctrl.sourceCode = atob(ctrl.version.spec.build.functionSourceCode);
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
            ctrl.version.spec.entryType = item.name;
        }

        /**
         * Sets new selected theme for editor
         * @param {Object} item
         */
        function selectThemeValue(item) {
            ctrl.selectedTheme = item;
        }

        /**
         * Sets new value to runtime
         * @param {Object} item
         */
        function selectRuntimeValue(item) {
            ctrl.selectedRuntime = item;

            lodash.assign(ctrl.version.spec, {
                runtime: item.id,
                build: {
                    functionSourceCode: item.sourceCode
                }
            });
        }

        /**
         * Handles on drop-down close
         */
        function onCloseDropdown() {
            $timeout(function () {
                var element = angular.element('.tab-content-wrapper');
                var targetElement = $element.find('.default-dropdown-container');

                if (targetElement.length > 0 && ctrl.selectedEntryType.name !== 'Edit online') {
                    PreventDropdownCutOffService.resizeScrollBarContainer(element, '.default-dropdown-container');
                }
            }, 40);
        }

        /**
         * Changes function`s source code
         * @param {string} sourceCode
         */
        function onChangeSourceCode(sourceCode) {
            lodash.set(ctrl.version, 'spec.build.functionSourceCode', btoa(sourceCode))
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.version, field, newData);
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
                    name: 'Go',
                    language: 'go',
                    sourceCode: 'cGFja2FnZSBtYWluDQoNCmltcG9ydCAoDQogICAgImdpdGh1Yi5jb20vbnVjbGlvL251Y2xpby1zZGstZ28iDQo' +
                    'pDQoNCmZ1bmMgSGFuZGxlcihjb250ZXh0ICpudWNsaW8uQ29udGV4dCwgZXZlbnQgbnVjbGlvLkV2ZW50KSAoaW50ZXJmYWNle3' +
                    '0sIGVycm9yKSB7DQogICAgcmV0dXJuIG5pbCwgbmlsDQp9', // source code in base64
                    visible: true
                },
                {
                    id: 'python:2.7',
                    name: 'Python 2.7',
                    language: 'python',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                    visible: true
                },
                {
                    id: 'python:3.6',
                    name: 'Python 3.6',
                    language: 'python',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                    visible: true
                },
                {
                    id: 'pypy',
                    name: 'PyPy',
                    language: 'python',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHJldHVybiAiIg==', // source code in base64
                    visible: true
                },
                {
                    id: 'dotnetcore',
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
                    language: 'javascript',
                    sourceCode: 'ZXhwb3J0cy5oYW5kbGVyID0gZnVuY3Rpb24oY29udGV4dCwgZXZlbnQpIHsNCiAgICBjb250ZXh0LmNhbGxiYWN' +
                    'rKCcnKTsNCn07', // source code in base64
                    name: 'NodeJS',
                    visible: true
                },
                {
                    id: 'shell',
                    name: 'Shell',
                    language: 'shellscript',
                    sourceCode: '',
                    visible: true
                }
            ];
        }
    }
}());
