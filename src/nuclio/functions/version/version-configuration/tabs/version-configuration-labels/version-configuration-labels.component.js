(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationLabels', {
            bindings: {
                version: '<',
                onChangeCallback: '<'
            },
            templateUrl: 'nuclio/functions/version/version-configuration/tabs/version-configuration-labels/version-configuration-labels.tpl.html',
            controller: NclVersionConfigurationLabelsController
        });

    function NclVersionConfigurationLabelsController($element, $i18next, $rootScope, $timeout, i18next, lodash,
                                                     PreventDropdownCutOffService, VersionHelperService) {
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
            'href="https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/">' +
            $i18next.t('functions:TOOLTIP.LABELS.HEAD', {lng: lng}) + '</a> ' +
            $i18next.t('functions:TOOLTIP.LABELS.REST', {lng: lng});

        ctrl.keyTooltip = $i18next.t('functions:TOOLTIP.PREFIXED_NAME', {
            lng: lng,
            name: $i18next.t('common:LABEL', {lng: lng})
        });
        ctrl.validationRules = {
            key: [
                {
                    name: 'nameValidCharacters',
                    label: '[' + $i18next.t('common:NAME', {lng: lng}) + '] ' + $i18next.t('common:VALID_CHARACTERS', {lng: lng}) + ': a–z, A–Z, 0–9, -, _, .',
                    pattern: /^([^\/]+\/)?[\w.-]+$/
                },
                {
                    name: 'nameBeginEnd',
                    label: '[' + $i18next.t('common:NAME', {lng: lng}) + '] ' + $i18next.t('functions:BEGIN_END_WITH_ALPHANUMERIC', {lng: lng}),
                    pattern: /^([^\/]+\/)?[a-z0-9]([^\/]*[a-z0-9])?$/
                },
                {
                    name: 'nameMaxLength',
                    label: '[' + $i18next.t('common:NAME', {lng: lng}) + '] ' + $i18next.t('common:MAX_LENGTH_CHARACTERS', {lng: lng, count: 63}),
                    pattern: /^([^\/]+\/)?[^\/]{1,63}$/
                },
                {
                    name: 'prefixValidCharacters',
                    label: '[' + $i18next.t('functions:PREFIX', {lng: lng}) + '] ' + $i18next.t('common:VALID_CHARACTERS', {lng: lng}) + ': a–z, 0–9, -, .',
                    pattern: /^([a-z0-9.-]+\/)?[^\/]+$/
                },
                {
                    name: 'prefixBeginEnd',
                    label: '[' + $i18next.t('functions:PREFIX', {lng: lng}) + '] ' + $i18next.t('functions:BEGIN_END_WITH_LOWERCASE_ALPHANUMERIC', {lng: lng}),
                    pattern: /^([a-z0-9]([^\/]+[a-z0-9])?\/)?[^\/]+$/
                },
                {
                    name: 'prefixNotStart',
                    label: '[' + $i18next.t('functions:PREFIX', {lng: lng}) + '] ' + $i18next.t('functions:NOT_START_WITH_FORBIDDEN_WORDS', {lng: lng}),
                    pattern: /^(?!kubernetes\.io\/)(?!k8s\.io\/)/
                },
                {
                    name: 'prefixMaxLength',
                    label: '[' + $i18next.t('functions:PREFIX', {lng: lng}) + '] ' + $i18next.t('common:MAX_LENGTH_CHARACTERS', {lng: lng, count: 253}),
                    pattern: /^(?![^\/]{254,}\/)/
                },
                {
                    name: 'uniqueness',
                    label: $i18next.t('functions:UNIQUENESS', {lng: lng}),
                    pattern: validateUniqueness
                }
            ],
            value: [
                {
                    name: 'validCharacters',
                    label: $i18next.t('common:VALID_CHARACTERS', {lng: lng}) + ': a–z, A–Z, 0–9, -, _, .',
                    pattern: /^[\w-.]+$/
                },
                {
                    name: 'beginEnd',
                    label: $i18next.t('functions:BEGIN_END_WITH_ALPHANUMERIC', {lng: lng}),
                    pattern: /^([a-zA-Z0-9].*)?[a-zA-Z0-9]$/
                },
                {
                    name: 'maxLength',
                    label: $i18next.t('common:MAX_LENGTH_CHARACTERS', {lng: lng, count: 63}),
                    pattern: /^[\S\s]{1,63}$/
                }
            ]
        };

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
         * Determines `uniqueness` validation for `Key` field
         * @param {string} value - value to validate
         */
        function validateUniqueness(value) {
            return lodash.filter(ctrl.labels, ['name', value]).length === 1;
        }
    }
}());
