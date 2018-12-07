(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclFunctionFromTemplateDialog', {
            bindings: {
                closeDialog: '&',
                template: '<'
            },
            templateUrl: 'nuclio/common/screens/create-function/function-from-template/function-from-template-dialog/function-from-template-dialog.tpl.html',
            controller: NclFunctionFromTemplateDialogController
        });

    function NclFunctionFromTemplateDialogController(lodash, EventHelperService) {
        var ctrl = this;

        var templateData = {};

        ctrl.dropdownOptions = {};

        ctrl.$onInit = onInit;

        ctrl.onApply = onApply;
        ctrl.onClose = onClose;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.isFormFilled = isFormFilled;
        ctrl.dropdownCallback = dropdownCallback;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.forIn(ctrl.template.values, function (value, key) {
                var defaultValue = lodash.get(value, 'attributes.defaultValue', value.kind === 'number' ? 0 : '');

                lodash.set(templateData, key, defaultValue);

                if (value.kind === 'choice') {
                    lodash.set(ctrl.dropdownOptions, key + '.options', prepareDropdownValue(lodash.get(value, 'attributes.choices')));
                    lodash.set(ctrl.dropdownOptions, key + '.defaultValue', prepareDropdownValue(defaultValue));
                }
            });
        }

        //
        // Public methods
        //

        /**
         * Closes dialog
         * @param {Event} [event]
         */
        function onClose(event) {
            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && !ctrl.isLoadingState) {
                ctrl.closeDialog();
            }
        }

        /**
         * Closes dialog and pass the dialog data
         * @param {Event} [event]
         */
        function onApply(event) {
            if ((angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) && !ctrl.isLoadingState) {
                ctrl.closeDialog({template: templateData});
            }
        }

        /**
         * Checks if form valid
         */
        function isFormFilled() {
            return lodash.isEmpty(ctrl.templateForm.$error);
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(templateData, field, newData);
        }

        /**
         * Sets new selected value from dropdown
         * @param {Object} newData
         * @param {boolean} isChanged
         * @param {string} field
         */
        function dropdownCallback(newData, isChanged, field) {
            if (isChanged) {
                lodash.set(templateData, field, newData.id);
            }
        }

        //
        // Private methods
        //

        /**
         * Converts values for drop-down.
         */
        function prepareDropdownValue(value) {
            if (lodash.isArray(value)) {
                return lodash.map(value, function (option) {
                    return {
                        id: option,
                        name: option
                    };
                });
            } else if (lodash.isString(value)) {
                return {
                    id: value,
                    name: value
                }
            }
        }
    }
}());
