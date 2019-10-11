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

    function NclVersionConfigurationVolumesController($element, $rootScope, $timeout, $i18next, i18next, lodash,
                                                      DialogsService, VersionHelperService) {
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
        ctrl.nameTooltip = getNameTooltip();

        ctrl.$onInit = onInit;
        ctrl.$onDestroy = onDestroy;

        ctrl.createVolume = createVolume;
        ctrl.editVolumeCallback = editVolumeCallback;
        ctrl.handleAction = handleAction;
        ctrl.onInputValueCallback = validateUniqueness;

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
         * Deletes selected item
         * @param {Object} selectedItem - an object of selected data-binding
         */
        function deleteHandler(selectedItem) {
            lodash.remove(ctrl.volumes, ['volume.name', selectedItem.volume.name]);

            var workingCopy = lodash.map(ctrl.volumes, function (volume) {
                return lodash.omit(volume, 'ui');
            });

            lodash.set(ctrl.version, 'spec.volumes', workingCopy);

            $timeout(validateUniqueness);
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
         * Generates tooltip for "Name" label
         */
        function getNameTooltip() {
            var config = [
                {
                    head: $i18next.t('functions:TOOLTIP.CONFIGURATION.RESTRICTIONS', {lng: lng}),
                    values: [
                        {
                            head: $i18next.t('functions:TOOLTIP.CONFIGURATION.VALID_CHARACTERS', {lng: lng}) + ' —',
                            values: [
                                {head: $i18next.t('functions:TOOLTIP.CONFIGURATION.LOWERCASE_ALPHANUMERIC', {lng: lng}) + ' (a–z, 0–9)'},
                                {head: $i18next.t('functions:TOOLTIP.CONFIGURATION.HYPHENS', {lng: lng}) + ' (-)'}
                            ]
                        },
                        {
                            head: $i18next.t('functions:TOOLTIP.CONFIGURATION.BEGIN_END_WITH_LOWERCASE_ALPHANUMERIC', {lng: lng}) + ' (a–z, 0–9)'
                        },
                        {
                            head: $i18next.t('functions:TOOLTIP.CONFIGURATION.MAX_LENGTH', {lng: lng, count: 63})
                        }
                    ]
                },
                {
                    head: $i18next.t('functions:TOOLTIP.CONFIGURATION.EXAMPLES', {lng: lng}),
                    values: [
                        {head: '"my_volume"'},
                        {head: '"123-abc"'}
                    ]
                }
            ];

            return VersionHelperService.generateTooltip(config);
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
         * Determines and sets `uniqueness` validation for `Name` and `Mount Path` fields
         */
        function validateUniqueness() {
            var chunkedVolumes = lodash.chunk(ctrl.volumes);

            validate('volume.name', 'itemName');
            validate('volumeMount.mountPath', 'itemPath');

            function validate(path, controlName) {
                var validItems = lodash.map(lodash.xorBy.apply(null, chunkedVolumes.concat(path)), path);
                var controls = lodash.filter(ctrl.volumesForm.$getControls(), controlName);

                lodash.forEach(controls, function (control) {
                    control[controlName].$setValidity('uniqueness',
                        lodash.includes(validItems, control[controlName].$viewValue)
                    );
                });
            }
        }
    }
}());
