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
                readOnly: '<?',
                wordWrap: '<?',
                name: '@?'
            },
            templateUrl: 'nuclio/common/components/monaco/monaco.tpl.html',
            controller: NclMonacoController
        });

    function NclMonacoController($scope) {
        var ctrl = this;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.onCodeChange = onCodeChange;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            $scope.selectedCodeFile = {
                language: ctrl.language,
                code: ctrl.functionSourceCode
            };
        }

        /**
         * On changes method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.language) && !changes.language.isFirstChange()) {
                $scope.selectedCodeFile = {
                    language: changes.language.currentValue,
                    code: $scope.selectedCodeFile.code
                };
            }
        }

        //
        // Private method
        //

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
    }
}());
