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
        .component('nclVersionConfigurationLabels', {
            bindings: {
                version: '<',
                onChangeCallback: '<',
                isFunctionDeploying: '&'
            },
            templateUrl: 'nuclio/functions/version/version-configuration/tabs/version-configuration-labels/version-configuration-labels.tpl.html',
            controller: NclVersionConfigurationLabelsController
        });

    function NclVersionConfigurationLabelsController($element, $i18next, $rootScope, $timeout, i18next, lodash,
                                                     FormValidationService, FunctionsService,
                                                     PreventDropdownCutOffService, ValidationService,
                                                     VersionHelperService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.igzScrollConfig = {
            maxElementsCount: 10,
            childrenSelector: '.table-body'
        };
        ctrl.isKubePlatform = false;
        ctrl.labelsForm = null;
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.tooltip = '<a class="link" target="_blank" ' +
            'href="https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/">' +
            $i18next.t('functions:TOOLTIP.LABELS.HEAD', { lng: lng }) + '</a> ' +
            $i18next.t('functions:TOOLTIP.LABELS.REST', { lng: lng });

        ctrl.keyTooltip = $i18next.t('functions:TOOLTIP.PREFIXED_NAME', {
            lng: lng,
            name: $i18next.t('common:LABEL', { lng: lng })
        });
        ctrl.validationRules = {
            key: ValidationService.getValidationRules('function.label.key', [
                {
                    name: 'uniqueness',
                    label: $i18next.t('functions:UNIQUENESS', { lng: lng }),
                    pattern: validateUniqueness
                }
            ]),
            value: ValidationService.getValidationRules('k8s.qualifiedName')
        };

        ctrl.$postLink = postLink;
        ctrl.$onChanges = onChanges;

        ctrl.addNewLabel = addNewLabel;
        ctrl.handleAction = handleAction;
        ctrl.isLabelsDisabled = isLabelsDisabled;
        ctrl.onChangeData = onChangeData;

        //
        // Hook methods
        //

        /**
         * Post linking method
         */
        function postLink() {
            ctrl.isKubePlatform = FunctionsService.isKubePlatform();


            // Bind DOM-related preventDropdownCutOff method to component's controller
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.three-dot-menu');
        }

        /**
         * On changes hook method.
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (lodash.has(changes, 'version')) {
                ctrl.labels = lodash.chain(ctrl.version)
                    .get('metadata.labels', {})
                    .omitBy(function (value, key) {
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
                        };
                    })
                    .value();
                ctrl.labels = lodash.compact(ctrl.labels);
                ctrl.addNewLabelTooltip = VersionHelperService.isVersionDeployed(ctrl.version) ?
                    $i18next.t('functions:TOOLTIP.ADD_LABELS', { lng: lng }) : '';

                $timeout(function () {
                    if (ctrl.labelsForm.$invalid) {
                        ctrl.labelsForm.$setSubmitted();
                        $rootScope.$broadcast('change-state-deploy-button', { component: 'label', isDisabled: true });
                    }
                });
            }
        }

        //
        // Public methods
        //

        /**
         * Adds new label
         */
        function addNewLabel(event) {
            // prevent adding labels for deployed functions
            if (ctrl.isLabelsDisabled() || ctrl.isFunctionDeploying()) {
                return;
            }

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

                    $rootScope.$broadcast('change-state-deploy-button', { component: 'label', isDisabled: true });
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

                $timeout(function () {
                    updateLabels();
                });
            }
        }

        /**
         * Checks if labels should be disabled
         * @returns {boolean}
         */
        function isLabelsDisabled() {
            return ctrl.isKubePlatform && VersionHelperService.isVersionDeployed(ctrl.version);
        }

        /**
         * Changes labels data
         * @param {Object} label
         * @param {number} index
         */
        function onChangeData(label, index) {
            ctrl.labels[index] = lodash.cloneDeep(label);

            updateLabels();
        }

        //
        // Private methods
        //

        /**
         * Updates function`s labels
         */
        function updateLabels() {
            var isFormValid = true;
            var newLabels = {};

            lodash.forEach(ctrl.labels, function (label) {
                if (!label.ui.isFormValid) {
                    isFormValid = false;
                }

                newLabels[label.name] = label.value;
            });

            // since uniqueness validation rule of some fields is dependent on the entire label list, then whenever
            // the list is modified - the rest of the labels need to be re-validated
            FormValidationService.validateAllFields(ctrl.labelsForm);

            $rootScope.$broadcast('change-state-deploy-button', {
                component: 'label',
                isDisabled: !isFormValid
            });

            lodash.set(ctrl.version, 'metadata.labels', newLabels);
            ctrl.onChangeCallback();
        }

        /**
         * Determines `uniqueness` validation for `Key` field
         * @param {string} value - value to validate
         */
        function validateUniqueness(value) {
            return lodash.filter(ctrl.labels, ['name', value]).length === 1;
        }
    }
}());
