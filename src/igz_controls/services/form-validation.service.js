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
         * @param {Object} control - The form controller (`ngForm`) or the model controller (`ngForm`).
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
