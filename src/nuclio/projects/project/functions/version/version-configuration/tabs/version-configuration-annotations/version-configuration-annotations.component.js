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
            key: [
                {
                    name: 'nameValidCharacters',
                    label: '[' + $i18next.t('common:NAME', {lng: lng}) + '] ' + $i18next.t('functions:VALIDATION.VALID_CHARACTERS', {lng: lng}) + ': a–z, A–Z, 0–9, -, _, .',
                    pattern: /^([^\/]*\/)?[\w-.]+$/
                },
                {
                    name: 'nameBeginEnd',
                    label: '[' + $i18next.t('common:NAME', {lng: lng}) + '] ' + $i18next.t('functions:VALIDATION.BEGIN_END_WITH_ALPHANUMERIC', {lng: lng}),
                    pattern: function (value) {
                        var valueToCheck = value;
                        var slashIndex = value.search('/');

                        if (slashIndex > -1) {
                            valueToCheck = value.substr(slashIndex + 1);
                        }

                        return /^([a-zA-Z0-9].*)?[a-zA-Z0-9]$/.test(valueToCheck);
                    }
                },
                {
                    name: 'nameMaxLength',
                    label: '[' + $i18next.t('common:NAME', {lng: lng}) + '] ' + $i18next.t('functions:VALIDATION.MAX_LENGTH', {lng: lng, count: 63}),
                    pattern: /^([^\/]*\/)?[\S\s]{1,63}$/
                },
                {
                    name: 'prefixValidCharacters',
                    label: '[' + $i18next.t('function:PREFIX', {lng: lng}) + '] ' + $i18next.t('functions:VALIDATION.VALID_CHARACTERS', {lng: lng}) + ': a–z, 0–9, -, .',
                    pattern: /(^[a-z0-9.-]+\/|^((?!\/).)*$)/
                },
                {
                    name: 'prefixBeginEnd',
                    label: '[' + $i18next.t('function:PREFIX', {lng: lng}) + '] ' + $i18next.t('functions:VALIDATION.BEGIN_END_WITH_LOWERCASE_ALPHANUMERIC', {lng: lng}),
                    pattern: /(^[a-z0-9](.*[a-z0-9])*\/|^((?!\/).)*$)/
                },
                {
                    name: 'prefixMaxLength',
                    label: '[' + $i18next.t('function:PREFIX', {lng: lng}) + '] ' + $i18next.t('functions:VALIDATION.MAX_LENGTH', {lng: lng, count: 253}),
                    pattern: /(?=^[\S\s]{1,253}\/|^((?!\/).)*$)/
                },
                {
                    name: 'uniqueness',
                    label: $i18next.t('functions:VALIDATION.UNIQUENESS', {lng: lng}),
                    pattern: validateUniqueness
                }
            ]
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

            $rootScope.$broadcast('change-state-deploy-button', {
                component: 'annotation',
                isDisabled: !isFormValid
            });

            lodash.set(ctrl.version, 'metadata.annotations', newAnnotations);
            ctrl.onChangeCallback();
        }

        /**
         * Determines `uniqueness` validation for `Key` field
         * @param {string} value
         * @param {boolean} isInitCheck
         */
        function validateUniqueness(value, isInitCheck) {
            var expectedLength = lodash.defaultTo(isInitCheck, false) ? 1 : 0;

            return lodash.filter(ctrl.annotations, ['name', value]).length === expectedLength;
        }
    }
}());
