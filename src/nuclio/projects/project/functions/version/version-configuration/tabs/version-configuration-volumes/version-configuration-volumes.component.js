(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclVersionConfigurationVolumes', {
            bindings: {
                version: '<',
                onChangeCallback: '&'
            },
            templateUrl: 'nuclio/projects/project/functions/version/version-configuration/tabs/version-configuration-volumes/version-configuration-volumes.tpl.html',
            controller: NclVersionConfigurationVolumesController
        });

    function NclVersionConfigurationVolumesController($rootScope, $timeout, lodash, DialogsService) {
        var ctrl = this;

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
         */
        function handleAction(actionType, selectedItem) {
            if (actionType === 'delete') {
                deleteHandler(selectedItem);
            } else if (actionType === 'edit') {
                editHandler(selectedItem);
            } else if (actionType === 'update') {
                updateHandler(selectedItem);
            } else {
                DialogsService.alert('This functionality is not implemented yet.');
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
         * Deletes selected item
         * @param {Object} selectedItem - an object of selected data-binding
         */
        function deleteHandler(selectedItem) {
            lodash.remove(ctrl.volumes, ['volume.name', selectedItem.volume.name]);

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

                lodash.forEach(workingCopy, function (volume) {
                    delete volume.ui;
                });

                lodash.set(ctrl.version, 'spec.volumes', workingCopy);
            }
        }

        /**
         * Check if trigger is in edit mode
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
    }
}());
