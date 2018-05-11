(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclMonaco', {
            bindings: {
                language: '<',
                functionSourceCode: '<',
                onChangeSourceCodeCallback: '&',
                selectedTheme: '<',
                miniMonaco: '<',
                readOnly: '<'
            },
            templateUrl: 'nuclio/common/components/monaco/monaco.tpl.html',
            controller: NclMonacoController
        });

    function NclMonacoController($scope) {
        var ctrl = this;

        ctrl.$onInit = onInit;

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
                    ctrl.onChangeSourceCodeCallback({sourceCode: $scope.selectedCodeFile.code, language: ctrl.language});
                }
            });

            $scope.$on('monaco_on-change-content', setNewSourceCode);
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
            ctrl.language = data.language;
            $scope.selectedCodeFile = {
                language: data.language,
                code: data.code
            };
        }
    }
}());
