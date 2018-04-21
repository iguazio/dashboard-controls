(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationAnnotations', {
            bindings: {
                version: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-annotations/version-configuration-annotations.tpl.html',
            controller: NclVersionConfigurationAnnotationsController
        });

    function NclVersionConfigurationAnnotationsController($element, $stateParams, lodash, PreventDropdownCutOffService) {
        var ctrl = this;

        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.addNewAnnotation = addNewAnnotation;
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
            if (lodash.isNil(ctrl.version) && !lodash.isEmpty($stateParams.functionData)) {
                ctrl.version = $stateParams.functionData;
            }

            var annotations =  lodash.get(ctrl.version, 'metadata.annotations', []);

            ctrl.annotations = lodash.map(annotations, function (value, key) {
                return {
                    name: key,
                    value: value,
                    ui: {
                        editModeActive: false,
                        isFormValid: false
                    }
                };
            });
        }

        /**
         * Linking method
         */
        function postLink() {

            // Bind DOM-related preventDropdownCutOff method to component's controller
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.three-dot-menu');
        }

        //
        // Public methods
        //

        /**
         * Adds new annotation
         */
        function addNewAnnotation(event) {
            if (ctrl.annotations.length < 1 || lodash.last(ctrl.annotations).ui.isFormValid) {
                ctrl.annotations.push({
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
         * @param {number} index - index of label in array
         */
        function handleAction(actionType, index) {
            if (actionType === 'delete') {
                ctrl.annotations.splice(index, 1);

                updateAnnotations();
            }
        }

        /**
         * Changes annotations data
         * @param {Object} label
         * @param {number} index
         */
        function onChangeData(label, index) {
            ctrl.annotations[index] = label;

            updateAnnotations();
        }

        /**
         * Returns true if scrollbar is necessary
         * @return {boolean}
         */
        function isScrollNeeded() {
            return ctrl.annotations.length > 10;
        }

        //
        // Private methods
        //

        /**
         * Updates function`s labels
         */
        function updateAnnotations() {
            var newAnnotations = {};

            lodash.forEach(ctrl.annotations, function (annotation) {
                lodash.set(newAnnotations, annotation.name, annotation.value);
            });

            lodash.set(ctrl.version, 'metadata.annotations', newAnnotations);
        }
    }
}());
