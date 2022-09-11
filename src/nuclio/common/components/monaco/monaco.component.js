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

    angular.module('iguazio.dashboard-controls')
        .component('nclMonaco', {
            bindings: {
                language: '<',
                functionSourceCode: '<',
                onChangeSourceCodeCallback: '&',
                selectedTheme: '<',
                miniMonaco: '<?',
                noTopPadding: '<?',
                showLineNumbers: '<?',
                showTextSizeDropdown: '<?',
                readOnly: '<?',
                wordWrap: '<?',
                name: '@?'
            },
            templateUrl: 'nuclio/common/components/monaco/monaco.tpl.html',
            controller: NclMonacoController
        });

    function NclMonacoController($scope, lodash) {
        var ctrl = this;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;

        ctrl.onCodeChange = onCodeChange;
        ctrl.onTextSizeChange = onTextSizeChange;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.noTopPadding = lodash.defaultTo(ctrl.noTopPadding, ctrl.showTextSizeDropdown);

            $scope.selectedCodeFile = {
                code: ctrl.functionSourceCode
            };

            $scope.selectedFileLanguage = {
                language: ctrl.language
            };
        }

        /**
         * On changes method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.language) && !changes.language.isFirstChange()) {
                $scope.selectedCodeFile = {
                    code: $scope.selectedCodeFile.code
                };

                $scope.selectedFileLanguage = {
                    language: changes.language.currentValue
                };
            }

            if (angular.isDefined(changes.functionSourceCode) && !changes.functionSourceCode.isFirstChange()) {
                $scope.selectedCodeFile = {
                    code: changes.functionSourceCode.currentValue
                };
            }
        }

        /**
         * On code change callback.
         * igz-monaco-editor directive calls this callback with new changed content
         * @param {string} newCode - changed code
         */
        function onCodeChange(newCode) {
            if (angular.isFunction(ctrl.onChangeSourceCodeCallback)) {
                ctrl.onChangeSourceCodeCallback({
                    sourceCode: newCode,
                    language: $scope.selectedCodeFile.language
                });
            }
        }

        /**
         * On text size dropdown change
         * @param {string} newTextSize
         */
        function onTextSizeChange(newTextSize) {
            if (!lodash.isNil(newTextSize)) {
                ctrl.selectedTextSize = newTextSize;
            }
        }
    }
}());
