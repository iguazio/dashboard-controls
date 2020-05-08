(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationAnnotations', {
            bindings: {
                version: '<',
                onChangeCallback: '<'
            },
            templateUrl: 'nuclio/functions/version/version-configuration/tabs/version-configuration-annotations/version-configuration-annotations.tpl.html',
            controller: NclVersionConfigurationAnnotationsController
        });

    function NclVersionConfigurationAnnotationsController($element, $i18next, $rootScope, $timeout, i18next, lodash,
                                                          FormValidationService, PreventDropdownCutOffService,
                                                          ValidationService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.annotationsForm = null;
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
        ctrl.tooltip = '<a class="link" target="_blank" ' +
            'href="https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/">' +
            $i18next.t('functions:TOOLTIP.ANNOTATIONS.HEAD', {lng: lng}) + '</a> ' +
            $i18next.t('functions:TOOLTIP.ANNOTATIONS.REST', {lng: lng});

        ctrl.keyTooltip = $i18next.t('functions:TOOLTIP.PREFIXED_NAME', {
            lng: lng,
            name: $i18next.t('functions:TOOLTIP.ANNOTATION', {lng: lng})
        });
        ctrl.validationRules = {
            key: ValidationService.getValidationRules('k8s.prefixedQualifiedName')
                .concat([
                    {
                        name: 'uniqueness',
                        label: $i18next.t('functions:UNIQUENESS', {lng: lng}),
                        pattern: validateUniqueness
                    }
                ])
        };

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.addNewAnnotation = addNewAnnotation;
        ctrl.handleAction = handleAction;
        ctrl.onChangeData = onChangeData;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            var annotations =  lodash.get(ctrl.version, 'metadata.annotations', []);

            ctrl.annotations = lodash.map(annotations, function (value, key) {
                return {
                    name: key,
                    value: value,
                    ui: {
                        editModeActive: false,
                        isFormValid: false,
                        name: 'annotation'
                    }
                };
            });

            $timeout(function () {
                if (ctrl.annotationsForm.$invalid) {
                    ctrl.annotationsForm.$setSubmitted();
                    $rootScope.$broadcast('change-state-deploy-button', {component: 'annotation', isDisabled: true});
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
         * Adds new annotation
         */
        function addNewAnnotation(event) {
            $timeout(function () {
                if (ctrl.annotations.length < 1 || lodash.last(ctrl.annotations).ui.isFormValid) {
                    ctrl.annotations.push({
                        name: '',
                        value: '',
                        ui: {
                            editModeActive: true,
                            isFormValid: false,
                            name: 'annotation'
                        }
                    });

                    $rootScope.$broadcast('change-state-deploy-button', {
                        component: 'annotation',
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
                ctrl.annotations.splice(index, 1);

                $timeout(function () {
                    updateAnnotations();
                });
            }
        }

        /**
         * Changes annotations data
         * @param {Object} label
         * @param {number} index
         */
        function onChangeData(label, index) {
            ctrl.annotations[index] = lodash.cloneDeep(label);

            updateAnnotations();
        }

        //
        // Private methods
        //

        /**
         * Updates function`s annotations
         */
        function updateAnnotations() {
            var isFormValid = true;
            var newAnnotations = {};

            lodash.forEach(ctrl.annotations, function (annotation) {
                if (!annotation.ui.isFormValid) {
                    isFormValid = false
                }

                newAnnotations[annotation.name] = annotation.value;
            });

            // since uniqueness validation rule of some fields is dependent on the entire annotation list, then whenever
            // the list is modified - the rest of the annotations need to be re-validated
            FormValidationService.validateAllFields(ctrl.annotationsForm);

            $rootScope.$broadcast('change-state-deploy-button', {
                component: 'annotation',
                isDisabled: !isFormValid
            });

            lodash.set(ctrl.version, 'metadata.annotations', newAnnotations);
            ctrl.onChangeCallback();
        }

        /**
         * Determines `uniqueness` validation for `Key` field
         * @param {string} value - value to validate
         */
        function validateUniqueness(value) {
            return lodash.filter(ctrl.annotations, ['name', value]).length === 1;
        }
    }
}());
