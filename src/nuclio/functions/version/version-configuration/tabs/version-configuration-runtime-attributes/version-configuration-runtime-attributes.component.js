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
        .component('nclVersionConfigurationRuntimeAttributes', {
            bindings: {
                version: '<',
                onChangeCallback: '<',
                isFunctionDeploying: '&'
            },
            templateUrl: 'nuclio/functions/version/version-configuration/tabs/version-configuration-runtime-attributes/version-configuration-runtime-attributes.tpl.html',
            controller: NclVersionConfigurationRuntimeAttributesController
        });

    function NclVersionConfigurationRuntimeAttributesController($element, $rootScope, $timeout, lodash,
                                                                PreventDropdownCutOffService) {
        var ctrl = this;

        ctrl.igzScrollConfig = {
            maxElementsCount: 10,
            childrenSelector: '.table-body'
        };
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };

        ctrl.$postLink = postLink;
        ctrl.$onChanges = onChanges;

        ctrl.inputValueCallback = inputValueCallback;
        ctrl.addNewAttribute = addNewAttribute;
        ctrl.handleAction = handleAction;
        ctrl.onChangeData = onChangeData;

        ctrl.runtimeAttributes = {};

        //
        // Hook method
        //

        /**
         * Post linking method
         */
        function postLink() {

            // Bind DOM-related preventDropdownCutOff method to component's controller
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.three-dot-menu');
        }

        /**
         * On changes hook method.
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.version)) {

                // Set attributes from ctrl.version to local ctrl.runtimeAttributes.
                // The attributes stored in arrays are converted to a string by using `join('\n')` method
                lodash.assign(ctrl.runtimeAttributes, {
                    jvmOptions: lodash.get(ctrl.version, 'spec.runtimeAttributes.jvmOptions', []).join('\n'),
                    arguments: lodash.get(ctrl.version, 'spec.runtimeAttributes.arguments', '')
                });

                // Set attributes stored in key-value inputs
                var attributes = lodash.get(ctrl.version, 'spec.runtimeAttributes.responseHeaders', []);
                ctrl.attributes = lodash.chain(attributes)
                    .map(function (value, key) {
                        return {
                            name: key,
                            value: value,
                            ui: {
                                editModeActive: false,
                                isFormValid: false,
                                name: 'runtime-attribute'
                            }
                        };
                    })
                    .value();
                ctrl.attributes = lodash.compact(ctrl.attributes);
            }
        }

        //
        // Public method
        //

        /**
         * Update spec.runtimeAttributes value
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            lodash.set(ctrl.runtimeAttributes, field, newData);

            if (field === 'jvmOptions') {
                lodash.set(ctrl.version, 'spec.runtimeAttributes.jvmOptions', newData.replace(/\r/g, '\n').split(/\n+/));
            } else {
                lodash.set(ctrl.version, 'spec.runtimeAttributes.' + field, newData);
            }

            ctrl.onChangeCallback();
        }

        /**
         * Adds new Attribute
         */
        function addNewAttribute(event) {
            if (ctrl.isFunctionDeploying()) {
                return;
            }

            $timeout(function () {
                if (ctrl.attributes.length < 1 || lodash.last(ctrl.attributes).ui.isFormValid) {
                    ctrl.attributes.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'runtime-attribute'
                        }
                    });

                    $rootScope.$broadcast('change-state-deploy-button', {
                        component: 'runtime-attribute',
                        isDisabled: true
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
                ctrl.attributes.splice(index, 1);

                updateAttributes();
            }
        }

        /**
         * Changes labels data
         * @param {Object} attribute
         * @param {number} index
         */
        function onChangeData(attribute, index) {
            ctrl.attributes[index] = attribute;

            updateAttributes();
        }

        //
        // Private methods
        //

        /**
         * Updates function`s labels
         */
        function updateAttributes() {
            var newAttributes = {};
            var isFormValid = true;

            lodash.forEach(ctrl.attributes, function (attribute) {
                if (!attribute.ui.isFormValid) {
                    isFormValid = false;
                }

                newAttributes[attribute.name] = attribute.value;
            });

            $rootScope.$broadcast('change-state-deploy-button', {
                component: 'runtime-attribute',
                isDisabled: !isFormValid
            });

            lodash.set(ctrl.version, 'spec.runtimeAttributes.responseHeaders', newAttributes);

            ctrl.onChangeCallback();
        }
    }
}());
