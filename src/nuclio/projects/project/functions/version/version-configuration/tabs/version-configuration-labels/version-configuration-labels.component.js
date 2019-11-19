(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationLabels', {
            bindings: {
                version: '<',
                onChangeCallback: '<'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-labels/version-configuration-labels.tpl.html',
            controller: NclVersionConfigurationLabelsController
        });

    function NclVersionConfigurationLabelsController($element, $rootScope, $timeout, $i18next, i18next, lodash,
                                                     PreventDropdownCutOffService, ValidatingPatternsService,
                                                     VersionHelperService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.igzScrollConfig = {
            maxElementsCount: 10,
            childrenSelector: '.table-body'
        };
        ctrl.keyValidationPattern = ValidatingPatternsService.k8s.prefixedQualifiedName;
        ctrl.valueValidationPattern = ValidatingPatternsService.k8s.qualifiedName;
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.tooltip = '<a class="link" target="_blank" ' +
            'href="https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/">' +
            $i18next.t('functions:TOOLTIP.LABELS.HEAD', {lng: lng}) + '</a> ' +
            $i18next.t('functions:TOOLTIP.LABELS.REST', {lng: lng});

        ctrl.keyTooltip = getKeyTooltip();
        ctrl.valueTooltip = getValueTooltip();

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.isVersionDeployed = VersionHelperService.isVersionDeployed;

        ctrl.addNewLabel = addNewLabel;
        ctrl.handleAction = handleAction;
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
                    }
                })
                .value();
            ctrl.labels = lodash.compact(ctrl.labels);

            $timeout(function () {
                if (ctrl.labelsForm.$invalid) {
                    ctrl.labelsForm.$setSubmitted();
                    $rootScope.$broadcast('change-state-deploy-button', {component: 'label', isDisabled: true});
                }
            })
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
            // prevent adding labels for deployed functions
            if (ctrl.isVersionDeployed(ctrl.version)) {
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

                    $rootScope.$broadcast('change-state-deploy-button', {component: 'label', isDisabled: true});
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
                    validateUniqueness();
                    updateLabels();
                });
            }
        }

        /**
         * Changes labels data
         * @param {Object} label
         * @param {number} index
         */
        function onChangeData(label, index) {
            ctrl.labels[index] = label;

            validateUniqueness();
            updateLabels();
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
                    head: $i18next.t('functions:TOOLTIP.CONFIGURATION.LABEL_KEY', {lng: lng})
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
         * Generates tooltip for "Key" label
         */
        function getValueTooltip() {
            var config = [
                {
                    head: $i18next.t('functions:TOOLTIP.CONFIGURATION.RESTRICTIONS', {lng: lng}),
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
                    head: $i18next.t('functions:TOOLTIP.CONFIGURATION.EXAMPLES', {lng: lng}),
                    values: [
                        {head: '"MyValue"'},
                        {head: '"my_value.1"'},
                        {head: '"12345"'}
                    ]
                }
            ];

            return VersionHelperService.generateTooltip(config);
        }

        /**
         * Updates function`s labels
         */
        function updateLabels() {
            var isFormValid = true;
            var labels = lodash.get(ctrl.version, 'metadata.labels', []);
            var nuclioLabels = lodash.pickBy(labels, function (value, key) {
                return lodash.includes(key, 'nuclio.io/');
            });
            var newLabels = {};

            lodash.forEach(ctrl.labels, function (label) {
                if (!label.ui.isFormValid) {
                    isFormValid = false;
                }

                newLabels[label.name] = label.value;
            });

            $rootScope.$broadcast('change-state-deploy-button', {
                component: 'label',
                isDisabled: !isFormValid
            });

            newLabels = lodash.merge(newLabels, nuclioLabels);

            lodash.set(ctrl.version, 'metadata.labels', newLabels);
            ctrl.onChangeCallback();
        }

        /**
         * Determines and sets `uniqueness` validation for `Key` field
         */
        function validateUniqueness() {
            var uniqueKeys = lodash.xorBy.apply(null, lodash.chunk(ctrl.labels).concat('name'));

            lodash.forEach(ctrl.labels, function (label, key) {
                ctrl.labelsForm.$$controls[key].key.$setValidity('uniqueness',
                    lodash.includes(uniqueKeys, label)
                );

                label.ui.isFormValid = ctrl.labelsForm.$$controls[key].$valid;
            });

            if (lodash.every(ctrl.labels, 'ui.isFormValid')) {
                $rootScope.$broadcast('change-state-deploy-button', {
                    component: 'label',
                    isDisabled: false
                });
            }
        }
    }
}());
