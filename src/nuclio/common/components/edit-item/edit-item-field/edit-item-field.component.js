(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclEditItemField', {
            bindings: {
                editItemForm: '<',
                field: '<',
                item: '<',
                validationRules: '<',
                inputValueCallback: '&',
                numberInputCallback: '&',
                onSelectDropdownValue: '&',
                readOnly: '<?'
            },
            templateUrl: 'nuclio/common/components/edit-item/edit-item-field/edit-item-field.tpl.html',
            controller: NclEditItemFieldController
        });

    function NclEditItemFieldController($i18next, i18next, lodash, ValidationService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.fieldTypeValidationRules = {
            arrayInt: ValidationService.getValidationRules('function.arrayInt')
        };

        ctrl.convertFromCamelCase = convertFromCamelCase;
        ctrl.getFieldPlaceholderText = getFieldPlaceholderText;
        ctrl.getFieldValue = getFieldValue;

        //
        // Public methods
        //

        /**
         * Converts field names in class list from camel case.
         * @param {string} str - The string to convert.
         * @returns {string}
         */
        function convertFromCamelCase(str) {
            return lodash.upperFirst(lodash.lowerCase(str));
        }

        /**
         * Return placeholder text for a field.
         * @returns {string} the placeholder text for the field.
         */
        function getFieldPlaceholderText() {
            var fieldName = lodash.defaultTo(ctrl.field.label, ctrl.convertFromCamelCase(ctrl.field.name).toLowerCase());
            var defaultPlaceholder = ctrl.field.type === 'dropdown' ?
                $i18next.t('common:PLACEHOLDER.SELECT', { lng: lng }) :
                $i18next.t('common:PLACEHOLDER.ENTER_GENERIC', { lng: lng, fieldName: fieldName });

            return lodash.defaultTo(ctrl.field.placeholder, defaultPlaceholder);
        }

        /**
         * Returns the value of a field.
         * @returns {*} the value of the field.
         */
        function getFieldValue() {
            return lodash.get(ctrl.item, lodash.defaultTo(ctrl.field.path, ctrl.field.name));
        }
    }
}());
