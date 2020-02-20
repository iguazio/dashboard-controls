(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationVolumes', {
            bindings: {
                version: '<',
                onChangeCallback: '&'
            },
            templateUrl: 'nuclio/functions/version/version-configuration/tabs/version-configuration-volumes/version-configuration-volumes.tpl.html',
            controller: NclVersionConfigurationVolumesController
        });

    function NclVersionConfigurationVolumesController($rootScope, $timeout, $i18next, i18next, lodash, DialogsService,
                                                      FunctionsService, ValidatingPatternsService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.isCreateModeActive = false;
        ctrl.volumes = [];
        ctrl.igzScrollConfig = {
            maxElementsCount: 5,
            childrenSelector: '.ncl-collapsing-row'
        };
        ctrl.scrollConfig = {
            axis: 'y',
            advanced: {
                updateOnContentResize: true
            }
        };
        ctrl.validationRules = {
            itemName: [],
            itemPath: [
                {
                    label: $i18next.t('common:MAX_LENGTH_CHARACTERS', {lng: lng, count: 255}),
                    pattern: /^(?=[\S\s]{1,255}$)/
                },
                {
                    label: $i18next.t('functions:UNIQUENESS', {lng: lng}),
                    pattern: validateUniqueness.bind(null, 'volumeMount.mountPath')
                }
            ],
            containerName: ValidatingPatternsService.getValidationRules('containerName')
        };

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.createVolume = createVolume;
        ctrl.editVolumeCallback = editVolumeCallback;
        ctrl.handleAction = handleAction;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.validationRules.itemName = ValidatingPatternsService.getValidationRules('k8s.dns1123Label').concat([
                {
                    label: $i18next.t('functions:UNIQUENESS', {lng: lng}),
                    pattern: validateUniqueness.bind(null, 'volume.name')
                }
            ]);

            // get volumes list
            ctrl.volumes = lodash.map(lodash.get(ctrl.version, 'spec.volumes', []), function (value) {
                var volumeItem = angular.copy(value);

                volumeItem.ui = {
                    editModeActive: false,
                    isFormValid: true,
                    name: 'volume'
                };

                return volumeItem;
            });

            ctrl.classList = FunctionsService.getClassesList('volume');
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $rootScope.$broadcast('change-state-deploy-button', { component: 'volume', isDisabled: false });
        }

        //
        // Public methods
        //

        /**
         * Toggle create binding mode
         * @param {Event} event
         */
        function createVolume(event) {
            $timeout(function () {
                if (!isVolumeInEditMode()) {
                    ctrl.volumes.push(
                        {
                            volumeMount: {
                                name: ''
                            },
                            volume: {
                                name: ''
                            },
                            ui: {
                                editModeActive: true,
                                isFormValid: false,
                                name: 'volume'
                            }
                        }
                    );

                    event.stopPropagation();
                    $rootScope.$broadcast('change-state-deploy-button', { component: 'volume', isDisabled: true });
                }
            }, 100);
        }

        /**
         * Edit item callback function
         * @param {Object} item - selected item
         */
        function editVolumeCallback(item) {
            ctrl.handleAction('update', item);
        }

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - e.g. `'delete'`, `'edit'`, `'update'`
         * @param {Object} selectedItem - an object of selected volume
         * @param {number} [index] - index of variable in array
         */
        function handleAction(actionType, selectedItem, index) {
            if (actionType === 'delete') {
                deleteHandler(selectedItem, index);
            } else if (actionType === 'edit') {
                editHandler(selectedItem);
            } else if (actionType === 'update') {
                updateHandler(selectedItem);
            } else {
                DialogsService.alert($i18next.t('functions:ERROR_MSG.FUNCTIONALITY_IS_NOT_IMPLEMENTED', {lng: lng}));
            }

            $rootScope.$broadcast('change-state-deploy-button', { component: 'volume', isDisabled: false });
            lodash.forEach(ctrl.volumes, function (volume) {
                if (!volume.ui.isFormValid) {
                    $rootScope.$broadcast('change-state-deploy-button', { component: volume.ui.name, isDisabled: true });
                }
            });

            ctrl.onChangeCallback();
        }

        //
        // Private methods
        //

        /**
         * Checks validation of volumes
         */
        function checkValidation() {
            if (lodash.some(ctrl.volumes, ['ui.isFormValid', false])) {
                $rootScope.$broadcast('update-patterns-validity', ['itemName', 'itemPath']);
            }
        }

        /**
         * Deletes selected item
         * @param {Object} selectedItem - an object of selected data-binding
         * @param {number} index - index of variable in array
         */
        function deleteHandler(selectedItem, index) {
            ctrl.volumes.splice(index, 1);

            checkValidation();

            var workingCopy = lodash.map(ctrl.volumes, function (volume) {
                return lodash.omit(volume, 'ui');
            });

            lodash.set(ctrl.version, 'spec.volumes', workingCopy);
        }

        /**
         * Toggles item to edit mode
         * @param {Object} selectedItem - an object of selected data-binding
         */
        function editHandler(selectedItem) {
            var volume = lodash.find(ctrl.volumes, ['volume.name', selectedItem.volume.name]);
            volume.ui.editModeActive = true;
        }

        /**
         * Checks if volume is in edit mode
         * @returns {boolean}
         */
        function isVolumeInEditMode() {
            var isEditMode = false;

            ctrl.volumes.forEach(function (volume) {
                if (volume.ui.editModeActive) {
                    isEditMode = true;
                }
            });

            return isEditMode;
        }

        /**
         * Updates data in selected item
         * @param {Object} selectedItem - an object of selected data-binding
         */
        function updateHandler(selectedItem) {
            var workingCopy = angular.copy(ctrl.volumes);
            var currentVolume = lodash.find(ctrl.volumes, ['volume.name', selectedItem.volume.name]);
            var indexOfEditableElement = lodash.findIndex(ctrl.volumes, ['volume.name', selectedItem.volume.name]);

            if (angular.isDefined(currentVolume)) {
                workingCopy[indexOfEditableElement] = {
                    volumeMount: selectedItem.volumeMount,
                    volume: selectedItem.volume
                };

                checkValidation();

                lodash.forEach(workingCopy, function (volume) {
                    delete volume.ui;
                });

                lodash.set(ctrl.version, 'spec.volumes', workingCopy);
            }
        }

        /**
         * Determines `uniqueness` validation for `Name` and `Mount Path` fields
         * @param {string} path
         * @param {string} value
         */
        function validateUniqueness(path, value) {
            return lodash.filter(ctrl.volumes, [path, value]).length === 1;
        }
    }
}());
