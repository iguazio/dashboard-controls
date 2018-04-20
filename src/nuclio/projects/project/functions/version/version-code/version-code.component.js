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

    function NclVersionCodeController($element, $timeout, lodash, PreventDropdownCutOffService) {
        var ctrl = this;
        ctrl.codeEntryTypeArray = [
            {
                id: 'online',
                visible: true,
                name: 'Edit online'
            },
            {
                id: 'upload',
                visible: true,
                name: 'Upload archive'
            },
            {
                id: 's3',
                visible: true,
                name: 'S3 URL'
            },
            {
                id: 'repository',
                visible: true,
                name: 'Git repository'
            }
        ];
        ctrl.themesArray = [
            {
                id: 'custom-vs',
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

        ctrl.sourceCode = atob(ctrl.version.spec.build.functionSourceCode);

        ctrl.$onInit = onInit;
        ctrl.selectEntryTypeValue = selectEntryTypeValue;
        ctrl.selectRuntimeValue = selectRuntimeValue;
        ctrl.selectThemeValue = selectThemeValue;
        ctrl.onCloseDropdown = onCloseDropdown;
        ctrl.inputValueCallback = inputValueCallback;

        ctrl.onChangeSourceCode = onChangeSourceCode;

        function onInit() {
            ctrl.runtimeArray = getRuntimes();

            ctrl.selectedRuntime = lodash.find(ctrl.runtimeArray, ['id', ctrl.version.spec.runtime]);

            ctrl.selectedEntryType = ctrl.codeEntryTypeArray[0];
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

            lodash.assign(ctrl.version, {
                spec: {
                    runtime: item.id,
                    build: {
                        functionSourceCode: item.sourceCode
                    }
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
            return [
                {
                    id: 'golang',
                    name: 'Golang',
                    sourceCode: 'cGFja2FnZSBtYWluDQoNCmltcG9ydCAoDQogICAgImdpdGh1Yi5jb20vbnVjbGlvL251Y2xpby1zZGstZ28iDQo' +
                    'pDQoNCmZ1bmMgSGFuZGxlcihjb250ZXh0ICpudWNsaW8uQ29udGV4dCwgZXZlbnQgbnVjbGlvLkV2ZW50KSAoaW50ZXJmYWNle3' +
                    '0sIGVycm9yKSB7DQogICAgcmV0dXJuIG5pbCwgbmlsDQp9', // source code in base64
                    visible: true
                },
                {
                    id: 'python',
                    name: 'Python',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHBhc3M=', // source code in base64
                    visible: true
                },
                {
                    id: 'pypy',
                    name: 'PyPy',
                    sourceCode: 'ZGVmIGhhbmRsZXIoY29udGV4dCwgZXZlbnQpOg0KICAgIHBhc3M=', // source code in base64
                    visible: true
                },
                {
                    id: 'nodejs',
                    sourceCode: 'ZXhwb3J0cy5oYW5kbGVyID0gZnVuY3Rpb24oY29udGV4dCwgZXZlbnQpIHsNCn07', // source code in base64
                    name: 'NodeJS',
                    visible: true
                },
                {
                    id: 'shell',
                    name: 'Shell Java',
                    sourceCode: '',
                    visible: true
                }
            ];
        }
    }
}());
