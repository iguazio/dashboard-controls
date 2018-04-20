(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationLabels', {
            bindings: {
                version: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-labels/version-configuration-labels.tpl.html',
            controller: NclVersionConfigurationLabelsController
        });

    function NclVersionConfigurationLabelsController($element, $timeout, lodash, PreventDropdownCutOffService) {
        var ctrl = this;

        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.addNewLabel = addNewLabel;
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
            var labels =  lodash.get(ctrl.version, 'metadata.labels', []);

            ctrl.labels = lodash.map(labels, function (value, key) {
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
         * Adds new label
         */
        function addNewLabel(event) {
            if (ctrl.labels.length < 1 || lodash.last(ctrl.labels).ui.isFormValid) {
                ctrl.labels.push({
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
                ctrl.labels.splice(index, 1);

                updateLabels();
            }
        }

        /**
         * Changes labels data
         * @param {Object} label
         * @param {number} index
         */
        function onChangeData(label, index) {
            ctrl.labels[index] = label;

            updateLabels();
        }

        /**
         * Returns true if scrollbar is necessary
         * @return {boolean}
         */
        function isScrollNeeded() {
            return ctrl.labels.length > 10;
        }

        //
        // Private methods
        //

        /**
         * Updates function`s labels
         */
        function updateLabels() {
            var newLabels = {};

            lodash.forEach(ctrl.labels, function (label) {
                lodash.set(newLabels, label.name, label.value);
            });

            lodash.set(ctrl.version, 'metadata.labels', newLabels);
        }
    }
}());
