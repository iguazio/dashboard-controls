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
