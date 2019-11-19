(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationAnnotations', {
            bindings: {
                version: '<',
                onChangeCallback: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-annotations/version-configuration-annotations.tpl.html',
            controller: NclVersionConfigurationAnnotationsController
        });

    function NclVersionConfigurationAnnotationsController($element, $rootScope, $timeout, $i18next, i18next, lodash,
                                                          PreventDropdownCutOffService, ValidatingPatternsService,
                                                          VersionHelperService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.igzScrollConfig = {
            maxElementsCount: 10,
            childrenSelector: '.table-body'
        };
        ctrl.keyValidationPattern = ValidatingPatternsService.k8s.prefixedQualifiedName;
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

        ctrl.keyTooltip = getKeyTooltip();

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
                    validateUniqueness();
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
            ctrl.annotations[index] = label;

            validateUniqueness();
            updateAnnotations();
        }

        //
        // Private methods
        //

        /**
         * Generates tooltip for "Key" label
         */
        function getKeyTooltip() {
            var config = [
                {
                    head: $i18next.t('functions:TOOLTIP.CONFIGURATION.ANNOTATIONS_KEY', {lng: lng})
                },
                {
                    head: $i18next.t('functions:TOOLTIP.CONFIGURATION.NAME_RESTRICTIONS', {lng: lng}),
                    values: [
                        {
                            head: $i18next.t('functions:TOOLTIP.CONFIGURATION.VALID_CHARACTERS', {lng: lng}) + ' —',
                            values: [
                                {head: $i18next.t('functions:TOOLTIP.CONFIGURATION.ALPHANUMERIC_CHARACTERS', {lng: lng}) + ' (a–z, A–Z, 0–9)'},
                                {head: $i18next.t('functions:TOOLTIP.CONFIGURATION.HYPHENS', {lng: lng}) + ' (-)'},
                                {head: $i18next.t('functions:TOOLTIP.CONFIGURATION.UNDERSCORES', {lng: lng}) + ' (_)'},
                                {head: $i18next.t('functions:TOOLTIP.CONFIGURATION.PERIODS', {lng: lng}) + ' (.)'}
                            ]
                        },
                        {
                            head: $i18next.t('functions:TOOLTIP.CONFIGURATION.BEGIN_END_WITH_ALPHANUMERIC', {lng: lng})
                        },
                        {
                            head: $i18next.t('functions:TOOLTIP.CONFIGURATION.MAX_LENGTH', {lng: lng, count: 63})
                        }
                    ]
                },
                {
                    head: $i18next.t('functions:TOOLTIP.CONFIGURATION.PREFIX_RESTRICTIONS', {lng: lng}),
                    values: [
                        {
                            head: $i18next.t('functions:TOOLTIP.CONFIGURATION.VALID_CHARACTERS', {lng: lng}) + ' —',
                            values: [
                                {head: $i18next.t('functions:TOOLTIP.CONFIGURATION.LOWERCASE_ALPHANUMERIC', {lng: lng}) + ' (a–z, 0–9)'},
                                {head: $i18next.t('functions:TOOLTIP.CONFIGURATION.HYPHENS', {lng: lng}) + ' (-)'},
                                {head: $i18next.t('functions:TOOLTIP.CONFIGURATION.PERIODS', {lng: lng}) + ' (.)'}
                            ]
                        },
                        {
                            head: $i18next.t('functions:TOOLTIP.CONFIGURATION.BEGIN_END_WITH_LOWERCASE_ALPHANUMERIC', {lng: lng}) + ' (a–z, 0–9)'
                        },
                        {
                            head: $i18next.t('functions:TOOLTIP.CONFIGURATION.MAX_LENGTH', {lng: lng, count: 253})
                        }
                    ]
                },
                {
                    head: $i18next.t('functions:TOOLTIP.CONFIGURATION.EXAMPLES', {lng: lng}),
                    values: [
                        {head: '"MyName"'},
                        {head: '"sub-domain.example.com/MyName"'},
                        {head: '"my.name_123"'},
                        {head: '"123-abc"'}
                    ]
                }
            ];

            return VersionHelperService.generateTooltip(config);
        }

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

            $rootScope.$broadcast('change-state-deploy-button', {
                component: 'annotation',
                isDisabled: !isFormValid
            });

            lodash.set(ctrl.version, 'metadata.annotations', newAnnotations);
            ctrl.onChangeCallback();
        }

        /**
         * Determines and sets `uniqueness` validation for `Key` field
         */
        function validateUniqueness() {
            var uniqueKeys = lodash.xorBy.apply(null, lodash.chunk(ctrl.annotations).concat('name'));

            lodash.forEach(ctrl.annotations, function (annotation, key) {
                ctrl.annotationsForm.$$controls[key].key.$setValidity('uniqueness',
                    lodash.includes(uniqueKeys, annotation)
                );

                annotation.ui.isFormValid = ctrl.annotationsForm.$$controls[key].$valid;
            });

            if (lodash.every(ctrl.annotations, 'ui.isFormValid')) {
                $rootScope.$broadcast('change-state-deploy-button', {
                    component: 'annotation',
                    isDisabled: false
                });
            }
        }
    }
}());
