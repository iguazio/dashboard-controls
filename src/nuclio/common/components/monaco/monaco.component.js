(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclMonaco', {
            bindings: {
                language: '<',
                functionSourceCode: '<',
                onChangeSourceCodeCallback: '&',
                selectedTheme: '<'
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
                code: atob(ctrl.functionSourceCode)
            };

            $scope.$watch('selectedCodeFile.code', function () {
                if (angular.isFunction(ctrl.onChangeSourceCodeCallback)) {
                    ctrl.onChangeSourceCodeCallback({sourceCode: $scope.selectedCodeFile.code});
                }
            });
        }

        /**
         * On changes method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.language) && angular.isDefined(changes.functionSourceCode)) {
                if (!changes.language.isFirstChange() && !changes.functionSourceCode.isFirstChange()) {
                    $scope.selectedCodeFile = {
                        language: changes.language.currentValue,
                        code: atob(changes.functionSourceCode.currentValue)
                    };
                }
            }
        }
    }
}());
