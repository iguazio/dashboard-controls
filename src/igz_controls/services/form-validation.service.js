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
        .factory('FormValidationService', FormValidationService);

    // Service with helpers methods for form validation needs
    function FormValidationService(lodash) {
        return {
            isShowFormInvalidState: isShowFormInvalidState,
            isShowFieldInvalidState: isShowFieldInvalidState,
            isShowFieldError: isShowFieldError,
            isFormValid: isFormValid,
            isFieldValid: isFieldValid,
            validateAllFields: validateAllFields
        };

        //
        // Public methods
        //

        /**
         * Check if the form is in an invalid state
         * @param {Object} form - form to check
         * @returns {boolean}
         */
        function isShowFormInvalidState(form) {
            return !form ? false : lodash.some(form, function (property) {
                return property.charAt(0) !== '$' && // skip AngularJS native properties
                    Object.prototype.hasOwnProperty.call(form[property], '$dirty') &&
                    Object.prototype.hasOwnProperty.call(form[property], '$invalid') &&
                    isShowFieldInvalidState(form, property);
            });
        }

        /**
         * Check if the field is in an invalid state
         * @param {Object} form - form which owns the field
         * @param {string} elementName - field name
         * @returns {boolean}
         */
        function isShowFieldInvalidState(form, elementName) {
            return (!form || !form[elementName]) ? false :
                (form.$submitted || form[elementName].$dirty) && form[elementName].$invalid;
        }

        /**
         * Check if the field has a specific error
         * @param {Object} form - form which owns the field
         * @param {string} elementName - field name
         * @param {string} errorName - error name
         * @returns {boolean}
         */
        function isShowFieldError(form, elementName, errorName) {
            return (!form || !form[elementName]) ? false : form[elementName].$error[errorName];
        }

        /**
         * Check if the form is valid
         * @param {Object} form - form to check
         * @returns {boolean}
         */
        function isFormValid(form) {
            return !form ? true : lodash.every(form, function (property) {
                return property.charAt(0) === '$' || // skip AngularJS native properties
                    !Object.prototype.hasOwnProperty.call(form[property], '$valid') ||
                    isFieldValid(form, property);
            });
        }

        /**
         * Check if the field of the form is valid
         * @param {Object} form - form which owns the field
         * @param {string} elementName - name of the field to check
         * @param {boolean} [validateOnSubmit=false] - if this parameter was passed, that means next -
         *     validate field only if form was submitted. Otherwise validates field all the time
         * @returns {boolean}
         */
        function isFieldValid(form, elementName, validateOnSubmit) {
            var formSubmitted = lodash.get(form, '$submitted', false);
            var elementValid = lodash.get(form, elementName + '.$valid', true);

            return (lodash.defaultTo(validateOnSubmit, false) && !formSubmitted) || elementValid;
        }

        /**
         * Validates all the fields of a form. Recursively validates fields in nested forms (both immediate and deep).
         * @param {Object} form - The form controller (`ngForm`).
         */
        function validateAllFields(form) {
            lodash.invokeMap(getFields(form), '$validate');
        }

        //
        // Private functions
        //

        /**
         * Returns a list of all controls (immediate and nested) of the provided control in case it is a form
         * (`ngForm`), or the control itself in case it is a field (`ngModel`).
         * @param {Object} control - The form controller (`ngForm`) or the model controller (`ngModel`).
         * @returns {Array.<Object>} An array of model controllers (`ngModel`) of all the fields of `control` in case it
         *     is a form, or an array with `control` only in case it is a field.
         */
        function getFields(control) {
            var controls =
                lodash.hasIn(control, '$getControls') ? lodash.map(control.$getControls(), getFields) : [control];
            return lodash.flattenDeep(controls);
        }
    }
}());
