(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzElasticInputField', {
            bindings: {
                inputName: '@',
                formObject: '<',
                model: '<',
                modelOptions: '<',
                maxLength: '<',
                minLength: '<',
                pattern: '<',
                placeholder: '@?',
                required: '<',
                trim: '@',
                onChange: '&?',
                readOnly: '<?'
            },
            templateUrl: 'igz_controls/components/elastic-input-field/elastic-input-field.tpl.html',
            controller: IgzElasticInputFieldController
        });

    function IgzElasticInputFieldController(lodash, FormValidationService) {
        var ctrl = this;

        ctrl.$onInit = onInit;
        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;
        ctrl.onDataChange = onDataChange;

        //
        // Hook method
        //
        function onInit() {
            ctrl.readOnly = lodash.defaultTo(ctrl.readOnly, false);
        }

        //
        // Public method
        //

        /**
         * Calls onDataChange method if it was set
         */
        function onDataChange() {
            if (angular.isFunction(ctrl.onChange)) {
                ctrl.onChange({ item: ctrl.model });
            }
        }
    }
}());

