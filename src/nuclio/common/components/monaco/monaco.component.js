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

            $scope.$watch('selectedCodeFile.code', function () {
                if (angular.isFunction(ctrl.onChangeSourceCodeCallback)) {
                    ctrl.onChangeSourceCodeCallback({
                        sourceCode: $scope.selectedCodeFile.code,
                        language: $scope.selectedCodeFile.language
                    });
                }
            });

            $scope.$on('monaco_on-change-content', setNewSourceCode);
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
         * Sets new code data such as source code and language
         * @param {Event} event
         * @param {Object} data
         */
        function setNewSourceCode(event, data) {
            if (angular.isUndefined(data.name) || data.name === ctrl.name) {
                ctrl.language = data.language;
                $scope.selectedCodeFile = {
                    language: data.language,
                    code: data.code
                };
            }
        }
    }
}());
