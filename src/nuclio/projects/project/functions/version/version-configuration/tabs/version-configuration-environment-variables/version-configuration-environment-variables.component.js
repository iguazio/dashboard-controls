(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationEnvironmentVariables', {
            bindings: {
                version: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-environment-variables/version-configuration-environment-variables.tpl.html',
            controller: NclVersionConfigurationEnvironmentVariablesController
        });

    function NclVersionConfigurationEnvironmentVariablesController($element, lodash, PreventDropdownCutOffService) {
        var ctrl = this;

        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.addNewVariable = addNewVariable;
        ctrl.handleAction = handleAction;
        ctrl.isScrollNeeded = isScrollNeeded;
        ctrl.onChangeData = onChangeData;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            var variables = lodash.get(ctrl.version, 'spec.env', []);

            ctrl.variables = lodash.map(variables, function (value, key) {
                return {
                    name: key,
                    value: value,
                    ui: {
                        editModeActive: false,
                        isFormValid: false
                    }
                }
            });
        }

        /**
         * Post linking method
         */
        function postLink() {

            // Bind DOM-related preventDropdownCutOff method to component's controller
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.three-dot-menu');
        }

        //
        // Public methods
        //

        /**
         * Adds new variable
         */
        function addNewVariable(event) {
            if (ctrl.variables.length < 1 || lodash.last(ctrl.variables).ui.isFormValid) {
                ctrl.variables.push({
                    name: '',
                    value: '',
                    ui: {
                        editModeActive: true,
                        isFormValid: false
                    }
                });
                event.stopPropagation();
            }
        }

        /**
         * Handler on specific action type
         * @param {string} actionType
         * @param {number} index - index of variable in array
         */
        function handleAction(actionType, index) {
            if (actionType === 'delete') {
                ctrl.variables.splice(index, 1);

                updateVariables();
            }

        }

        /**
         * Changes data of specific variable
         * @param {Object} variable
         * @param {number} index
         */
        function onChangeData(variable, index) {
            ctrl.variables[index] = variable;

            updateVariables();
        }

        /**
         * Returns true if scrollbar is necessary
         * @return {boolean}
         */
        function isScrollNeeded() {
            return ctrl.variables.length > 10;
        }

        /**
         * Updates function`s variables
         */
        function updateVariables() {
            var newVariables = {};

            lodash.forEach(ctrl.variables, function (variable) {
                lodash.set(newVariables, variable.name, variable.value);
            });

            lodash.set(ctrl.version, 'spec.env', newVariables);
        }
    }
}());
