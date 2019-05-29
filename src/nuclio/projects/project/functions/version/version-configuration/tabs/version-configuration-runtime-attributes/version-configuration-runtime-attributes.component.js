(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationRuntimeAttributes', {
            bindings: {
                version: '<',
                onChangeCallback: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-runtime-attributes/version-configuration-runtime-attributes.tpl.html',
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

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.inputValueCallback = inputValueCallback;
        ctrl.addNewAttribute = addNewAttribute;
        ctrl.handleAction = handleAction;
        ctrl.onChangeData = onChangeData;

        ctrl.runtimeAttributes = {};

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {

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
                            isFormValid: true,
                            name: 'attribute'
                        }
                    }
                })
                .value();
            ctrl.attributes = lodash.compact(ctrl.attributes);
        }

        /**
         * Post linking method
         */
        function postLink() {

            // Bind DOM-related preventDropdownCutOff method to component's controller
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.three-dot-menu');
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
            if (field === 'jvmOptions') {
                ctrl.runtimeAttributes.jvmOptions = newData;
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
            $timeout(function () {
                if (ctrl.attributes.length < 1 || lodash.last(ctrl.attributes).ui.isFormValid) {
                    ctrl.attributes.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'attribute'
                        }
                    });

                    $rootScope.$broadcast('change-state-deploy-button', {component: 'attribute', isDisabled: true});
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

            lodash.forEach(ctrl.attributes, function (attribute) {
                if (!attribute.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', {component: attribute.ui.name, isDisabled: true});
                }
                newAttributes[attribute.name] = attribute.value;
            });

            lodash.set(ctrl.version, 'spec.runtimeAttributes.responseHeaders', newAttributes);

            ctrl.onChangeCallback();
        }
    }
}());
