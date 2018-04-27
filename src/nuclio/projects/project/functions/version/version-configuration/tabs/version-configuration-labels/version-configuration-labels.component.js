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

    function NclVersionConfigurationLabelsController($element, $rootScope, $timeout, lodash, PreventDropdownCutOffService) {
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
            var labels = lodash.get(ctrl.version, 'metadata.labels', []);

            ctrl.labels = lodash.chain(labels)
                .reject(function (value, key) {
                    return lodash.startsWith(key, 'nuclio.io/');
                })
                .map(function (value, key) {
                    return {
                        name: key,
                        value: value,
                        ui: {
                            editModeActive: false,
                            isFormValid: false,
                            name: 'label'
                        }
                    }
                })
                .value();
            ctrl.labels = lodash.compact(ctrl.labels);
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
            $timeout(function () {
                if (ctrl.labels.length < 1 || lodash.last(ctrl.labels).ui.isFormValid) {
                    ctrl.labels.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'label'
                        }
                    });
                    event.stopPropagation();
                }
            }, 50);
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
            var labels = lodash.get(ctrl.version, 'metadata.labels', []);

            var nuclioLabels = lodash.pickBy(labels, function (value, key) {
                return lodash.includes(key, 'nuclio.io/');
            });

            var newLabels = {};
            lodash.forEach(ctrl.labels, function (label) {
                if (!label.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', {component: label.ui.name, isDisabled: true});
                }
                newLabels[label.name] = label.value;
            });
            newLabels = lodash.merge(newLabels, nuclioLabels);

            lodash.set(ctrl.version, 'metadata.labels', newLabels);
        }
    }
}());
