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

    function NclVersionConfigurationVolumesController($rootScope, $scope, $timeout, $i18next, i18next, lodash,
                                                      DialogsService, FormValidationService,
                                                      FunctionsService, ValidationService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.isCreateModeActive = false;
        ctrl.volumes = [];
        ctrl.volumesForm = null;
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
            itemPath: ValidationService.getValidationRules('function.itemPath', [{
                label: $i18next.t('functions:UNIQUENESS', { lng: lng }),
                pattern: validateUniqueness.bind(null, 'volumeMount.mountPath')
            }]),
            containerName: ValidationService.getValidationRules('container.name')
        };
        ctrl.maxLengths = {
            containerSubPath: ValidationService.getMaxLength('function.containerSubPath')
        };

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
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
            ctrl.validationRules.itemName = ValidationService.getValidationRules('k8s.dns1123Label').concat([
                {
                    label: $i18next.t('functions:UNIQUENESS', { lng: lng }),
                    pattern: validateUniqueness.bind(null, 'volume.name')
                }
            ]);

            ctrl.classList = FunctionsService.getClassesList('volume');

            $scope.$on('edit-item-has-been-changed', updateVolumesChangesState);
        }

        /**
         * On changes hook method.
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.version)) {

                // get volumes list
                ctrl.volumes = lodash.map(lodash.get(ctrl.version, 'spec.volumes', []), function (value) {
                    var volumeItem = angular.copy(value);

                    volumeItem.ui = {
                        changed: false,
                        editModeActive: false,
                        isFormValid: true,
                        name: 'volume'
                    };

                    return volumeItem;
                });
            }
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
         * Toggle create volume mode
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
                                changed: true,
                                editModeActive: true,
                                isFormValid: false,
                                name: 'volume'
                            }
                        }
                    );

                    ctrl.volumesForm.$setPristine();

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
                deleteHandler(index);
            } else if (actionType === 'edit') {
                editHandler(selectedItem);
            } else if (actionType === 'update') {
                updateHandler(selectedItem);
            } else {
                DialogsService.alert($i18next.t('functions:ERROR_MSG.FUNCTIONALITY_IS_NOT_IMPLEMENTED', { lng: lng }));
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
                FormValidationService.validateAllFields(ctrl.volumesForm);
            }
        }

        /**
         * Deletes selected item
         * @param {number} index - index of variable in array
         */
        function deleteHandler(index) {
            ctrl.volumes.splice(index, 1);

            // since uniqueness validation rule of some fields is dependent on the entire volume list, whenever a volume
            // is removed, the rest of the volumes needs to be re-validated
            checkValidation();

            var workingCopy = lodash.map(ctrl.volumes, function (volume) {
                return lodash.omit(volume, 'ui');
            });

            lodash.set(ctrl.version, 'spec.volumes', workingCopy);
        }

        /**
         * Toggles item to edit mode
         * @param {Object} selectedItem - an object of selected volume
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
            return lodash.some(ctrl.volumes, ['ui.editModeActive', true]);
        }

        /**
         * Updates data in selected item
         * @param {Object} selectedItem - an object of selected volume
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

                // since uniqueness validation rule of some fields is dependent on the entire volume list, whenever a
                // volume is updated, the rest of the volumes needs to be re-validated
                checkValidation();

                lodash.forEach(workingCopy, function (volume) {
                    delete volume.ui;
                });

                lodash.set(ctrl.version, 'spec.volumes', workingCopy);
            }
        }

        /**
         * Checks volumes and updates `ctrl.version.ui.isVolumesChanged` if there is some changed and unsaved trigger.
         */
        function updateVolumesChangesState() {
            var isSomeVolumeChanged = lodash.some(ctrl.volumes, ['ui.changed', true]);
            var isSomeVolumeInEditMode = lodash.some(ctrl.volumes, ['ui.editModeActive', true]);

            lodash.set(ctrl.version, 'ui.isVolumesChanged', isSomeVolumeChanged && isSomeVolumeInEditMode);
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
