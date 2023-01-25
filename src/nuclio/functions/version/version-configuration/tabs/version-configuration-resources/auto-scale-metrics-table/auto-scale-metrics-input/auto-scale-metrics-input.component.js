(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('nclAutoScaleMetricsInput', {
            bindings: {
                actionHandlerCallback: '&',
                changeDataCallback: '&',
                isDisabled: '<?',
                itemIndex: '<',
                typeList: '<',
                presetsList: '<',
                rowData: '<',
            },
            templateUrl: 'nuclio/functions/version/version-configuration/tabs/version-configuration-resources/auto-scale-metrics-table/auto-scale-metrics-input/auto-scale-metrics-input.tpl.html',
            controller: NclAutoScaleMetricsInputController
        });

    function NclAutoScaleMetricsInputController($document, $element, $i18next, $scope, $timeout, i18next,
                                                lodash, DialogsService, EventHelperService) {
        var ctrl = this;
        var lng = i18next.language;

        ctrl.actions = [
            {
                label: $i18next.t('common:DELETE', {lng: lng}),
                id: 'delete',
                icon: 'igz-icon-trash',
                active: true,
                confirm: {
                    message: $i18next.t('common:DELETE_SELECTED_ITEM_CONFIRM', {lng: lng}),
                    yesLabel: $i18next.t('common:YES_DELETE', {lng: lng}),
                    noLabel: $i18next.t('common:CANCEL', {lng: lng}),
                    type: 'critical_alert'
                }
            }
        ];
        ctrl.autoScaleMetricForm = null;
        ctrl.metricData = {};
        ctrl.unitLabel = '%';

        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;
        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.getSelectedItem = getSelectedItem;
        ctrl.onClickAction = onClickAction;
        ctrl.onEditInput = onEditInput;
        ctrl.handleDropdownChange = handleDropdownChange;
        ctrl.inputValueCallback = inputValueCallback;
        ctrl.sliderInputCallback = sliderInputCallback;

        //
        // Hook methods
        //

        /**
         * On changes hook method.
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.isDisabled)) {
                updateSliderConfig();
            }
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $document.off('click', saveChanges);
            $document.off('keypress', saveChanges);
        }

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.metricData = lodash.cloneDeep(ctrl.rowData);
            ctrl.editMode = lodash.get(ctrl.metricData, 'ui.editModeActive', false);

            lodash.defaults(ctrl, {isDisabled: false});

            ctrl.sliderConfig = {
                value: lodash.get(ctrl.metricData, 'threshold', 75),
                valueLabel: ctrl.isDisabled ? 'disabled' : lodash.get(ctrl.metricData, 'threshold', 75),
                pow: 0,
                unitLabel: ctrl.isDisabled ? '' : '%',
                labelHelpIcon: false,
                options: {
                    disabled: ctrl.isDisabled,
                    floor: 1,
                    id: 'scaleMetrics',
                    ceil: 100,
                    step: 1,
                    showSelectionBar: true
                }
            };
        }

        /**
         * Post linking method
         */
        function postLink() {
            $document.on('click', saveChanges);
            $document.on('keypress', saveChanges);
            ctrl.autoScaleMetricForm.$setPristine();
        }

        //
        // Public methods
        //

        /**
         * Gets selected item in dropdown
         * @returns {Object}
         */
        function getSelectedItem(field) {
            return lodash.get(ctrl.metricData, field) === '' ? ''  : ctrl.metricData;
        }

        /**
         * Handler on action click and shows confirm dialog
         * @param {Object} action - action that was clicked (e.g. `delete`)
         */
        function onClickAction(action) {
            if (lodash.isNonEmpty(action.confirm)) {
                DialogsService.confirm(action.confirm.message, action.confirm.yesLabel, action.confirm.noLabel, action.confirm.type)
                    .then(function () {
                        onFireAction(action.id);
                    });
            } else {
                onFireAction(action.id);
            }
        }

        /**
         * Enables edit mode
         */
        function onEditInput() {
            ctrl.editMode = true;

            $document.on('click', saveChanges);
            $document.on('keypress', saveChanges);
        }

        /**
         * Handles the dropdown change
         * @param {Object} data - selected data
         * @param {string} field
         */
        function handleDropdownChange(data, field) {
            var targetObj = {};

            if (field === 'displayName') {
                targetObj = {
                    sourceType: data.sourceType,
                    metricName: data.metricName
                };

                if (ctrl.metricData.displayType !== data.displayType) {
                    if (data.displayType === 'percentage') {
                        lodash.merge(ctrl.sliderConfig, {
                            value: 1,
                            valueLabel: 1
                        });
                    }

                    lodash.merge(targetObj, {
                        threshold: 1,
                        displayType: data.displayType
                    });
                }
            } else if (field === 'windowSize') {
                targetObj = {
                    windowSize: data.windowSize
                }
            }

            lodash.merge(ctrl.metricData, targetObj);
            $timeout(saveChanges);
        }

        /**
         * Update data callback
         * @param {string} newData
         * @param {string} field
         */
        function inputValueCallback(newData, field) {
            ctrl.metricData[field] = newData;

            saveChanges();
        }

        /**
         * Update slider callback
         * @param {number} newValue
         * @param {string} field
         */
        function sliderInputCallback(newValue, field) {
            if (lodash.isNil(newValue)) {
                lodash.set(ctrl.metricData, field, 100);
            } else {
                lodash.set(ctrl.metricData, field, Number(newValue));
            }

            saveChanges();
        }

        //
        // Private methods
        //

        /**
         * According to given action name calls proper action handler
         * @param {string} actionType - a type of action
         */
        function onFireAction(actionType) {
            ctrl.actionHandlerCallback({
                actionType: actionType,
                index: ctrl.itemIndex
            });
            ctrl.editMode = false;
        }

        /**
         * Calls callback with new data
         * @param {Event} [event]
         */
        function saveChanges(event) {
            if (angular.isUndefined(event) || $element.find(event.target).length === 0 ||
                event.keyCode === EventHelperService.ENTER) {

                $scope.$evalAsync(function () {
                    if (angular.isDefined(event)) {
                        lodash.forEach(ctrl.autoScaleMetricForm.$getControls(), function (control) {
                            control.$setDirty();
                            control.$validate();
                        });
                    }

                    if (ctrl.autoScaleMetricForm.$valid) {
                        lodash.assign(ctrl.metricData.ui, {
                            editModeActive: false,
                            isFormValid: true
                        });

                        ctrl.editMode = false;

                        $document.off('click', saveChanges);
                        $document.off('keypress', saveChanges);
                    } else {
                        lodash.assign(ctrl.metricData.ui, {
                            editModeActive: true,
                            isFormValid: false
                        });
                    }

                    ctrl.changeDataCallback({
                        newData: ctrl.metricData,
                        index: ctrl.itemIndex
                    });
                })
            }
        }

        /**
         * Updates slider config
         */
        function updateSliderConfig() {
            lodash.merge(ctrl.sliderConfig, {
                valueLabel: ctrl.isDisabled ? 'disabled' : lodash.get(ctrl.metricData, 'threshold', 75),
                unitLabel: ctrl.isDisabled ? '' : '%',
                options: {
                    disabled: ctrl.isDisabled
                }
            });

            ctrl.unitLabel = ctrl.isDisabled ? '' : '%';
        }
    }
}());
