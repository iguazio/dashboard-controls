'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls', ['iguazio.dashboard-controls.templates']);
})();
'use strict';

(function () {
    'use strict';

    IgzActionCheckbox.$inject = ['$scope', '$rootScope'];
    angular.module('iguazio.dashboard-controls').component('igzActionCheckbox', {
        bindings: {
            item: '<',
            onClickCallback: '&?'
        },
        templateUrl: 'action-checkbox/action-checkbox.tpl.html',
        controller: IgzActionCheckbox
    });

    function IgzActionCheckbox($scope, $rootScope) {
        var ctrl = this;

        ctrl.onCheck = onCheck;
        ctrl.$onInit = $onInit;

        //
        // Public methods
        //

        /**
         * Handles mouse click on checkbox
         * @param {Object} $event - event object
         */
        function onCheck($event) {
            ctrl.item.ui.checked = !ctrl.item.ui.checked;

            if (angular.isFunction(ctrl.onClickCallback)) {
                $event.stopPropagation();
                ctrl.onClickCallback();
            }

            $rootScope.$broadcast('action-checkbox_item-checked', { checked: ctrl.item.ui.checked });
        }

        //
        // Private methods
        //

        /**
         * Constructor method
         */
        function $onInit() {
            $scope.$on('action-checkbox-all_check-all', toggleCheckedAll);
        }

        /**
         * Triggers on Check all button clicked
         * @param {Object} event
         * @param {Object} data
         */
        function toggleCheckedAll(event, data) {
            if (ctrl.item.ui.checked !== data.checked) {
                ctrl.item.ui.checked = !ctrl.item.ui.checked;
            }

            if (angular.isFunction(ctrl.onClickCallback)) {
                ctrl.onClickCallback();
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzActionCheckboxAllController.$inject = ['$scope', '$rootScope'];
    angular.module('iguazio.dashboard-controls').component('igzActionCheckboxAll', {
        bindings: {
            itemsCountOriginal: '<itemsCount',
            checkedItemsCount: '<?',
            onCheckChange: '&?'
        },
        templateUrl: 'action-checkbox-all/action-checkbox-all.tpl.html',
        controller: IgzActionCheckboxAllController
    });

    function IgzActionCheckboxAllController($scope, $rootScope) {
        var ctrl = this;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.allItemsChecked = false;
        ctrl.onCheckAll = onCheckAll;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.checkedItemsCount = angular.isUndefined(ctrl.checkedItemsCount) ? 0 : ctrl.checkedItemsCount;
            ctrl.itemsCount = angular.isUndefined(ctrl.itemsCount) ? 0 : ctrl.itemsCount;

            $scope.$on('action-checkbox_item-checked', toggleCheckedItem);
            $scope.$on('action-checkbox-all_change-checked-items-count', changeItemsCheckedCount);
            $scope.$on('action-checkbox-all_set-checked-items-count', setCheckedItemsCount);
        }

        /**
         * Changes method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.itemsCountOriginal)) {
                ctrl.itemsCount = ctrl.itemsCountOriginal;
                testAllItemsChecked();
            }
        }

        //
        // Public methods
        //

        /**
         * Calls when Check all button is clicked.
         */
        function onCheckAll() {
            ctrl.allItemsChecked = !ctrl.allItemsChecked;
            ctrl.checkedItemsCount = ctrl.allItemsChecked ? ctrl.itemsCount : 0;

            $rootScope.$broadcast('action-checkbox-all_check-all', {
                checked: ctrl.allItemsChecked,
                checkedCount: ctrl.checkedItemsCount
            });

            if (angular.isFunction(ctrl.onCheckChange)) {
                ctrl.onCheckChange({ checkedCount: ctrl.checkedItemsCount });
            }
        }

        //
        // Private methods
        //

        /**
         * Calls on checked items count change
         * @param {Object} event
         * @param {Object} data
         */
        function changeItemsCheckedCount(event, data) {
            if (data.changedCheckedItemsCount === 0) {
                ctrl.checkedItemsCount = 0;
            } else {
                ctrl.checkedItemsCount += data.changedCheckedItemsCount;
            }

            $rootScope.$broadcast('action-checkbox-all_checked-items-count-change', {
                checkedCount: ctrl.checkedItemsCount
            });
        }

        /**
         * Sets checked items count
         * @param {Object} event
         * @param {number} newCheckedItemsCount
         */
        function setCheckedItemsCount(event, newCheckedItemsCount) {
            ctrl.checkedItemsCount = newCheckedItemsCount;

            testAllItemsChecked();
        }

        /**
         * Calls on checkbox check/uncheck
         * @param {Object} event
         * @param {Object} data
         */
        function toggleCheckedItem(event, data) {
            if (data.checked) {
                ctrl.checkedItemsCount++;
            } else {
                ctrl.checkedItemsCount--;
            }

            $rootScope.$broadcast('action-checkbox-all_checked-items-count-change', {
                checkedCount: ctrl.checkedItemsCount
            });

            testAllItemsChecked();

            // callback function is called to inform about checked items count
            if (angular.isFunction(ctrl.onCheckChange)) {
                ctrl.onCheckChange({ checkedCount: ctrl.checkedItemsCount });
            }
        }

        /**
         * Updates items count and toggle allItemsChecked flag
         */
        function testAllItemsChecked() {
            ctrl.allItemsChecked = ctrl.itemsCount > 0 && ctrl.checkedItemsCount === ctrl.itemsCount;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    ActionCheckboxAllService.$inject = ['$rootScope'];
    angular.module('iguazio.dashboard-controls').factory('ActionCheckboxAllService', ActionCheckboxAllService);

    function ActionCheckboxAllService($rootScope) {
        return {
            changeCheckedItemsCount: changeCheckedItemsCount,
            setCheckedItemsCount: setCheckedItemsCount
        };

        //
        // Public methods
        //

        /**
         * Sends broadcast with count of changed checked items
         * @param {number} changedCheckedItemsCount - number of changed checked items
         */
        function changeCheckedItemsCount(changedCheckedItemsCount) {
            $rootScope.$broadcast('action-checkbox-all_change-checked-items-count', {
                changedCheckedItemsCount: changedCheckedItemsCount
            });
        }

        /**
         * Sends broadcast with count of checked items
         * @param {number} checkedItemsCount
         */
        function setCheckedItemsCount(checkedItemsCount) {
            $rootScope.$broadcast('action-checkbox-all_set-checked-items-count', checkedItemsCount);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzActionItemSubtemplateController.$inject = ['$compile', '$element'];
    angular.module('iguazio.dashboard-controls').component('igzActionItemSubtemplate', {
        bindings: {
            action: '<'
        },
        template: '<div class="igz-action-item-subtemplate"></div>',
        controller: IgzActionItemSubtemplateController
    });

    function IgzActionItemSubtemplateController($compile, $element) {
        var ctrl = this;

        ctrl.newScope = null;

        ctrl.$postLink = postLink;

        //
        // Hook methods
        //

        /**
         * Post linking method
         */
        function postLink() {
            var subTemplate = angular.element(ctrl.action.template);
            $element.find('.igz-action-item-subtemplate').append(subTemplate);

            ctrl.newScope = ctrl.action.scope.$new();
            ctrl.newScope.action = ctrl.action;
            $compile(subTemplate)(ctrl.newScope);

            ctrl.action.destroyNewScope = destroyNewScope;
        }

        //
        // Private method
        //

        /**
         * Destroy new created scope. Scope needs to be removed to prevent errors when viewing tags on the browse page.
         * And it needs to be done when updating panel actions
         */
        function destroyNewScope() {
            ctrl.newScope.$destroy();
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzActionItem.$inject = ['$rootScope', '$scope', '$element', '$document', 'lodash', 'ContainerBrowserService', 'DialogsService'];
    angular.module('iguazio.dashboard-controls').component('igzActionItem', {
        bindings: {
            action: '<',
            actions: '<?',
            template: '@'
        },
        templateUrl: 'action-item/action-item.tpl.html',
        controller: IgzActionItem
    });

    function IgzActionItem($rootScope, $scope, $element, $document, lodash, ContainerBrowserService, DialogsService) {
        var ctrl = this;

        ctrl.$onInit = onInit();
        ctrl.$onDestroy = onDestroy();
        ctrl.isItemVisible = isItemVisible;
        ctrl.onClickAction = onClickAction;
        ctrl.onFilesDropped = ContainerBrowserService.onFilesDropped;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            lodash.defaults(ctrl.action, {
                visible: true
            });
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            if (angular.isDefined(ctrl.action.template)) {
                detachDocumentEvent();
            }
        }

        //
        // Public methods
        //

        /**
         * Handles mouse click on action item
         * @param {MouseEvent} event
         */
        function onClickAction(event) {
            if (ctrl.action.active) {
                if (!lodash.isNil(ctrl.action.popupText)) {
                    $rootScope.$broadcast('browse-action_change-loading-text', { textToDisplay: ctrl.action.popupText });
                }

                // shows confirmation dialog if action.confirm is true
                if (lodash.isNonEmpty(ctrl.action.confirm)) {
                    showConfirmDialog(event);
                } else {
                    ctrl.action.handler(ctrl.action, event);
                }

                // if action has sub-templates shows/hides it
                if (angular.isDefined(ctrl.action.template)) {
                    toggleTemplate();
                }

                // calls callback if defined
                if (angular.isFunction(ctrl.action.callback)) {
                    ctrl.action.callback(ctrl.action);
                }
            }
        }

        /**
         * Checks if the action item should be shown
         * @param {Object} action
         * @returns {boolean}
         */
        function isItemVisible(action) {
            return lodash.get(action, 'visible', true);
        }

        //
        // Private methods
        //

        /**
         * Attaches on click event handler to the document
         */
        function attachDocumentEvent() {
            $document.on('click', hideSubtemplate);
        }

        /**
         * Removes on click event handler attached to the document
         */
        function detachDocumentEvent() {
            $document.off('click', hideSubtemplate);
        }

        /**
         * Hides sub-template dropdown when user clicks outside it
         * @param {MouseEvent} event
         */
        function hideSubtemplate(event) {
            $scope.$apply(function () {
                if (event.target !== $element[0] && $element.find(event.target).length === 0) {
                    ctrl.action.subTemplateProps.isShown = false;
                    detachDocumentEvent();
                }
            });
        }

        /**
         * Shows confirm dialog
         * @param {MouseEvent} event
         */
        function showConfirmDialog(event) {
            var message = lodash.isNil(ctrl.action.confirm.description) ? ctrl.action.confirm.message : {
                message: ctrl.action.confirm.message,
                description: ctrl.action.confirm.description
            };

            DialogsService.confirm(message, ctrl.action.confirm.yesLabel, ctrl.action.confirm.noLabel, ctrl.action.confirm.type).then(function () {
                ctrl.action.handler(ctrl.action, event);
            });
        }

        /**
         * Shows/hides sub-template
         */
        function toggleTemplate() {
            ctrl.action.subTemplateProps.isShown = !ctrl.action.subTemplateProps.isShown;
            if (ctrl.action.subTemplateProps.isShown) {
                attachDocumentEvent();
            } else {
                detachDocumentEvent();
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzActionPanel.$inject = ['$scope', '$rootScope', 'lodash', 'LoginService'];
    angular.module('iguazio.dashboard-controls').component('igzActionPanel', {
        bindings: {
            actions: '<',
            onItemsCheckedCount: '&?'
        },
        templateUrl: 'action-panel/action-panel.tpl.html',
        controller: IgzActionPanel,
        transclude: true
    });

    function IgzActionPanel($scope, $rootScope, lodash, LoginService) {
        var ctrl = this;

        var checkedItemsCount = 0;
        var mainActionsCount = 5;

        ctrl.mainActions = [];
        ctrl.remainActions = [];

        ctrl.$onInit = onInit;
        ctrl.isActionPanelShown = isActionPanelShown;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            $scope.$on('action-checkbox-all_checked-items-count-change', onUpdateCheckedItemsCount);
            $scope.$on('action-checkbox-all_check-all', onUpdateCheckedItemsCount);
            ctrl.actions = lodash.filter(ctrl.actions, function (action) {
                return !lodash.has(action, 'capability') || LoginService.hasCapabilities(action.capability);
            });
            angular.forEach(ctrl.actions, function (action) {
                if (!angular.isFunction(action.handler)) {
                    action.handler = defaultAction;

                    if (action.id === 'delete' && angular.isUndefined(action.confirm)) {
                        action.confirm = {
                            message: 'Are you sure you want to delete selected items?',
                            yesLabel: 'Yes, Delete',
                            noLabel: 'Cancel',
                            type: 'critical_alert'
                        };
                    }
                }
            });
            ctrl.mainActions = lodash.slice(ctrl.actions, 0, mainActionsCount);
            ctrl.remainingActions = lodash.slice(ctrl.actions, mainActionsCount, ctrl.actions.length);
        }

        //
        // Private methods
        //

        /**
         * Default action handler
         * @param {Object} action
         * @param {string} action.id - an action ID (e.g. delete, clone etc.)
         */
        function defaultAction(action) {
            $rootScope.$broadcast('action-panel_fire-action', {
                action: action.id
            });
        }

        /**
         * Checks whether the action panel can be shown
         * @returns {boolean}
         */
        function isActionPanelShown() {
            return checkedItemsCount > 0;
        }

        /**
         * Called when 'Check all' checkbox is clicked or checked some item.
         * @param {Event} event - $broadcast-ed event
         * @param {Object} data - $broadcast-ed data
         * @param {Object} data.checkedCount - count of checked items
         */
        function onUpdateCheckedItemsCount(event, data) {
            checkedItemsCount = data.checkedCount;

            if (angular.isFunction(ctrl.onItemsCheckedCount)) {
                ctrl.onItemsCheckedCount({ checkedCount: checkedItemsCount });
            }

            var visibleActions = lodash.filter(ctrl.actions, ['visible', true]);

            ctrl.mainActions = lodash.slice(visibleActions, 0, mainActionsCount);
            ctrl.remainingActions = lodash.slice(visibleActions, mainActionsCount, visibleActions.length);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzActionMenuController.$inject = ['$scope', '$element', '$document', '$rootScope', 'lodash', 'ConfigService', 'PreventDropdownCutOffService', 'LoginService'];
    angular.module('iguazio.dashboard-controls').component('igzActionMenu', {
        bindings: {
            actions: '<',
            shortcuts: '<',
            onFireAction: '<?',
            onClickShortcut: '<?',
            isMenuShown: '<?'
        },
        templateUrl: 'action-menu/action-menu.tpl.html',
        controller: IgzActionMenuController
    });

    function IgzActionMenuController($scope, $element, $document, $rootScope, lodash, ConfigService, PreventDropdownCutOffService, LoginService) {
        var ctrl = this;

        ctrl.isMenuShown = false;
        ctrl.preventDropdownCutOff = null;

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;
        ctrl.$onDestroy = onDestroy;

        ctrl.isDemoMode = ConfigService.isDemoMode;
        ctrl.showDetails = showDetails;
        ctrl.toggleMenu = toggleMenu;
        ctrl.isVisible = isVisible;

        //
        // Hook methods
        //

        /**
         * Initialize method
         */
        function onInit() {
            ctrl.actions = lodash.filter(ctrl.actions, function (action) {
                return !lodash.has(action, 'capability') || LoginService.hasCapabilities(action.capability);
            });
            ctrl.actions.forEach(function (action) {

                if (!angular.isFunction(action.handler)) {
                    action.handler = defaultAction;

                    if (action.id === 'delete' && angular.isUndefined(action.confirm)) {
                        action.confirm = {
                            message: 'Are you sure you want to delete selected item?',
                            yesLabel: 'Yes, Delete',
                            noLabel: 'Cancel',
                            type: 'critical_alert'
                        };
                    }
                }
            });

            $scope.$on('close-all-action-menus', closeActionMenu);
        }

        /**
         * Destructor
         */
        function onDestroy() {
            detachDocumentEvent();
        }

        function postLink() {

            // Bind DOM-related preventDropdownCutOff method to component's controller
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.menu-dropdown');

            attachDocumentEvent();
        }

        //
        // Public methods
        //

        /**
         * Handles mouse click on  a shortcut
         * @param {MouseEvent} event
         * @param {string} state - absolute state name or relative state path
         */
        function showDetails(event, state) {
            if (angular.isFunction(ctrl.onClickShortcut)) {
                ctrl.onClickShortcut(event, state);
            }
        }

        /**
         * Handles mouse click on the button of menu
         * @param {Object} event
         * Show/hides the action dropdown
         */
        function toggleMenu(event) {
            if (!ctrl.isMenuShown) {
                $rootScope.$broadcast('close-all-action-menus');
                ctrl.isMenuShown = true;
                attachDocumentEvent();
            } else {
                detachDocumentEvent();
                ctrl.isMenuShown = false;
            }

            event.stopPropagation();
        }

        /**
         * Checks if action menu is visible (not empty)
         */
        function isVisible() {
            return !lodash.isEmpty(ctrl.actions) || !lodash.isEmpty(ctrl.shortcuts);
        }

        //
        // Private methods
        //

        /**
         * Attaches on click event handler to the document
         */
        function attachDocumentEvent() {
            $document.on('click', onDocumentClick);
        }

        /**
         * Closes action menu
         */
        function closeActionMenu() {
            ctrl.isMenuShown = false;
            detachDocumentEvent();
        }

        /**
         * Default action handler
         * @param {Object} action
         */
        function defaultAction(action) {
            if (angular.isFunction(ctrl.onFireAction)) {
                ctrl.onFireAction(action.id);
            }
        }

        /**
         * Removes on click event handler attached to the document
         */
        function detachDocumentEvent() {
            $document.off('click', onDocumentClick);
        }

        /**
         * Closes action menu
         * @param {MouseEvent} event
         */
        function onDocumentClick(event) {
            $scope.$apply(function () {
                if (event.target !== $element[0] && $element.find(event.target).length === 0) {
                    closeActionMenu();
                }
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzActionsPanesController.$inject = ['lodash', 'ConfigService'];
    angular.module('iguazio.dashboard-controls').component('igzActionsPanes', {
        bindings: {
            infoPaneDisable: '<?',
            isInfoPaneOpened: '<?',
            filtersToggleMethod: '&?',
            filtersCounter: '<?',
            showFilterIcon: '@?',
            infoPaneToggleMethod: '&?',
            closeInfoPane: '&?'
        },
        templateUrl: 'actions-panes/actions-panes.tpl.html',
        controller: IgzActionsPanesController
    });

    function IgzActionsPanesController(lodash, ConfigService) {
        var ctrl = this;

        ctrl.callToggleMethod = null;

        ctrl.$onInit = onInit;

        ctrl.isShowFilterActionIcon = isShowFilterActionIcon;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.callToggleMethod = angular.isFunction(ctrl.closeInfoPane) ? ctrl.closeInfoPane : ctrl.infoPaneToggleMethod;
        }

        //
        // Public method
        //

        /**
         * Checks if filter toggles method exists and if filter pane should toggle only in demo mode
         * @returns {boolean}
         */
        function isShowFilterActionIcon() {
            return angular.isFunction(ctrl.filtersToggleMethod) && (lodash.isEqual(ctrl.showFilterIcon, 'true') || ConfigService.isDemoMode());
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzBreadcrumbsDropdown.$inject = ['$document', '$element', '$rootScope', '$scope', '$state', 'lodash', 'ContainersDataService', 'ConfigService', 'ClustersDataService', 'StoragePoolsDataService', 'NuclioProjectsDataService'];
    angular.module('iguazio.dashboard-controls').component('igzBreadcrumbsDropdown', {
        bindings: {
            state: '<',
            title: '<'
        },
        templateUrl: 'breadcrumbs-dropdown/breadcrumbs-dropdown.tpl.html',
        controller: IgzBreadcrumbsDropdown
    });

    function IgzBreadcrumbsDropdown($document, $element, $rootScope, $scope, $state, lodash, ContainersDataService, ConfigService, ClustersDataService, StoragePoolsDataService, NuclioProjectsDataService) {
        var ctrl = this;

        ctrl.itemsList = [];
        ctrl.showDropdownList = false;
        ctrl.placeholder = 'Search...';

        ctrl.$onInit = onInit;
        ctrl.isStagingMode = ConfigService.isStagingMode;
        ctrl.showDropdown = showDropdown;
        ctrl.showDetails = showDetails;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (lodash.startsWith(ctrl.state, 'app.container')) {
                ContainersDataService.containers().then(setItemsList);
            } else if (lodash.startsWith(ctrl.state, 'app.cluster')) {
                ClustersDataService.clusters().then(setItemsList);
            } else if (lodash.startsWith(ctrl.state, 'app.storage-pool')) {
                StoragePoolsDataService.storagePools().then(setItemsList);
            } else if (lodash.startsWith(ctrl.state, 'app.project.functions')) {
                NuclioProjectsDataService.getProjects().then(setNuclioItemsList);
            }

            $document.on('click', unselectDropdown);
        }

        //
        // Public method
        //

        /**
         * Opens/closes dropdown
         */
        function showDropdown() {
            $document.on('click', unselectDropdown);
            ctrl.showDropdownList = !ctrl.showDropdownList;

            if (!ctrl.showDropdownList) {
                ctrl.searchText = '';

                $document.off('click', unselectDropdown);
            }
        }

        /**
         * Handles mouse click on a item's name
         * Navigates to selected page
         * @param {Event} event
         * @param {Object} item
         */
        function showDetails(event, item) {
            var params = {};
            lodash.set(params, !item.isNuclioState ? 'id' : 'projectId', item.id);

            ctrl.showDropdownList = !ctrl.showDropdownList;
            ctrl.searchText = '';

            $rootScope.$broadcast('statistics-data_abort-requests');

            $document.off('click', unselectDropdown);

            $state.go(ctrl.state, params);
        }

        //
        // Private method
        //

        /**
         * Handles promise
         * Sets items list for dropdown
         * @param {Object} data
         */
        function setItemsList(data) {
            ctrl.itemsList = lodash.map(data, function (item) {
                return {
                    id: item.id,
                    name: item.attr.name,
                    isNuclioState: false
                };
            });
        }

        /**
         * Handles promise
         * Sets items list for dropdown in Nuclio breadcrumbs
         * @param {Object} data
         */
        function setNuclioItemsList(data) {
            ctrl.itemsList = lodash.map(data, function (item) {
                return {
                    id: item.metadata.name,
                    name: item.spec.displayName,
                    isNuclioState: true
                };
            });
        }

        /**
         * Handle click on the document and not on the dropdown field and close the dropdown
         * @param {Object} e - event
         */
        function unselectDropdown(e) {
            if ($element.find(e.target).length === 0) {
                $scope.$evalAsync(function () {
                    ctrl.showDropdownList = false;
                    ctrl.searchText = '';

                    $document.off('click', unselectDropdown);
                });
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzNumberInputController.$inject = ['$timeout', '$element', 'lodash', 'FormValidationService'];
    angular.module('iguazio.dashboard-controls').component('igzNumberInput', {
        bindings: {
            currentValue: '<',
            currentValueUnit: '<',
            formObject: '<',
            onChange: '<?',
            isDisabled: '<?',
            validationValue: '<',
            validationValueUnit: '<',
            disableZeroValue: '<?',
            updateNumberInputCallback: '&?',
            defaultValue: '@',
            inputName: '@',
            isFocused: '@',
            maxValue: '<',
            minValue: '<',
            placeholder: '@',
            precision: '@decimalNumber',
            prefixUnit: '@',
            suffixUnit: '@',
            valueStep: '@',
            updateNumberInputField: '@?'
        },
        templateUrl: 'container-wizard-number-input/container-wizard-number-input.tpl.html',
        controller: IgzNumberInputController
    });

    function IgzNumberInputController($timeout, $element, lodash, FormValidationService) {
        var ctrl = this;

        ctrl.numberInputValid = true;
        ctrl.numberInputChanged = false;
        ctrl.precision = Number(ctrl.precision) || 0;
        ctrl.placeholder = ctrl.placeholder || '';

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        ctrl.isShowFieldInvalidState = FormValidationService.isShowFieldInvalidState;

        ctrl.checkInvalidation = checkInvalidation;
        ctrl.decreaseValue = decreaseValue;
        ctrl.increaseValue = increaseValue;
        ctrl.isShownUnit = isShownUnit;
        ctrl.onChangeInput = onChangeInput;
        ctrl.onBlurInput = onBlurInput;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.defaultValue = Number.isNaN(Number(ctrl.defaultValue)) ? null : Number(ctrl.defaultValue);
            resizeInput();
        }

        /**
         * Post linking method
         */
        function postLink() {
            ctrl.inputFocused = ctrl.isFocused === 'true';

            if (ctrl.isFocused === 'true') {
                $element.find('.field')[0].focus();
            }
        }

        //
        // Public methods
        //

        /**
         * Checks if the input value is invalid
         * @returns {boolean}
         */
        function checkInvalidation() {
            return ctrl.isShowFieldInvalidState(ctrl.formObject, ctrl.inputName);
        }

        /**
         * Method subtracts value from current value in input or sets current value to 0 it is below 0
         */
        function decreaseValue() {
            ctrl.currentValue = Math.max(Number(ctrl.currentValue) - Number(ctrl.valueStep), 0).toFixed(ctrl.precision);

            if (angular.isDefined(ctrl.formObject)) {
                ctrl.formObject[ctrl.inputName].$setViewValue(ctrl.currentValue.toString());
                ctrl.formObject[ctrl.inputName].$render();
            }

            // if value becomes zero - clear the input field
            if (ctrl.currentValue === 0 && ctrl.disableZeroValue) {
                ctrl.currentValue = null;
            }

            onCurrentValueChange();
        }

        /**
         * Method adds value to current value in input
         */
        function increaseValue() {
            ctrl.currentValue = (Number(ctrl.currentValue) + Number(ctrl.valueStep)).toFixed(ctrl.precision);

            if (angular.isDefined(ctrl.formObject)) {
                ctrl.formObject[ctrl.inputName].$setViewValue(ctrl.currentValue.toString());
                ctrl.formObject[ctrl.inputName].$render();
            }

            resizeInput();
            onCurrentValueChange();
        }

        /**
         * Method checks if passed value is defined
         * @param {string} [unitValue] - passed string unit value
         * @returns {boolean} returns true if defined
         */
        function isShownUnit(unitValue) {
            return angular.isDefined(unitValue);
        }

        /**
         * Handles on change event
         */
        function onChangeInput() {
            ctrl.numberInputChanged = true;
            resizeInput();
        }

        /**
         * Handles on blur event
         */
        function onBlurInput() {
            ctrl.inputFocused = false;
            onCurrentValueChange();
        }

        //
        // Private methods
        //

        /**
         * Handles any changes of current value
         */
        function onCurrentValueChange() {
            validateCurrentValue();
            $timeout(function () {
                lodash.get(ctrl, 'onChange', angular.noop)(ctrl.checkInvalidation());
                resizeInput();
            }, 0);
        }

        /**
         * Resizes number input width
         */
        function resizeInput() {
            var numberInput = $element.find('input')[0];
            if (!lodash.isNil(numberInput)) {
                numberInput.size = !lodash.isEmpty(ctrl.currentValue) || lodash.isNumber(ctrl.currentValue) ? ctrl.currentValue.toString().length : !lodash.isEmpty(ctrl.placeholder) ? ctrl.placeholder.length : 1;
            }
        }

        /**
         * Resets the input to default value if it is invalid
         */
        function validateCurrentValue() {
            ctrl.numberInputValid = ctrl.checkInvalidation();
            if (ctrl.numberInputValid) {
                ctrl.currentValue = Number(ctrl.defaultValue);
            }

            if (angular.isFunction(ctrl.updateNumberInputCallback)) {
                ctrl.updateNumberInputCallback({ newData: ctrl.currentValue, field: angular.isDefined(ctrl.updateNumberInputField) ? ctrl.updateNumberInputField : ctrl.inputName });
            }
        }
    }
})();
'use strict';

/* eslint max-statements: ["error", 100] */
(function () {
    'use strict';

    IgzDefaultDropdownController.$inject = ['$scope', '$element', '$document', '$timeout', '$transclude', '$window', 'lodash', 'EventHelperService', 'FormValidationService', 'PreventDropdownCutOffService', 'PriorityDropdownService', 'SeverityDropdownService'];
    angular.module('iguazio.dashboard-controls').component('igzDefaultDropdown', {
        bindings: {
            bottomButtonCallback: '<?',
            enableTyping: '<?',
            formObject: '<?',
            isDisabled: '<?',
            isCapitalized: '@?',
            isPagination: '<?',
            isRequired: '<?',
            matchPattern: '<',
            preventDropUp: '<?',
            selectedItem: '<',
            valuesArray: '<',
            itemSelectCallback: '&?',
            onOpenDropdown: '<?',
            onCloseDropdown: '&?',
            bottomButtonText: '@?',
            dropdownType: '@?',
            itemSelectField: '@?',
            inputName: '@?',
            nameKey: '@?',
            placeholder: '@?',
            readOnly: '<?',
            selectPropertyOnly: '@?'
        },
        templateUrl: 'default-dropdown/default-dropdown.tpl.html',
        transclude: true,
        controller: IgzDefaultDropdownController
    });

    function IgzDefaultDropdownController($scope, $element, $document, $timeout, $transclude, $window, lodash, EventHelperService, FormValidationService, PreventDropdownCutOffService, PriorityDropdownService, SeverityDropdownService) {
        var ctrl = this;

        ctrl.topPosition = 'inherit';
        ctrl.typedValue = '';
        ctrl.isDropdownContainerShown = false;
        ctrl.isDropUp = false;
        ctrl.selectedItemDescription = '';
        ctrl.isTranscludePassed = false;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;
        ctrl.$postLink = postLink;

        ctrl.checkIsRequired = checkIsRequired;
        ctrl.getDescription = getDescription;
        ctrl.getName = getName;
        ctrl.getIcon = getIcon;
        ctrl.getTooltip = getTooltip;
        ctrl.getValuesArray = getValuesArray;
        ctrl.isItemSelected = isItemSelected;
        ctrl.isPlaceholderClass = isPlaceholderClass;
        ctrl.isShowDropdownError = isShowDropdownError;
        ctrl.onChangeTypingInput = onChangeTypingInput;
        ctrl.onDropDownKeydown = onDropDownKeydown;
        ctrl.onItemKeydown = onItemKeydown;
        ctrl.selectItem = selectItem;
        ctrl.showSelectedItem = showSelectedItem;
        ctrl.toggleDropdown = toggleDropdown;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.isCapitalized = lodash.defaultTo(ctrl.isCapitalized, 'false').toLowerCase() === 'true';

            if (!lodash.isNil(ctrl.dropdownType) && ctrl.dropdownType === 'priority') {
                ctrl.valuesArray = PriorityDropdownService.getPrioritiesArray();
            }

            if (!lodash.isNil(ctrl.dropdownType) && ctrl.dropdownType === 'severity') {
                ctrl.valuesArray = SeverityDropdownService.getSeveritiesArray();
            }

            setDefaultInputValue();

            setDefaultPlaceholder();

            setEmptyObjectIfNullSelected();

            setValuesVisibility();

            // checks if transclude template was passed
            $transclude(function (transclude) {
                ctrl.isTranscludePassed = transclude.length > 0;
            });
        }

        /**
         * On changes hook method
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.selectedItem)) {
                if (!changes.selectedItem.isFirstChange()) {
                    setDefaultInputValue();
                }
            }

            if (angular.isDefined(changes.valuesArray)) {
                if (!changes.valuesArray.isFirstChange()) {
                    setDefaultInputValue();
                }
            }
        }

        /**
         * Post linking method
         */
        function postLink() {
            PreventDropdownCutOffService.preventDropdownCutOff($element, '.default-dropdown-container');
            $document.on('click', unselectDropdown);
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            $document.off('click', unselectDropdown);
        }

        //
        // Public methods
        //

        /**
         * Sets required flag
         */
        function checkIsRequired() {
            return Boolean(ctrl.isRequired);
        }

        /**
         * Returns the description of the provided item. Searches for a direct `description` property, or a
         * `description` property inside an `attr` property
         * @param {Object} item - the item whose description should be returned
         * @returns {string}
         */
        function getDescription(item) {
            return lodash.get(item, 'description', lodash.get(item, 'attr.description'), '');
        }

        /**
         * Returns the tooltip of the provided item
         * @param {Object} item - the item whose tooltip should be returned
         * @returns {string}
         */
        function getTooltip(item) {
            return lodash.get(item, 'tooltip', '');
        }

        /**
         * Returns the icon of the provided item.
         * @param {Object} item - the item whose icon should be returned
         * @returns {string}
         */
        function getIcon(item) {
            return lodash.get(item, 'icon', '');
        }

        /**
         * Returns the name of the provided item. Searches for a direct `name` property, or searches `name` property by
         * `nameKey`
         * @param {Object} item - the item whose name should be returned
         * @returns {string}
         */
        function getName(item) {
            return lodash.get(item, 'name', lodash.get(item, ctrl.nameKey, ''));
        }

        /**
         * Gets array of available values
         * @returns {Array}
         */
        function getValuesArray() {
            return ctrl.valuesArray;
        }

        /**
         * Determines whether current item selected
         * @param {Object} item - current item
         * @returns {boolean}
         */
        function isItemSelected(item) {
            return angular.isDefined(ctrl.selectPropertyOnly) ? ctrl.selectedItem === lodash.get(item, ctrl.selectPropertyOnly) : lodash.isEqual(ctrl.selectedItem, item);
        }

        /**
         * Checks if placeholder class should be set on input field
         * @returns {boolean}
         */
        function isPlaceholderClass() {
            return angular.isDefined(ctrl.selectPropertyOnly) ? ctrl.selectedItem === null : ctrl.selectedItem.id === null;
        }

        /**
         * Checks whether show error if custom dropdown is invalid or on whole form validation (on submit, tab switch)
         * @param {Object} form
         * @param {string} elementName
         * @returns {boolean|undefined}
         */
        function isShowDropdownError(form, elementName) {
            return ctrl.isRequired ? FormValidationService.isShowFieldInvalidState(form, elementName) : undefined;
        }

        /**
         * Changes selected item depending on typed value
         */
        function onChangeTypingInput() {
            if (!lodash.isNil(ctrl.typedValue)) {
                var newItem = {
                    id: ctrl.typedValue,
                    visible: true
                };
                lodash.set(newItem, ctrl.nameKey || 'name', ctrl.typedValue);

                ctrl.selectItem(lodash.find(ctrl.valuesArray, ['name', ctrl.typedValue]) || newItem);
            }
        }

        /**
         * Handles keydown events on dropdown
         * @param {Object} event
         */
        function onDropDownKeydown(event) {
            switch (event.keyCode) {
                case EventHelperService.UP:
                case EventHelperService.DOWN:
                    if (!ctrl.isDropdownContainerShown) {
                        ctrl.isDropdownContainerShown = true;
                    }
                    var firstListItem = $element.find('.default-dropdown-container .list-item').first();
                    firstListItem.focus();
                    break;
                case EventHelperService.TABKEY:
                    ctrl.isDropdownContainerShown = false;
                    break;
                case EventHelperService.SPACE:
                case EventHelperService.ENTER:
                    ctrl.isDropdownContainerShown = !ctrl.isDropdownContainerShown;
                    break;
                default:
                    break;
            }
            event.stopPropagation();
        }

        /**
         * Handles keydown events on dropdown items
         * @param {Object} event
         * @param {Object} item - current item
         */
        function onItemKeydown(event, item) {
            var dropdownField = $element.find('.default-dropdown-field').first();
            switch (event.keyCode) {
                case EventHelperService.UP:
                    if (!lodash.isNull(event.target.previousElementSibling)) {
                        event.target.previousElementSibling.focus();
                        event.stopPropagation();
                    }
                    break;
                case EventHelperService.DOWN:
                    if (!lodash.isNull(event.target.nextElementSibling)) {
                        event.target.nextElementSibling.focus();
                        event.stopPropagation();
                    }
                    break;
                case EventHelperService.SPACE:
                case EventHelperService.ENTER:
                    dropdownField.focus();
                    ctrl.selectItem(item);
                    break;
                case EventHelperService.ESCAPE:
                case EventHelperService.TABKEY:
                    dropdownField.focus();
                    ctrl.isDropdownContainerShown = false;
                    break;
                default:
                    break;
            }
            event.preventDefault();
            event.stopPropagation();
        }

        /**
         * Sets current item as selected
         * @param {Object} item - current item
         */
        function selectItem(item) {
            var previousItem = angular.copy(ctrl.selectedItem);
            if (angular.isDefined(ctrl.selectPropertyOnly)) {
                ctrl.selectedItem = lodash.get(item, ctrl.selectPropertyOnly);
                ctrl.selectedItemDescription = item.description;
            } else {
                ctrl.selectedItem = item;
            }
            ctrl.typedValue = ctrl.getName(item);

            if (angular.isFunction(ctrl.itemSelectCallback)) {
                $timeout(function () {
                    ctrl.itemSelectCallback({
                        item: item,
                        isItemChanged: previousItem !== ctrl.selectedItem,
                        field: angular.isDefined(ctrl.itemSelectField) ? ctrl.itemSelectField : null
                    });
                });
            }

            ctrl.isDropdownContainerShown = false;
        }

        /**
         * Displays selected item name in dropdown. If model is set to null, set default object
         * @returns {string}
         */
        function showSelectedItem() {
            if (!ctrl.selectedItem) {
                setEmptyObjectIfNullSelected();
                ctrl.hiddenInputValue = '';
            }

            if (angular.isDefined(ctrl.selectPropertyOnly) && angular.isDefined(ctrl.valuesArray)) {

                // Set description for selected item
                var selectedItemUiValue = lodash.find(ctrl.valuesArray, function (item) {
                    return lodash.get(item, ctrl.selectPropertyOnly) === ctrl.selectedItem;
                });

                ctrl.selectedItemDescription = lodash.get(selectedItemUiValue, 'description', null);

                // Return temporary object used for selected item name displaying on UI input field
                return {
                    name: lodash.get(selectedItemUiValue, 'name', lodash.get(selectedItemUiValue, ctrl.nameKey, ctrl.placeholder)),
                    icon: {
                        name: lodash.get(selectedItemUiValue, 'icon.name', ''),
                        class: lodash.get(selectedItemUiValue, 'icon.class', '')
                    },
                    description: ctrl.selectedItemDescription
                };
            }
            return ctrl.selectedItem;
        }

        /**
         * Shows dropdown element
         * @params {Object} $event
         */
        function toggleDropdown($event) {
            var dropdownContainer = $event.currentTarget;
            var buttonHeight = dropdownContainer.getBoundingClientRect().height;
            var position = dropdownContainer.getBoundingClientRect().top;
            var positionLeft = dropdownContainer.getBoundingClientRect().left;

            ctrl.isDropUp = false;

            if (angular.isUndefined(ctrl.preventDropUp) || !ctrl.preventDropUp) {
                if (!ctrl.isDropdownContainerShown) {
                    $timeout(function () {
                        var dropdownMenu = $element.find('.default-dropdown-container');
                        var menuHeight = dropdownMenu.height();

                        if (position > menuHeight && $window.innerHeight - position < buttonHeight + menuHeight) {
                            ctrl.isDropUp = true;
                            ctrl.topPosition = -menuHeight + 'px';
                        } else {
                            ctrl.isDropUp = false;
                            ctrl.topPosition = 'inherit';
                        }

                        if ($window.innerWidth - positionLeft < dropdownMenu.width()) {
                            dropdownMenu.css('right', '0');
                        }
                    });
                }
            }
            ctrl.isDropdownContainerShown = !ctrl.isDropdownContainerShown;

            if (ctrl.isDropdownContainerShown) {
                setValuesVisibility();

                $timeout(function () {
                    setWidth();

                    if (angular.isFunction(ctrl.onOpenDropdown)) {
                        ctrl.onOpenDropdown($element);
                    }
                });

                PreventDropdownCutOffService.preventDropdownCutOff($element, '.default-dropdown-container');
            } else {
                if (angular.isFunction(ctrl.onCloseDropdown)) {
                    ctrl.onCloseDropdown();
                }
            }
        }

        //
        // Private methods
        //

        /**
         * Sets default input value
         */
        function setDefaultInputValue() {
            if (!lodash.isNil(ctrl.selectedItem)) {
                ctrl.typedValue = ctrl.getName(angular.isDefined(ctrl.selectPropertyOnly) ? lodash.find(ctrl.valuesArray, [ctrl.selectPropertyOnly, ctrl.selectedItem]) : ctrl.selectedItem);

                if (ctrl.typedValue === '' && ctrl.enableTyping) {
                    ctrl.typedValue = ctrl.selectedItem;
                }
            }
        }

        /**
         * Sets default placeholder for drop-down if it's value is not defined
         */
        function setDefaultPlaceholder() {
            if (!ctrl.placeholder) {
                ctrl.placeholder = 'Please select...';
            }
        }

        /**
         * Sets default empty value if any other object has not been defined earlier
         */
        function setEmptyObjectIfNullSelected() {
            if (!ctrl.selectedItem) {
                ctrl.selectedItem = angular.isDefined(ctrl.selectPropertyOnly) ? null : {
                    id: null,
                    name: null
                };
            }
        }

        /**
         * Sets `visible` property for all array items into true if it is not already defined.
         * `visible` property determines whether item will be shown in drop-down list.
         */
        function setValuesVisibility() {
            lodash.forEach(ctrl.valuesArray, function (value) {
                lodash.defaults(value, { visible: true });
            });
        }

        /**
         * Handle click on the document and not on the dropdown field and close the dropdown
         * @param {Object} e - event
         */
        function unselectDropdown(e) {
            if ($element.find(e.target).length === 0) {
                $scope.$evalAsync(function () {
                    ctrl.isDropdownContainerShown = false;
                    ctrl.isDropUp = false;

                    if (angular.isFunction(ctrl.onCloseDropdown)) {
                        ctrl.onCloseDropdown();
                    }
                });
            }
        }

        /**
         * Takes the largest element and sets him width as min-width to all elements (needed to style drop-down list)
         */
        function setWidth() {
            var labels = $element.find('.default-dropdown-container ul li').find('.list-item-label');
            var minWidth = lodash(labels).map(function (label) {
                return angular.element(label)[0].clientWidth;
            }).min();

            lodash.forEach(labels, function (label) {
                angular.element(label).css('min-width', minWidth);
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').component('igzNavigationTabs', {
        bindings: {
            tabItems: '<'
        },
        templateUrl: 'navigation-tabs/navigation-tabs.tpl.html'
    });
})();
'use strict';

(function () {
    'use strict';

    NavigationTabsService.$inject = ['lodash', 'ConfigService'];
    angular.module('iguazio.dashboard-controls').factory('NavigationTabsService', NavigationTabsService);

    function NavigationTabsService(lodash, ConfigService) {
        return {
            getNavigationTabsConfig: getNavigationTabsConfig
        };

        //
        // Public methods
        //

        /**
         * Returns navigation tabs config depending on current state
         * @param {string} state
         * @returns {Array}
         */
        function getNavigationTabsConfig(state) {
            var navigationTabsConfigs = {
                'app.container': getContainersConfig(),
                'app.cluster': getClustersConfig(),
                'app.events': getEventsConfig(),
                'app.storage-pool': getStoragePoolsConfig(),
                'app.identity': getIdentityConfig(),
                'app.control-panel': getControlPanelConfig()
            };
            var stateTest = state.match(/^[^.]*.[^.]*/);

            return lodash.get(navigationTabsConfigs, stateTest[0], []);
        }

        //
        // Private methods
        //

        /**
         * Returns containers navigation tabs config
         * @returns {Array.<Object>}
         */
        function getContainersConfig() {
            var config = [{
                tabName: 'Overview',
                uiRoute: 'app.container.overview',
                capability: 'containers.overview'
            }, {
                tabName: 'Browse',
                uiRoute: 'app.container.browser',
                capability: 'containers.browse'
            }, {
                tabName: 'Data Access Policy',
                uiRoute: 'app.container.data-access-policy',
                capability: 'containers.dataPolicy'
            }];

            if (ConfigService.isStagingMode()) {
                config.push({
                    tabName: 'Data Lifecycle',
                    uiRoute: 'app.container.data-lifecycle',
                    capability: 'containers.dataLifecycle'
                });
            }

            if (ConfigService.isDemoMode()) {
                config.splice(1, 0, {
                    tabName: 'Analytics',
                    uiRoute: 'app.container.analytics',
                    capability: 'containers.analytics'
                });
            }

            return config;
        }

        /**
         * Returns clusters navigation tabs config
         * @returns {Array.<Object>}
         */
        function getClustersConfig() {
            return [{
                tabName: 'Nodes',
                uiRoute: 'app.cluster.nodes',
                capability: 'clusters.nodes'
            }];
        }

        /**
         * Returns storage pools navigation tabs config
         * @returns {Array.<Object>}
         */
        function getStoragePoolsConfig() {
            var config = [{
                tabName: 'Overview',
                uiRoute: 'app.storage-pool.overview',
                capability: 'storagePools.overview'
            }, {
                tabName: 'Devices',
                uiRoute: 'app.storage-pool.devices',
                capability: 'storagePools.listDevices'
            }];

            if (ConfigService.isStagingMode()) {
                config.splice(1, 0, {
                    tabName: 'Containers',
                    uiRoute: 'app.storage-pool.containers',
                    capability: 'storagePools.listContainers'
                });
            }

            return config;
        }

        /**
         * Returns control panel navigation tabs config
         * @returns {Array.<Object>}
         */
        function getControlPanelConfig() {
            return [{
                tabName: 'Logs',
                uiRoute: 'app.control-panel.logs'
            }];
        }

        /**
         * Returns identity navigation tabs config
         * @returns {Array.<Object>}
         */
        function getIdentityConfig() {
            var config = [{
                tabName: 'Users',
                uiRoute: 'app.identity.users',
                capability: 'identity.users'
            }, {
                tabName: 'Groups',
                uiRoute: 'app.identity.groups',
                capability: 'identity.groups'
            }];

            if (ConfigService.isStagingMode()) {
                config.push({
                    tabName: 'IDP',
                    uiRoute: 'app.identity.idp',
                    capability: 'identity.idp'
                });
            }

            return config;
        }

        /**
         * Returns nuclio navigation tabs config
         * @returns {Array.<Object>}
         */
        function getNuclioConfig() {
            var config = [{
                tabName: 'Projects',
                uiRoute: 'app.nuclio.projects',
                capability: 'nuclio.projects'
            }, {
                tabName: 'Welcome',
                uiRoute: 'app.nuclio.welcome',
                capability: 'nuclio.welcome'
            }, {
                tabName: 'Functions',
                uiRoute: 'app.nuclio.functions',
                capability: 'nuclio.functions'
            }];

            return config;
        }

        /**
         * Returns events navigation tabs config
         * @returns {Array.<Object>}
         */
        function getEventsConfig() {
            var config = [{
                tabName: 'Event Log',
                uiRoute: 'app.events.event-log',
                capability: 'events.eventLog'
            }, {
                tabName: 'Alerts',
                uiRoute: 'app.events.alerts',
                capability: 'events.alerts'
            }];

            if (ConfigService.isStagingMode()) {
                config.push({
                    tabName: 'Escalation',
                    uiRoute: 'app.events.escalation',
                    capability: 'events.escalations'
                }, {
                    tabName: 'Tasks',
                    uiRoute: 'app.events.tasks',
                    capability: 'events.tasks'
                });
            }

            return config;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    SearchHelperService.$inject = ['lodash'];
    angular.module('iguazio.dashboard-controls').factory('SearchHelperService', SearchHelperService);

    function SearchHelperService(lodash) {
        return {
            makeSearch: makeSearch
        };

        //
        // Public methods
        //

        /**
         * Perform search of data based on text query
         * @param {string} searchQuery - text query entered to a search input
         * @param {Array.<Object>} data - array of data
         * @param {Array.<string>} pathsForSearchArray - array of keys in which search will be made
         * @param {boolean} isHierarchical - flag which indicates if passed data has hierarchical structure
         * @param {string} ruleType - string representing the type of rule resource
         * @param {Object} searchStates
         */
        function makeSearch(searchQuery, data, pathsForSearchArray, isHierarchical, ruleType, searchStates) {
            searchStates.searchNotFound = false;
            searchStates.searchInProgress = false;

            if (isHierarchical) {
                data = data.ui.children;
            } else {
                ruleType = '';
            }
            if (searchQuery === '') {
                showAllChildren(data);
            } else if (angular.isString(searchQuery)) {
                searchStates.searchNotFound = true;
                searchStates.searchInProgress = true;
                findBySearchQuery(searchQuery, data, pathsForSearchArray, isHierarchical, ruleType, searchStates);
            }
        }

        //
        // Private methods
        //

        /**
         * Loop through all given data to show/hide them depending on query match criteria (recursively)
         * @param {string} searchQuery - text query entered to a search input
         * @param {Array.<Object>} children - array of child data
         * @param {Array.<string>} pathsForSearch - array of strings, representing data's properties keys to search from
         * @param {boolean} isHierarchical - flag which indicates if passed data has hierarchical structure
         * @param {string} ruleType - string representing the type of rule resource
         * @param {Object} searchStates
         */
        function findBySearchQuery(searchQuery, children, pathsForSearch, isHierarchical, ruleType, searchStates) {
            angular.forEach(children, function (child) {
                // Search by text in data without children data only
                if (angular.isString(child.type) && child.type !== ruleType && isHierarchical) {
                    // Hide all parent data while search among children and proceed recursively
                    child.ui.isFitQuery = false;
                    findBySearchQuery(searchQuery, child.ui.children, pathsForSearch, isHierarchical, ruleType, searchStates);
                } else {
                    showRelevantItem(searchQuery, child, pathsForSearch, searchStates);
                }
            });
        }

        /**
         * Loop through all given data's properties and show/hide current data depending on query match criteria
         * @param {string} searchQuery - query entered to a search input
         * @param {Object} dataItem - current item
         * @param {Array} pathsForSearch - array of strings, representing paths to item's properties to search from
         * @param {Object} searchStates
         */
        function showRelevantItem(searchQuery, dataItem, pathsForSearch, searchStates) {
            var stringValuesArray = [];

            angular.forEach(pathsForSearch, function (pathForSearch) {
                getStringValuesFromItem(lodash.get(dataItem, pathForSearch), stringValuesArray);
            });

            // If at least one value in item's properties string values matched - show current item and all its direct ancestors chain
            dataItem.ui.isFitQuery = stringValuesArray.some(function (value) {
                return lodash.includes(value.toLowerCase(), searchQuery.toLowerCase());
            });

            if (dataItem.ui.isFitQuery) {
                searchStates.searchNotFound = false;
                showAllParents(dataItem);
            }
        }

        /**
         * Get all current item's properties string values and push to stringValuesArray (recursively)
         * @param {string} itemPropertyValue - item's attribute value
         * @param {Array} stringValuesArray - array to collect current item's all properties string values
         */
        function getStringValuesFromItem(itemPropertyValue, stringValuesArray) {
            if (angular.isObject(itemPropertyValue)) {
                angular.forEach(itemPropertyValue, function (value) {
                    getStringValuesFromItem(value, stringValuesArray);
                });
            } else if (angular.isString(itemPropertyValue) && itemPropertyValue.length > 0 || angular.isNumber(itemPropertyValue)) {
                stringValuesArray.push(itemPropertyValue.toString());
            }

            return stringValuesArray;
        }

        /**
         * Show item's all direct ancestors chain (recursively)
         * @param {Object} dataItem - current item
         */
        function showAllParents(dataItem) {
            var parent = dataItem.ui.parent;
            if (angular.isDefined(parent)) {
                parent.ui.isFitQuery = true;
                showAllParents(parent);
            }
        }

        /**
         * Show all data item's children chain (recursively)
         * @param {Array.<Object>} data - child items
         */
        function showAllChildren(data) {
            angular.forEach(data, function (value) {
                var children = value.ui.children;
                value.ui.isFitQuery = true;
                if (!lodash.isEmpty(children)) {
                    showAllChildren(children);
                }
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzSearchInputController.$inject = ['$scope', '$timeout', 'lodash', 'SearchHelperService'];
    angular.module('iguazio.dashboard-controls').component('igzSearchInput', {
        bindings: {
            dataSet: '<',
            searchKeys: '<',
            searchStates: '<',
            searchCallback: '&?',
            isSearchHierarchically: '@?',
            placeholder: '@',
            type: '@?',
            ruleType: '@?',
            searchType: '@?'
        },
        templateUrl: 'search-input/search-input.tpl.html',
        controller: IgzSearchInputController
    });

    function IgzSearchInputController($scope, $timeout, lodash, SearchHelperService) {
        var ctrl = this;

        ctrl.isSearchHierarchically = String(ctrl.isSearchHierarchically) === 'true';
        ctrl.searchQuery = '';

        ctrl.$onInit = onInit;
        ctrl.onPressEnter = onPressEnter;
        ctrl.clearInputField = clearInputField;

        //
        // Hook method
        //

        /**
         * Initialization method
         */
        function onInit() {
            ctrl.searchStates.searchNotFound = false;
            ctrl.searchStates.searchInProgress = false;
            if (angular.isUndefined(ctrl.searchType)) {
                ctrl.searchType = 'infoPage';
            }
            $scope.$watch('$ctrl.searchQuery', onChangeSearchQuery);
            $scope.$on('search-input_refresh-search', onDataChanged);
            $scope.$on('search-input_reset', resetSearch);
        }

        //
        // Public methods
        //

        /**
         * Initializes search on press enter
         * @param {Event} e
         */
        function onPressEnter(e) {
            if (e.keyCode === 13) {
                makeSearch();
            }
        }

        /**
         * Clear search input field
         */
        function clearInputField() {
            ctrl.searchQuery = '';
        }

        //
        // Private methods
        //

        /**
         * Calls service method for search
         */
        function makeSearch() {
            if (angular.isFunction(ctrl.searchCallback)) {

                // call custom search method
                ctrl.searchCallback(lodash.pick(ctrl, ['searchQuery', 'dataSet', 'searchKeys', 'isSearchHierarchically', 'ruleType', 'searchStates']));
            }

            if (angular.isUndefined(ctrl.type)) {

                // default search functionality
                SearchHelperService.makeSearch(ctrl.searchQuery, ctrl.dataSet, ctrl.searchKeys, ctrl.isSearchHierarchically, ctrl.ruleType, ctrl.searchStates);
            }
        }

        /**
         * Tracks input changing and initializes search
         */
        function onChangeSearchQuery(newValue, oldValue) {
            if (angular.isDefined(newValue) && newValue !== oldValue) {
                makeSearch();
            }
        }

        /**
         * Initializes search when all html has been rendered
         */
        function onDataChanged() {
            $timeout(makeSearch);
        }

        /**
         * Resets search query and initializes search
         */
        function resetSearch() {
            ctrl.searchQuery = '';
            $timeout(makeSearch);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').directive('igzShowHideSearchItem', igzShowHideSearchItem);

    function igzShowHideSearchItem() {
        return {
            restrict: 'A',
            scope: {
                dataItem: '=igzShowHideSearchItem'
            },
            link: link
        };

        function link(scope, element) {
            activate();

            //
            // Private methods
            //

            /**
             * Constructor method
             */
            function activate() {
                scope.$watch('dataItem.ui.isFitQuery', changeVisibility);
            }

            /**
             * Method sets display property of element to false if it doesn't fit the query in search otherwise removes these property
             * @param {boolean} newValue - value displays if current element fit search query
             */
            function changeVisibility(newValue) {
                var displayValue = newValue === false ? 'none' : '';
                element.css('display', displayValue);
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzSliderInputBlockController.$inject = ['$rootScope', '$scope', '$timeout', 'lodash', 'ConvertorService'];
    angular.module('iguazio.dashboard-controls').component('igzSliderInputBlock', {
        bindings: {
            measureUnits: '<?',
            sliderConfig: '<',
            sliderBlockUpdatingBroadcast: '@'
        },
        templateUrl: 'common/slider-input-block/slider-input-block.tpl.html',
        controller: IgzSliderInputBlockController
    });

    function IgzSliderInputBlockController($rootScope, $scope, $timeout, lodash, ConvertorService) {
        var ctrl = this;

        var defaultMeasureUnits = [{
            pow: 1,
            name: 'KB/s'
        }, {
            pow: 2,
            name: 'MB/s'
        }, {
            pow: 3,
            name: 'GB/s'
        }];

        ctrl.$onInit = onInit;

        ctrl.changeTrafficUnit = changeTrafficUnit;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {

            // Set default measureUnits if undefined
            if (angular.isUndefined(ctrl.measureUnits)) {
                ctrl.measureUnits = defaultMeasureUnits;
            }

            $scope.$on(ctrl.sliderBlockUpdatingBroadcast, setData);

            // Bind needed callbacks to configuration objects with updated `ctrl.selectedData` values (for rz-slider library usage)
            ctrl.sliderConfig.options.onEnd = setValue;
            ctrl.sliderConfig.options.onChange = checkIfUnlimited;

            ctrl.selectedItem = lodash.find(ctrl.measureUnits, ['name', ctrl.sliderConfig.unitLabel]);

            // Update data with values from external scope
            fillRange();
        }

        //
        // Public methods
        //

        /**
         * Method changes measurement unit
         * @param {Object} trafficUnit - selected measurement unit value
         */
        function changeTrafficUnit(trafficUnit) {
            ctrl.sliderConfig.unitLabel = trafficUnit.name;
            ctrl.sliderConfig.pow = trafficUnit.pow;

            setValue();
        }

        //
        // Private methods
        //

        /**
         * Method checks current value in slider. If it's maximum available then 'U/L'(unlimited) sets in label which displays data.
         * If it's not maximum - label sets with new value.
         */
        function checkIfUnlimited() {
            ctrl.sliderConfig.valueLabel = ctrl.sliderConfig.value === ctrl.sliderConfig.options.ceil ? 'U/L' : ctrl.sliderConfig.value;

            $timeout(function () {
                $rootScope.$broadcast('rzSliderForceRender');
            });
        }

        /**
         * Update slider data with values from external scope
         */
        function fillRange() {
            if (ctrl.selectedData) {
                var result = ConvertorService.getConvertedBytes(ctrl.selectedData[ctrl.sliderConfig.options.id]);

                ctrl.sliderConfig.value = result.value;
                ctrl.sliderConfig.valueLabel = result.value;
                ctrl.sliderConfig.unitLabel = result.label;
                ctrl.sliderConfig.pow = result.pow;

                ctrl.selectedItem = lodash.find(defaultMeasureUnits, ['name', ctrl.sliderConfig.unitLabel]);

                checkIfUnlimited();
            }
        }

        /**
         * Set slider data with a value passed through broadcast.
         * Set current selected rule to bind data properly.
         * @param {Object} event - triggering event
         * @param {Object} data - passed data
         */
        function setData(event, data) {
            ctrl.selectedData = data.item.attr;

            fillRange();
        }

        /**
         * Method sets new value in bytes
         */
        function setValue() {
            ctrl.selectedData[ctrl.sliderConfig.options.id] = ctrl.sliderConfig.value === ctrl.sliderConfig.options.ceil ? 0 : ctrl.sliderConfig.value * Math.pow(1024, ctrl.sliderConfig.pow);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').component('igzSortDropdown', {
        bindings: {
            sortOptions: '<',
            updateDataCallback: '<'
        },
        templateUrl: 'sort-dropdown/sort-dropdown.tpl.html',
        controller: IgzSortDropdownController
    });

    function IgzSortDropdownController() {
        var ctrl = this;

        ctrl.getItemClass = getItemClass;
        ctrl.toggleSortingOrder = toggleSortingOrder;

        //
        // Public methods
        //

        /**
         * Returns item's class attribute
         * @param {boolean} isFieldActive - state of item
         * @returns {string}
         */
        function getItemClass(isFieldActive) {
            return isFieldActive ? 'active-item' : '';
        }

        /**
         * Toggles sorting order for files
         * @param {string} option - attribute to sort by
         */
        function toggleSortingOrder(option) {
            if (angular.isFunction(ctrl.updateDataCallback)) {
                ctrl.updateDataCallback(option);
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzSplashScreenController.$inject = ['$scope', '$state'];
    angular.module('iguazio.dashboard-controls').component('igzSplashScreen', {
        bindings: {
            isSplashShowed: '<'
        },
        templateUrl: 'splash-screen/splash-screen.tpl.html',
        controller: IgzSplashScreenController
    });

    function IgzSplashScreenController($scope, $state) {
        var ctrl = this;

        // public properties
        ctrl.isLoading = true;
        ctrl.isAlertShowing = false;
        ctrl.textToDisplay = 'Loading…';

        ctrl.$onInit = onInit;

        // public methods
        ctrl.refreshPage = refreshPage;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            $scope.$on('splash-screen_show-error', showError);
            $scope.$on('browse-action_change-loading-text', changeLoadingText);
        }

        //
        // Public methods
        //

        /**
         * Sends broadcast to refresh browse page
         */
        function refreshPage() {
            ctrl.isLoading = true;
            ctrl.isAlertShowing = false;

            $state.reload();
        }

        //
        // Private methods
        //

        /**
         * Changes displayed text on loading spinner
         * @param {Object} event - broadcast event
         * @param {Object} data - broadcast data with text to be displayed
         */
        function changeLoadingText(event, data) {
            ctrl.textToDisplay = data.textToDisplay;
        }

        /**
         * Shows error text
         * @param {Object} event - native broadcast event
         * @param {string} data - broadcast data
         */
        function showError(event, data) {
            if (angular.isDefined(data.textToDisplay)) {
                ctrl.textToDisplay = data.textToDisplay;
            }

            if (angular.isDefined(data.alertText)) {
                ctrl.alertText = data.alertText;
            }

            ctrl.isLoading = false;
            ctrl.isAlertShowing = true;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    /**
     * compareInputValue: used if there are two field that should be equal (password and confirm password)
     * fieldType: input, textarea or password
     * formObject: object of HTML form
     * hideCounter: should be counter of remaining symbols for the field visible or not
     * inputId: string that should be assigned to id attribute
     * inputModelOptions: custom options for ng-model-options
     * inputName: name attribute of an input
     * inputValue: data model
     * itemBlurCallback: callback for onBlur event
     * itemFocusCallback: callback for onFocus event
     * isDataRevert: should incorrect value be immediately replaced by a previous correct one
     * isDisabled: is input should be disabled
     * isFocused: should input be focused when screen is displayed
     * onlyValidCharacters: allow only that characters which passed regex pattern
     * placeholderText: text that is displayed when input is empty
     * readOnly: is input should be readonly
     * spellcheck: disable spell check for some field, for example input for base64 string
     * updateDataCallback: triggered when input was changed by a user, added whn two-way binding was replased with one-way
     * updateDataField: field name for updateDataCallback
     * validationIsRequired: input can't be empty
     * validationMaxLength: value should be shorter or equal this value
     * validationPattern: validation with regex
     */

    IgzValidatingInputFieldController.$inject = ['$element', '$timeout', '$window', 'lodash', 'EventHelperService', 'FormValidationService'];
    angular.module('iguazio.dashboard-controls').component('igzValidatingInputField', {
        bindings: {
            compareInputValue: '<?',
            enterCallback: '<?',
            fieldType: '@',
            formObject: '<',
            hideCounter: '@?',
            inputIcon: '@',
            inputModelOptions: '<?',
            inputName: '@',
            inputValue: '<',
            isDisabled: '<?',
            isDataRevert: '@?',
            isFocused: '<?',
            itemBlurCallback: '&?',
            itemFocusCallback: '&?',
            onBlur: '&?',
            onlyValidCharacters: '@?',
            placeholderText: '@',
            readOnly: '<?',
            spellcheck: '@?',
            updateDataCallback: '&?',
            updateDataField: '@?',
            validationIsRequired: '@',
            validationMaxLength: '@',
            validationPattern: '<',
            isClearIcon: '<?'
        },
        templateUrl: 'validating-input-field/validating-input-field.tpl.html',
        controller: IgzValidatingInputFieldController
    });

    function IgzValidatingInputFieldController($element, $timeout, $window, lodash, EventHelperService, FormValidationService) {
        var ctrl = this;

        var defaultInputModelOptions = {
            updateOn: 'default blur',
            debounce: {
                'default': 1000,
                'blur': 0
            },
            allowInvalid: true
        };

        ctrl.data = '';
        ctrl.inputFocused = false;
        ctrl.startValue = '';

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;
        ctrl.$postLink = postLink;

        ctrl.getRemainingSymbolsCounter = getRemainingSymbolsCounter;
        ctrl.isFieldInvalid = isFieldInvalid;
        ctrl.isCounterVisible = isCounterVisible;
        ctrl.focusInput = focusInput;
        ctrl.keyDown = keyDown;
        ctrl.unfocusInput = unfocusInput;
        ctrl.updateInputValue = updateInputValue;
        ctrl.clearInputField = clearInputField;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            if (!lodash.isNil(ctrl.disabled)) {
                ctrl.disableField = ctrl.disabled;
            }

            ctrl.inputModelOptions = lodash.defaultsDeep(ctrl.inputModelOptions || {}, defaultInputModelOptions);

            ctrl.inputFocused = ctrl.isFocused;
            ctrl.spellcheck = ctrl.spellcheck || 'true';

            ctrl.data = angular.copy(lodash.defaultTo(ctrl.inputValue, ''));
            ctrl.startValue = angular.copy(ctrl.inputValue);
        }

        /**
         * Method called after initialization
         */
        function postLink() {
            if (ctrl.isFocused) {

                // check is this input field is in dialog
                if (angular.isDefined($element.closest('.ngdialog')[0])) {
                    angular.element($window).on('animationend', function (event) {

                        if (event.originalEvent.animationName === 'ngdialog-fadein' && event.target.className === 'ngdialog-content') {
                            $timeout(function () {
                                $element.find('.field')[0].focus();
                                angular.element($window).off('animationend');
                            }, 300);
                        }
                    });
                } else {
                    $timeout(function () {
                        $element.find('.field')[0].focus();
                    });
                }
            }
        }

        /**
         * Destructor
         */
        function onDestroy() {
            angular.element($window).off('animationend');
        }

        /**
         * onChange hook
         * @param {Object} changes
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.inputValue)) {
                if (!changes.inputValue.isFirstChange()) {
                    ctrl.data = angular.copy(changes.inputValue.currentValue);
                    ctrl.startValue = angular.copy(ctrl.inputValue);
                }
            }

            if (angular.isDefined(changes.isFocused)) {
                if (!changes.isFocused.isFirstChange()) {
                    $timeout(function () {
                        $element.find('.field')[0].focus();
                    });
                }
            }
        }

        //
        // Public methods
        //

        /**
         * Get counter of the remaining symbols for the field
         * @returns {number}
         */
        function getRemainingSymbolsCounter() {
            if (ctrl.formObject) {
                var maxLength = parseInt(ctrl.validationMaxLength);
                var inputViewValue = ctrl.formObject[ctrl.inputName].$viewValue;

                return maxLength >= 0 && inputViewValue ? (maxLength - inputViewValue.length).toString() : null;
            }
        }

        /**
         * Check whether the field is invalid.
         * Do not validate field if onlyValidCharacters parameter was passed.
         * @returns {boolean}
         */
        function isFieldInvalid() {
            return !ctrl.onlyValidCharacters ? FormValidationService.isShowFieldInvalidState(ctrl.formObject, ctrl.inputName) : false;
        }

        /**
         * Check whether the counter should be visible
         * @returns {boolean}
         */
        function isCounterVisible() {
            return lodash.isNil(ctrl.hideCounter) || ctrl.hideCounter === 'false' ? true : false;
        }

        /**
         * Method to make input unfocused
         */
        function focusInput() {
            ctrl.inputFocused = true;
            if (angular.isFunction(ctrl.itemFocusCallback)) {
                ctrl.itemFocusCallback();
            }
        }

        /**
         * Method which have been called from 'keyDown' event
         * @param {Object} event - native event object
         */
        function keyDown(event) {
            if (angular.isDefined(ctrl.enterCallback) && event.keyCode === EventHelperService.ENTER) {
                $timeout(ctrl.enterCallback);
            }
        }

        /**
         * Method to make input unfocused
         */
        function unfocusInput() {
            ctrl.inputFocused = false;

            // If 'data revert' option is enabled - set or revert outer model value
            setOrRevertInputValue();
        }

        /**
         * Updates outer model value on inner model value change
         * Used for `ng-change` directive
         */
        function updateInputValue() {
            if (angular.isDefined(ctrl.data)) {
                ctrl.inputValue = angular.isString(ctrl.data) ? ctrl.data.trim() : ctrl.data;
            }

            if (angular.isDefined(ctrl.updateDataCallback)) {
                ctrl.updateDataCallback({ newData: ctrl.inputValue, field: angular.isDefined(ctrl.updateDataField) ? ctrl.updateDataField : ctrl.inputName });
            }
        }

        /**
         * Clear search input field
         */
        function clearInputField() {
            ctrl.data = '';
            updateInputValue();
        }

        //
        // Private methods
        //

        /**
         * Sets or reverts outer model value
         */
        function setOrRevertInputValue() {
            $timeout(function () {
                if (ctrl.isDataRevert === 'true') {

                    // If input is invalid - inner model value is set to undefined by Angular
                    if (angular.isDefined(ctrl.data) && ctrl.startValue !== Number(ctrl.data)) {
                        ctrl.inputValue = angular.isString(ctrl.data) ? ctrl.data.trim() : ctrl.data;
                        if (angular.isFunction(ctrl.itemBlurCallback)) {
                            ctrl.itemBlurCallback({ inputValue: ctrl.inputValue });
                        }
                        ctrl.startValue = Number(ctrl.data);
                    } else {

                        // Revert input value; Outer model value just does not change
                        ctrl.data = ctrl.inputValue;
                        if (angular.isFunction(ctrl.onBlur)) {
                            ctrl.onBlur();
                        }
                    }
                }
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzActionItemMore.$inject = ['$element', '$document', '$scope', 'DialogsService'];
    angular.module('iguazio.dashboard-controls').component('igzActionItemMore', {
        bindings: {
            actions: '<?'
        },
        templateUrl: 'action-item/action-item-more/action-item-more.tpl.html',
        controller: IgzActionItemMore,
        transclude: true
    });

    function IgzActionItemMore($element, $document, $scope, DialogsService) {
        var ctrl = this;

        ctrl.isDropdownShown = false;

        ctrl.toggleTemplate = toggleTemplate;

        //
        // Public methods
        //

        /**
         * Shows/hides sub-template
         */
        function toggleTemplate() {
            ctrl.isDropdownShown = !ctrl.isDropdownShown;
            if (ctrl.isDropdownShown) {
                attachDocumentEvent();
            } else {
                detachDocumentEvent();
            }
        }

        //
        // Private methods
        //

        /**
         * Attaches on click event handler to the document
         */
        function attachDocumentEvent() {
            $document.on('click', hideSubtemplate);
        }

        /**
         * Removes on click event handler attached to the document
         */
        function detachDocumentEvent() {
            $document.off('click', hideSubtemplate);
        }

        /**
         * Hides sub-template dropdown when user clicks outside it
         * @param {MouseEvent} event
         */
        function hideSubtemplate(event) {
            $scope.$apply(function () {
                if (event.target !== $element[0] && $element.find(event.target).length === 0) {
                    ctrl.isDropdownShown = false;
                    detachDocumentEvent();
                }
            });
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').component('igzActionItemRefresh', {
        bindings: {
            refresh: '&'
        },
        templateUrl: 'action-item/action-item-refresh/action-item-refresh.tpl.html'
    });
})();
'use strict';

(function () {
    'use strict';

    IgzInfoPageActionsBarController.$inject = ['$scope'];
    angular.module('iguazio.dashboard-controls').component('igzInfoPageActionsBar', {
        bindings: {
            watchId: '@?'
        },
        templateUrl: 'info-page/info-page-actions-bar/info-page-actions-bar.tpl.html',
        transclude: true,
        controller: IgzInfoPageActionsBarController
    });

    function IgzInfoPageActionsBarController($scope) {
        var ctrl = this;

        ctrl.isUpperPaneShowed = false;
        ctrl.isFiltersShowed = false;
        ctrl.isInfoPaneShowed = false;

        ctrl.$onInit = onInit;

        //
        // Hook methods
        //

        /**
         * Init method
         */
        function onInit() {
            var watchId = angular.isDefined(ctrl.watchId) ? '-' + ctrl.watchId : '';

            $scope.$on('info-page-upper-pane_toggle-start' + watchId, onUpperPaneToggleStart);
            $scope.$on('info-page-filters_toggle-start' + watchId, onFiltersPaneToggleStart);
            $scope.$on('info-page-pane_toggle-start' + watchId, onInfoPaneToggleStart);
        }

        //
        // Private methods
        //

        /**
         * Upper pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents upper pane state
         */
        function onUpperPaneToggleStart(e, isShown) {
            ctrl.isUpperPaneShowed = isShown;
        }

        /**
         * Filters pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents filters pane state
         */
        function onFiltersPaneToggleStart(e, isShown) {
            ctrl.isFiltersShowed = isShown;
        }

        /**
         * Info pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents info pane state
         */
        function onInfoPaneToggleStart(e, isShown) {
            ctrl.isInfoPaneShowed = isShown;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzInfoPageContentController.$inject = ['$scope', '$timeout', '$window', '$element'];
    angular.module('iguazio.dashboard-controls').component('igzInfoPageContent', {
        bindings: {
            scrolled: '<',
            watchId: '@?'
        },
        templateUrl: 'info-page/info-page-content/info-page-content.tpl.html',
        transclude: true,
        controller: IgzInfoPageContentController
    });

    function IgzInfoPageContentController($scope, $timeout, $window, $element) {
        var ctrl = this;

        ctrl.isFiltersShowed = false;
        ctrl.isInfoPaneShowed = false;

        // Config for horizontal scrollbar on containers view
        ctrl.scrollConfigHorizontal = {
            axis: 'x',
            scrollInertia: 0
        };

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;

        //
        // Hook methods
        //

        /**
         * Init method
         */
        function onInit() {
            var watchId = angular.isDefined(ctrl.watchId) ? '-' + ctrl.watchId : '';

            $scope.$on('info-page-upper-pane_toggle-start' + watchId, onUpperPaneToggleStart);
            $scope.$on('info-page-filters_toggle-start' + watchId, onFiltersPaneToggleStart);
            $scope.$on('info-page-pane_toggle-start' + watchId, onInfoPaneToggleStart);
            $scope.$on('info-page-pane_toggled', dispatchResize);
        }

        /**
         * Linking method
         */
        function postLink() {
            $timeout(function () {
                manageHorizontalScroll();

                $scope.$on('info-page-filters_toggled', manageHorizontalScroll);

                $scope.$on('info-page-pane_toggled', manageHorizontalScroll);

                $scope.$on('igzWatchWindowResize::resize', manageHorizontalScroll);
            });
        }

        //
        // Private methods
        //

        /**
         * Manages x-scrollbar behavior
         * Needed to get rid of accidental wrong content width calculations made by 'ng-scrollbars' library
         * We just control x-scrollbar with lib's native enable/disable methods
         */
        function manageHorizontalScroll() {
            var $scrollXContainer = $element.find('.igz-scrollable-container.horizontal').first();
            var contentWrapper = $element.find('.igz-info-page-content-wrapper').first();

            if ($scrollXContainer.length && contentWrapper.width() < 946) {
                $scrollXContainer.mCustomScrollbar('update');
            } else if ($scrollXContainer.length) {
                $scrollXContainer.mCustomScrollbar('disable', true);
                $element.find('.mCSB_container').first().width('100%');
            }
        }

        /**
         * Upper pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents upper pane state
         */
        function onUpperPaneToggleStart(e, isShown) {
            ctrl.isUpperPaneShowed = isShown;
        }

        /**
         * Filters pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents filters pane state
         */
        function onFiltersPaneToggleStart(e, isShown) {
            ctrl.isFiltersShowed = isShown;
        }

        /**
         * Info pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents info pane state
         */
        function onInfoPaneToggleStart(e, isShown) {
            ctrl.isInfoPaneShowed = isShown;
        }

        /**
         * Updates Ui-Layout library's containers size
         */
        function dispatchResize() {
            $timeout(function () {
                $window.dispatchEvent(new Event('resize'));
            }, 0);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    IgzInfoPageFiltersController.$inject = ['$rootScope', '$scope', '$animate', '$element', 'EventHelperService'];
    angular.module('iguazio.dashboard-controls').component('igzInfoPageFilters', {
        bindings: {
            isFiltersShowed: '<',
            changeStateCallback: '&',
            toggleMethod: '&',
            resetFilters: '&?',
            applyFilters: '&?',
            getBadgeValue: '&?',
            watchId: '@?'
        },
        templateUrl: 'info-page/info-page-filters/info-page-filters.tpl.html',
        transclude: true,
        controller: IgzInfoPageFiltersController
    });

    function IgzInfoPageFiltersController($rootScope, $scope, $animate, $element, EventHelperService) {
        var ctrl = this;

        var appliedFiltersCount = 0;

        ctrl.isUpperPaneShowed = false;
        ctrl.scrollbarConfig = {
            callbacks: {
                whileScrolling: whileScrolling
            }
        };

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;

        ctrl.onApplyFilters = onApplyFilters;
        ctrl.onResetFilters = onResetFilters;
        ctrl.isShowFooterButtons = isShowFooterButtons;

        //
        // Hook methods
        //

        /**
         * Init method
         */
        function onInit() {
            var watchId = angular.isDefined(ctrl.watchId) ? '-' + ctrl.watchId : '';

            ctrl.getBadgeValue = ctrl.getBadgeValue || getBadgeValue;

            $scope.$on('info-page-filters_change-badge', onChangeBadge);
            $scope.$on('info-page-upper-pane_toggle-start' + watchId, onUpperPaneToggleStart);
            $scope.$on('info-page-pane_toggle-start' + watchId, hideIfInfoPaneOpened);
        }

        /**
         * Bindings changes watcher method
         */
        function onChanges(changes) {
            if (angular.isDefined(changes.isFiltersShowed)) {
                reportStateBetweenPanes(changes.isFiltersShowed.currentValue);
            }
        }

        //
        // Public methods
        //

        /**
         * Handles mouse click on 'Apply' button
         * @param {Object} event
         */
        function onApplyFilters(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                $rootScope.$broadcast('info-page-filters_on-apply');
                if (angular.isFunction(ctrl.applyFilters)) {
                    ctrl.applyFilters();
                }
            }
        }

        /**
         * Handles mouse click on 'Reset' button
         * @param {Object} event
         */
        function onResetFilters(event) {
            if (angular.isUndefined(event) || event.keyCode === EventHelperService.ENTER) {
                $rootScope.$broadcast('info-page-filters_on-reset');
                if (angular.isFunction(ctrl.resetFilters)) {
                    ctrl.resetFilters();
                }
            }
        }

        /**
         * Checks whether the footer buttons is shown
         * @returns {boolean}
         */
        function isShowFooterButtons() {
            return angular.isFunction(ctrl.resetFilters) || angular.isFunction(ctrl.applyFilters);
        }

        //
        // Private methods
        //

        /**
         * Returns a quantity of applied filters
         * @returns {number}
         */
        function getBadgeValue() {
            return appliedFiltersCount;
        }

        /**
         * Changes count of applied filters on badge
         * @param {Event} event
         * @param {number} count
         */
        function onChangeBadge(event, count) {
            appliedFiltersCount = Math.max(appliedFiltersCount + count, 0);
        }

        /**
         * Upper pane toggle start $broadcast listener
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents upper pane state
         */
        function onUpperPaneToggleStart(e, isShown) {
            ctrl.isUpperPaneShowed = isShown;
        }

        /**
         * Hides filters pane if filters pane has been opened
         * @param {Object} e - broadcast event
         * @param {boolean} isShown - represents pane state
         */
        function hideIfInfoPaneOpened(e, isShown) {
            if (isShown) {
                ctrl.changeStateCallback({ newVal: false });
            }
        }

        /**
         * Manages communication between panes for proper interactions
         * @param {boolean} isShown - represents pane state
         */
        function reportStateBetweenPanes(isShown) {
            $rootScope.$broadcast('info-page-filters_toggle-start' + (angular.isDefined(ctrl.watchId) ? '-' + ctrl.watchId : ''), isShown);

            $animate[isShown ? 'addClass' : 'removeClass']($element.find('.info-page-filters'), 'info-page-filters-shown').then(function () {
                $rootScope.$broadcast('reload-columns');
                $rootScope.$broadcast('info-page-filters_toggled', isShown);
            });
        }

        /**
         * Callback on scroll event of ng-scrollbars directive
         */
        function whileScrolling() {
            $rootScope.$broadcast('scrollable-container_on-scrolling');
        }
    }
})();
'use strict';

(function () {
    'use strict';

    InfoPageFiltersService.$inject = ['$rootScope'];
    angular.module('iguazio.dashboard-controls').factory('InfoPageFiltersService', InfoPageFiltersService);

    function InfoPageFiltersService($rootScope) {
        return {
            changeBadge: changeBadge
        };

        /**
         * Changes a quantity of applied filters on the badge of filters pane
         * @param {number} delta
         */
        function changeBadge(delta) {
            $rootScope.$broadcast('info-page-filters_change-badge', delta);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    /**
     * Extend white background to the bottom of the view port
     */

    igzExtendBackground.$inject = ['$timeout'];
    angular.module('iguazio.dashboard-controls').directive('igzExtendBackground', igzExtendBackground);

    function igzExtendBackground($timeout) {
        return {
            restrict: 'A',
            link: link
        };

        function link(scope, element, attrs) {
            var timeout = 0;
            var containerPath = 'body';

            activate();

            //
            // Private methods
            //

            /**
             * Constructor method
             */
            function activate() {
                timeout = Number(attrs.igzExtendBackground) || 0;
                containerPath = attrs.containerPath || 'body';

                $timeout(elementMinHeight, timeout);
                scope.$on('igzWatchWindowResize::resize', elementMinHeight);
            }

            /**
             * Calculate and change element height
             */
            function elementMinHeight() {
                var container = angular.element(containerPath);
                var containerBox = container[0].getBoundingClientRect();
                var paddingBottom = parseInt(container.css('padding-bottom'), 10);
                var box = element[0].getBoundingClientRect();

                if (containerBox.height === 0) {
                    element.css('height', '100%');
                    element.css('padding-bottom', '45px');
                } else {
                    element.css('padding-bottom', '0');
                    element.css('height', containerBox.bottom + paddingBottom - box.top + 'px');
                }
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    CloseDialogService.$inject = ['$document', '$rootScope', 'lodash', 'ngDialog', 'EventHelperService'];
    angular.module('iguazio.dashboard-controls').factory('CloseDialogService', CloseDialogService);

    function CloseDialogService($document, $rootScope, lodash, ngDialog, EventHelperService) {
        var scope = $rootScope.$new();
        var isUploadImageWindowOpen = false;
        var isChangesHaveBeenMade = false;

        activate();

        return {
            toggleIsUploadImageWindowOpen: toggleIsUploadImageWindowOpen
        };

        //
        // Public methods
        //

        /**
         * Toggles flag of isUploadImageWindowOpen
         */
        function toggleIsUploadImageWindowOpen() {
            isUploadImageWindowOpen = !isUploadImageWindowOpen;
        }

        //
        // Private methods
        //

        /**
         * Constructor method
         */
        function activate() {
            scope.$on('wizard_changes-have-been-made', onChanges);
            scope.$on('text-edit_changes-have-been-made', onChanges);

            // array of the IDs of opened ndDialogs
            // will change if some ngDialog have been opened or closed
            scope.ngDialogs = ngDialog.getOpenDialogs();

            scope.$watchCollection('ngDialogs', function (newVal, oldVal) {
                if (lodash.isEmpty(oldVal) && newVal.length === 1) {
                    $document.on('keyup', onKeyUp);
                } else if (lodash.isEmpty(newVal)) {
                    $document.off('keyup', onKeyUp);

                    isChangesHaveBeenMade = false;
                }
            });
        }

        /**
         * Closes last opened dialog
         */
        function onKeyUp(event) {
            if (event.keyCode === EventHelperService.ESCAPE) {
                if (isUploadImageWindowOpen || isChangesHaveBeenMade && scope.ngDialogs.length === 1) {
                    isUploadImageWindowOpen = false;

                    $rootScope.$broadcast('close-dialog-service_close-dialog');
                } else {
                    ngDialog.close(lodash.last(scope.ngDialogs));

                    if (lodash.isEmpty(scope.ngDialogs)) {
                        $document.off('keyup', onKeyUp);
                    }
                }

                scope.$digest();
            }
        }

        /**
         * Broadcast callback which should be called when wizards has some changes
         * Sends from such wizards: new container wizard, new storage pool wizard
         * @param {Object} event - broadcast event object
         * @param {boolean} data - broadcast data
         */
        function onChanges(event, data) {
            isChangesHaveBeenMade = data;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').factory('CommonTableService', CommonTableService);

    function CommonTableService() {
        return {
            isColumnSorted: isColumnSorted
        };

        //
        // Public methods
        //

        /**
         * Checks whether the passed column name equals the last sorted column name
         * @param {string} columnName
         * @param {string} lastSortedColumnName
         * @param {boolean} isReversed
         * @return {{sorted: boolean, reversed: boolean}} - an object with css class names suitable for `ng-class`
         */
        function isColumnSorted(columnName, lastSortedColumnName, isReversed) {
            var classes = {
                'sorted': false,
                'reversed': false
            };
            if (columnName === lastSortedColumnName) {
                classes.sorted = true;
                classes.reversed = isReversed;
            }
            return classes;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    DialogsService.$inject = ['$q', 'lodash', 'ngDialog', 'FormValidationService'];
    angular.module('iguazio.dashboard-controls').factory('DialogsService', DialogsService);

    function DialogsService($q, lodash, ngDialog, FormValidationService) {
        return {
            alert: alert,
            confirm: confirm,
            customConfirm: customConfirm,
            image: image,
            oopsAlert: oopsAlert,
            prompt: prompt,
            text: text
        };

        //
        // Public methods
        //

        /**
         * Show alert message
         *
         * @param {string|Array.<string>} [alertText] - alert content
         * @param {string} [buttonText=OK] - text displayed on Ok button
         * @returns {Promise} a promise that resolves on closing dialog
         */
        function alert(alertText, buttonText) {
            buttonText = lodash.defaultTo(buttonText, 'OK');

            if (angular.isArray(alertText)) {
                alertText = alertText.length === 1 ? lodash.first(alertText) : '<ul class="error-list"><li class="error-list-item">' + alertText.join('</li><li class="error-list-item">') + '</li></ul>';
            }

            return ngDialog.open({
                template: '<div class="notification-text title igz-scrollable-container" data-ng-scrollbars>' + alertText + '</div>' + '<div class="buttons">' + '<div class="igz-button-primary" data-ng-click="closeThisDialog() || $event.stopPropagation()">' + buttonText + '</div>' + '</div>',
                plain: true
            }).closePromise;
        }

        /**
         * Show confirmation dialog
         *
         * @param {string|Object} confirmText that will be shown in pop-up
         * @param {string} confirmButton Text displayed on Confirm button
         * @param {string} [cancelButton=Cancel] Text displayed on Cancel button
         * @param {string} type - type of popup dialog
         * @returns {Object}
         */
        function confirm(confirmText, confirmButton, cancelButton, type) {
            var confirmMessage = !lodash.isNil(type) && type === 'nuclio_alert' && lodash.isPlainObject(confirmText) ? confirmText.message : confirmText;

            if (!cancelButton) {
                cancelButton = 'Cancel';
            }

            var template = '<div class="close-button igz-icon-close" data-ng-click="closeThisDialog()"></div>' + '<div class="nuclio-alert-icon"></div><div class="notification-text title">' + confirmMessage + '</div>' + (!lodash.isNil(type) && type === 'nuclio_alert' && !lodash.isNil(confirmText.description) ? '<div class="notification-text description">' + confirmText.description + '</div>' : '') + '<div class="buttons">' + '<div class="igz-button-just-text" tabindex="0" data-ng-click="closeThisDialog(0)" data-ng-keydown="$event.keyCode === 13 && closeThisDialog(0)">' + cancelButton + '</div>' + '<div class="' + (!lodash.isNil(type) && (type === 'critical_alert' || type === 'nuclio_alert') ? 'igz-button-remove' : 'igz-button-primary') + '" tabindex="0" data-ng-click="confirm(1)" data-ng-keydown="$event.keyCode === 13 && confirm(1)">' + confirmButton + '</div>' + '</div>';

            return ngDialog.openConfirm({
                template: template,
                plain: true,
                trapFocus: false,
                className: !lodash.isNil(type) && type === 'nuclio_alert' ? 'ngdialog-theme-nuclio delete-entity-dialog-wrapper' : 'ngdialog-theme-iguazio'
            });
        }

        /**
         * Show confirmation dialog with custom number of buttons
         * @param {string} confirmText that will be shown in pop-up
         * @param {string} cancelButton Text displayed on Cancel button
         * @param {Array} actionButtons Array of action buttons
         * @returns {Object}
         */
        function customConfirm(confirmText, cancelButton, actionButtons) {
            var template = '<div class="notification-text title">' + confirmText + '</div>' + '<div class="buttons">' + '<div class="igz-button-just-text" tabindex="0" data-ng-click="closeThisDialog(-1)" data-ng-keydown="$event.keyCode === 13 && closeThisDialog(-1)">' + cancelButton + '</div>';
            lodash.each(actionButtons, function (button, index) {
                template += '<div class="igz-button-primary" tabindex="0" data-ng-click="confirm(' + index + ')" data-ng-keydown="$event.keyCode === 13 && confirm(' + index + ')">' + button + '</div>';
            });
            template += '</div>';

            return ngDialog.openConfirm({
                template: template,
                plain: true,
                trapFocus: false
            });
        }

        /**
         * Show image
         *
         * @param {string} src that will be shown in pop-up
         * @param {string} [label] actual filename to be shown in title
         * @returns {Promise}
         */
        function image(src, label) {
            label = angular.isString(label) ? label : 'Image preview:';

            return ngDialog.open({
                template: '<div class="title text-ellipsis"' + 'data-tooltip="' + label + '"' + 'data-tooltip-popup-delay="400"' + 'data-tooltip-append-to-body="true"' + 'data-tooltip-placement="bottom-left">' + label + '</div>' + '<div class="close-button igz-icon-close" data-ng-click="closeThisDialog()"></div>' + '<div class="image-preview-container">' + '<img class="image-preview" src="' + src + '" alt="You have no permissions to read the file"/></div>',
                plain: true,
                className: 'ngdialog-theme-iguazio image-dialog'
            }).closePromise;
        }

        /**
         * Show oops alert message when server is unreachable
         * @param {string} alertText that will be shown in pop-up
         * @param {string} buttonText displayed on Ok button
         * @returns {Promise}
         */
        function oopsAlert(alertText, buttonText) {
            return ngDialog.open({
                template: '<div class="header"></div><div class="notification-text">' + alertText + '</div>' + '<div class="buttons">' + '<div class="refresh-button" data-ng-click="closeThisDialog()"><span class="igz-icon-refresh"></span>' + buttonText + '</div>' + '</div>',
                plain: true,
                className: 'ngdialog-theme-iguazio oops-dialog'
            }).closePromise;
        }

        /**
         * Show confirmation dialog with input field
         *
         * @param {string} promptText that will be shown in pop-up
         * @param {string} confirmButton Text displayed on Confirm button
         * @param {string} [cancelButton='Cancel'] Text displayed on Cancel button
         * @param {string} [defaultValue=''] Value that should be shown in text input after prompt is opened
         * @param {string} [placeholder=''] Text input placeholder
         * @param {Object} [validation] Validation pattern
         * @param {boolean} required Should input be required or not
         * @returns {Object}
         */
        function prompt(promptText, confirmButton, cancelButton, defaultValue, placeholder, validation, required) {
            cancelButton = cancelButton || 'Cancel';
            placeholder = placeholder || '';
            defaultValue = defaultValue || '';

            var data = {
                value: defaultValue,
                igzDialogPromptForm: {},
                checkInput: function checkInput() {
                    if (angular.isDefined(validation) || required) {
                        data.igzDialogPromptForm.$submitted = true;
                    }
                    return data.igzDialogPromptForm.$valid;
                },
                inputValueCallback: function inputValueCallback(newData) {
                    data.value = newData;
                }
            };

            if (angular.isDefined(validation) || required) {
                lodash.assign(data, {
                    validation: validation,
                    inputName: 'promptName',
                    isShowFieldInvalidState: FormValidationService.isShowFieldInvalidState
                });
            }

            return ngDialog.open({
                template: '<div data-ng-form="ngDialogData.igzDialogPromptForm">' + '<div class="close-button igz-icon-close" data-ng-click="closeThisDialog()"></div>' + '<div class="notification-text title">' + promptText + '</div>' + '<div class="main-content">' + '<div class="field-group">' + '<div class="field-input">' + '<igz-validating-input-field data-field-type="input" ' + 'data-input-name="promptName" ' + 'data-input-value="ngDialogData.value" ' + 'data-form-object="ngDialogData.igzDialogPromptForm" ' + 'data-is-focused="true" ' + (angular.isDefined(validation) ? 'data-validation-pattern="ngDialogData.validation" ' : '') + (placeholder !== '' ? 'data-placeholder-text="' + placeholder + '" ' : '') + (required ? 'data-validation-is-required="true" ' : '') + 'data-update-data-callback="ngDialogData.inputValueCallback(newData)"' + '>' + '</igz-validating-input-field>' + (angular.isDefined(validation) ? '<div class="error-text" data-ng-show="ngDialogData.isShowFieldInvalidState(ngDialogData.igzDialogPromptForm, ngDialogData.inputName)">' + 'The input is Invalid, please try again.' + '</div>' : '') + '</div>' + '</div>' + '</div>' + '</div>' + '<div class="buttons">' + '<div class="igz-button-just-text" data-ng-click="closeThisDialog()">' + cancelButton + '</div>' + '<div class="igz-button-primary" data-ng-click="ngDialogData.checkInput() && closeThisDialog(ngDialogData.value)">' + confirmButton + '</div>' + '</div>',
                plain: true,
                data: data
            }).closePromise.then(function (dialog) {
                // if Cancel is clicked, reject the promise
                return angular.isDefined(dialog.value) ? dialog.value : $q.reject('Cancelled');
            });
        }

        /**
         * Shows text
         *
         * @param {string} content that will be shown in pop-up
         * @param {Object} [node] actual node to be shown
         * @param {function} submitData function for submitting data
         * @returns {Promise}
         */
        function text(content, node, submitData) {
            var data = {
                closeButtonText: 'Close',
                submitButtonText: 'Save',
                submitData: submitData,
                label: angular.isString(node.label) ? node.label : 'Text preview:',
                node: node,
                content: content
            };

            return ngDialog.open({
                template: '<igz-text-edit data-label="{{ngDialogData.label}}" data-content="{{ngDialogData.content}}"' + 'data-submit-button-text="{{ngDialogData.submitButtonText}}" data-submit-data="ngDialogData.submitData(newContent)"' + 'data-close-button-text="{{ngDialogData.closeButtonText}}" data-close-dialog="closeThisDialog()" data-node="ngDialogData.node">' + '</igz-text-edit>',
                plain: true,
                data: data,
                className: 'ngdialog-theme-iguazio text-edit'
            }).closePromise;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').factory('EventHelperService', EventHelperService);

    function EventHelperService() {
        return {
            BACKSPACE: 8,
            DOWN: 40,
            ENTER: 13,
            ESCAPE: 27,
            SPACE: 32,
            TABKEY: 9,
            UP: 38,
            isLeftMousePressed: isLeftMousePressed,
            isRightMousePressed: isRightMousePressed,
            isCtrlOrCmdPressed: isCtrlOrCmdPressed,
            isShiftPressed: isShiftPressed
        };

        //
        // Public methods
        //

        /**
         * Checks whether the event invoked by left mouse click
         * @param {MouseEvent} event
         * @returns {boolean}
         */
        function isLeftMousePressed(event) {
            return event.which === 1;
        }

        /**
         * Checks whether the event invoked by left mouse click
         * @param {MouseEvent} event
         * @returns {boolean}
         */
        function isRightMousePressed(event) {
            return event.which === 3;
        }

        /**
         * Checks whether Shift key was pressed when the event invoked
         * @param {MouseEvent} event
         * @returns {boolean}
         */
        function isShiftPressed(event) {
            return event.shiftKey;
        }

        /**
         * Checks whether Ctrl or Cmd key was pressed when the event invoked
         * @param {MouseEvent} event
         * @returns {boolean}
         */
        function isCtrlOrCmdPressed(event) {
            return event.ctrlKey || event.metaKey;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    FormValidationService.$inject = ['lodash'];
    angular.module('iguazio.dashboard-controls').factory('FormValidationService', FormValidationService);

    // Service with helpers methods for form validation needs
    function FormValidationService(lodash) {
        return {
            isShowFormInvalidState: isShowFormInvalidState,
            isShowFieldInvalidState: isShowFieldInvalidState,
            isShowFieldError: isShowFieldError,
            isFormValid: isFormValid,
            isFieldValid: isFieldValid
        };

        /**
         * Check if the form is in an invalid state
         * @param {Object} form - form to check
         * @returns {boolean}
         */
        function isShowFormInvalidState(form) {
            return !form ? false : lodash.some(form, function (property) {
                return property.charAt(0) !== '$' && // skip AngularJS native properties
                form[property].hasOwnProperty('$dirty') && form[property].hasOwnProperty('$invalid') && isShowFieldInvalidState(form, property);
            });
        }

        /**
         * Check if the field is in an invalid state
         * @param {Object} form - form which owns the field
         * @param {string} elementName - field name
         * @returns {boolean}
         */
        function isShowFieldInvalidState(form, elementName) {
            return !form || !form[elementName] ? false : (form.$submitted || form[elementName].$dirty) && form[elementName].$invalid;
        }

        /**
         * Check if the field has a specific error
         * @param {Object} form - form which owns the field
         * @param {string} elementName - field name
         * @param {string} errorName - error name
         * @returns {boolean}
         */
        function isShowFieldError(form, elementName, errorName) {
            return !form || !form[elementName] ? false : form[elementName].$error[errorName];
        }

        /**
         * Check if the form is valid
         * @param {Object} form - form to check
         * @returns {boolean}
         */
        function isFormValid(form) {
            return !form ? true : lodash.every(form, function (property) {
                return property.charAt(0) === '$' || // skip AngularJS native properties
                !form[property].hasOwnProperty('$valid') || isFieldValid(form, property);
            });
        }

        /**
         * Check if the field of the form is valid
         * @param {Object} form - form which owns the field
         * @param {string} elementName - name of the field to check
         * @param {boolean} validateOnSubmit - if this parameter was passed, that means next -
         * validate field only if form was submitted. Otherwise validates field all the time
         * @returns {boolean}
         */
        function isFieldValid(form, elementName, validateOnSubmit) {
            var formSubmitted = lodash.get(form, '$submitted', false);
            var elementValid = lodash.get(form, elementName + '.$valid', true);

            return validateOnSubmit && !formSubmitted || elementValid;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    /*
     * Increase/set-back scrollable mCSB_container height if needed
     * to be able to scroll it down to see dropdown hidden by container's overflow
     *
     * Usage:
     * 1) Init method with passed needed element and class selectors (inside link-function)
     * preventDropdownCutOff(element, '.dropdown-element-class', '.scrollable-element-class');
     *
     * !!!Please note that service is using "enter" and "leave" animation events of `$animate` service.
     * The following directives support these events:
     * - ngRepeat
     * - ngView
     * - ngInclude
     * - ngSwitch
     * - ngIf
     * - ngMessage
     */

    PreventDropdownCutOffService.$inject = ['$animate', '$document'];
    angular.module('iguazio.dashboard-controls').factory('PreventDropdownCutOffService', PreventDropdownCutOffService);

    function PreventDropdownCutOffService($animate, $document) {

        // Margin for the better look
        var MARGIN_BOTTOM = 15;

        return {
            preventDropdownCutOff: preventDropdownCutOff,
            resizeScrollBarContainer: resizeScrollBarContainer,
            onShowPreventDropdownCutOff: onShowPreventDropdownCutOff
        };

        //
        // Public methods
        //

        /**
         * Increase/set-back scrollable mCSB_container height if needed to be able to scroll down it to see dropdown
         * hidden by container's overflow
         * @param {Object} currentElement - dropdown directive element
         * @param {string} dropdownElementClass - dropdown menu element class selector
         * @param {?string} scrollableElementClass - scrollable container element class selector. Note that "scrollableElementClass"
         * class should be in one class together with ".mCSB_container" class
         */
        function preventDropdownCutOff(currentElement, dropdownElementClass, scrollableElementClass) {
            var dropdownElement;
            var scrollableElement;

            $animate.on('enter', currentElement, function (element, phase) {
                dropdownElement = currentElement.find(dropdownElementClass).last();

                if (dropdownElement[0] === element[0]) {
                    scrollableElement = resizeElement(currentElement, dropdownElement, scrollableElementClass, phase);
                }
            });

            $animate.on('leave', currentElement, function (element, phase) {
                if (angular.isElement(dropdownElement) && dropdownElement[0] === element[0] && phase === 'close') {
                    scrollableElement.height('auto');
                }
            });
        }

        /**
         * Resize scrollBar container('.mCSB_container') regarding target element.
         * If targetElement does not visible through cutOff then resize scrollBar container to needed height.
         * @param {Object} currentElement - contains target element
         * @param {Object} targetElement - scrollBar container should be resized regarding this element
         */
        function resizeScrollBarContainer(currentElement, targetElement) {
            var scrollbarContainer = currentElement.closest('.mCSB_container');

            scrollbarContainer.css('height', currentElement.find(targetElement).offset().top + currentElement.find(targetElement).height() + 'px');
        }

        /**
         * Increase/set-back scrollable mCSB_container height and it's parent
         * to be able to scroll down it to see dropdown hidden by container's overflow
         * should be used with ng-show
         * @param {Object} currentElement - dropdown directive element
         * @param {string} dropdownElementClass - dropdown menu element class selector
         * @param {?string} scrollableElementClass - scrollable container element class selector. Note that "scrollableElementClass"
         * class should be in one class together with ".mCSB_container" class
         */
        function onShowPreventDropdownCutOff(currentElement, dropdownElementClass, scrollableElementClass) {
            $animate.on('removeClass', currentElement, function (element, phase) {
                var dropdownElement = currentElement.find(dropdownElementClass).last();

                if (dropdownElement[0] === element[0]) {
                    resizeElement(currentElement, dropdownElement, scrollableElementClass, phase);
                }
            });
        }

        /**
         * Resize element and parent to prevent dropdown cutoff
         * @param {Object} currentElement - dropdown directive element
         * @param {Object} dropdownElement - dropdown menu directive element
         * @param {?string} scrollableElementClass - scrollable container element class selector. Note that "scrollableElementClass"
         * @param {string} phase - current phase from the event
         */
        function resizeElement(currentElement, dropdownElement, scrollableElementClass, phase) {
            var scrollableElement;
            var parentScrollableElement;

            // Set default scrollable container class if undefined
            scrollableElementClass = scrollableElementClass || '.mCSB_container';

            scrollableElement = currentElement.closest(scrollableElementClass);
            if (scrollableElement.length > 0 && (phase === 'close' || phase === 'start')) {
                parentScrollableElement = scrollableElement.parent();

                var dropDownOffsetBottom = $document.height() - dropdownElement.outerHeight(true) - dropdownElement.offset().top;
                var containerOffsetBottom = $document.height() - scrollableElement.outerHeight(true) - scrollableElement.offset().top;
                var newHeight = scrollableElement.outerHeight(true) + (containerOffsetBottom - dropDownOffsetBottom) + MARGIN_BOTTOM;

                if (dropDownOffsetBottom < containerOffsetBottom) {

                    // Set scrollableElement's height to needed value
                    scrollableElement.height(newHeight);
                    if (parentScrollableElement.height() < newHeight) {
                        parentScrollableElement.height(newHeight);
                    }
                }
            } else {
                scrollableElement.height('auto');
            }

            return scrollableElement;
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').factory('PriorityDropdownService', PriorityDropdownService);

    function PriorityDropdownService() {
        return {
            getName: getName,
            getPrioritiesArray: getPrioritiesArray
        };

        //
        // Public methods
        //

        /**
         * Gets array of priority types
         * @returns {Array}
         */
        function getPrioritiesArray() {
            return [{
                name: 'Real-time',
                type: 'realtime',
                icon: {
                    name: 'igz-icon-priority-realtime'
                }
            }, {
                name: 'High',
                type: 'high',
                icon: {
                    name: 'igz-icon-priority-high'
                }
            }, {
                name: 'Standard',
                type: 'standard',
                icon: {
                    name: 'igz-icon-priority-standard'
                }
            }, {
                name: 'Low',
                type: 'low',
                icon: {
                    name: 'igz-icon-priority-low'
                }
            }];
        }

        /**
         * Gets name of priority depends on type
         * @param {string} type
         * @returns {string}
         */
        function getName(type) {
            return type === 'realtime' ? 'Real-time' : type === 'high' ? 'High' : type === 'standard' ? 'Standard' : type === 'low' ? 'Low' : '';
        }
    }
})();
'use strict';

(function () {
    'use strict';

    ValidatingPatternsService.$inject = ['lodash'];
    angular.module('iguazio.dashboard-controls').factory('ValidatingPatternsService', ValidatingPatternsService);

    function ValidatingPatternsService(lodash) {
        return {
            boolean: /^(0|1)$/,
            container: /^(?!.*--)(?=.*[A-Za-z])[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9]$|^[A-Za-z]$/,
            email: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            float: /^\d{1,9}(\.\d{1,2})?$/,
            fullName: /^[a-zA-Z][a-zA-Z- ]*$/,
            geohash: /^[a-z0-9]*$/,
            hostName_IpAddress: /(^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$)|(^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)+([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$)/,
            id: /^[a-zA-Z0-9\-]*$/,
            ip: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
            mask: /^(((255\.){3}(255|254|252|248|240|224|192|128|0+))|((255\.){2}(255|254|252|248|240|224|192|128|0+)\.0)|((255\.)(255|254|252|248|240|224|192|128|0+)(\.0+){2})|((255|254|252|248|240|224|192|128|0+)(\.0+){3}))$/,
            name: /^[a-zA-Z0-9_]*$/,
            negativeFloat: /^[-]?\d{1,9}(\.\d{1,2})?$/,
            negativeInteger: /^[-]?(0|[1-9]\d*)$|^$/,
            noSpacesNoSpecChars: /^[A-Za-z0-9_-]*$/,
            networkName: /^[a-zA-Z0-9\.\-\()\\\/:\s]*$/,
            path: /^(\/[\w-]+)+(.[a-zA-Z]+?)$/,
            phone: /^\+?\d[\d\-]{4,17}$/,
            storage: /^[a-zA-Z0-9]+?\:\/\/[a-zA-Z0-9\_\-\.]+?\:[a-zA-Z0-9\_\-\./]+?\@[a-zA-Z0-9\_\-\.]+?$/,
            timestamp: /^(?:\d{4})-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2]\d|3[0-1])T(?:[0-1]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?((?:[+-](?:[0-1]\d|2[0-3]):[0-5]\d)|Z)?$/,
            url: /^[a-zA-Z0-9]+?\:\/\/[a-zA-Z0-9\_\-\.]+?\:[a-zA-Z0-9\_\-\.]+?\@[a-zA-Z0-9\_\-\.]+?$/,
            username: /^[a-zA-Z][-_a-zA-Z0-9]*$/,
            password: /^.{6,128}$/,
            protocolIpPortAddress: /^[a-z]{2,6}\:\/\/(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))\.(\d|[1-9]\d|1\d\d|2([0-4]\d|5[0-5]))(\:\d{1,5})?$/,
            digits: /^\+?(0|[1-9]\d*)$|^$/,
            tenantName: /^[a-zA-Z][a-zA-Z0-9_]*$/,
            functionName: /^[a-z0-9][a-z0-9.-]{0,252}$/,

            getMaxLength: getMaxLength
        };

        //
        // Public methods
        //

        /**
         * Provides maximum length of text that can be filled in input
         * @param {string} path - path to field
         * @returns {number}
         */
        function getMaxLength(path) {
            var lengths = {
                default: 128,
                cluster: {
                    description: 150
                },
                escalation: {
                    name: 40
                },
                group: {
                    description: 128
                },
                interface: {
                    alias: 40
                },
                network: {
                    name: 30,
                    description: 150,
                    subnet: 30,
                    mask: 150,
                    tag: 10
                },
                node: {
                    description: 128
                },
                container: {
                    description: 150
                },
                storagePool: {
                    name: 30,
                    description: 150,
                    url: 100,
                    username: 30
                },
                user: {
                    firstName: 30,
                    lastName: 30
                }
            };

            return lodash.get(lengths, path, lengths.default);
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').directive('igzInputBlurOnEnter', igzInputBlurOnEnter);

    function igzInputBlurOnEnter() {
        return {
            restrict: 'A',
            link: link
        };

        function link(scope, element) {
            activate();

            //
            // Private methods
            //

            /**
             * Constructor method
             */
            function activate() {
                initInput();

                scope.$on('$destroy', destructor);
            }

            /**
             * Submit Rule name input on Enter key press
             */
            function initInput() {
                element.on('keydown', blurOnEnterKey);
            }

            /**
             * Set element to blur on Enter key press
             * @param {Object} e - event
             */
            function blurOnEnterKey(e) {
                if (e.keyCode === 13) {
                    element.blur();
                }
            }

            /**
             * Destructor method
             */
            function destructor() {
                element.off('keydown', blurOnEnterKey);
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    igzInputOnlyValidCharacters.$inject = ['$timeout'];
    angular.module('iguazio.dashboard-controls').directive('igzInputOnlyValidCharacters', igzInputOnlyValidCharacters);

    function igzInputOnlyValidCharacters($timeout) {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                pattern: '=igzInputOnlyValidCharacters'
            },
            link: link
        };

        function link(scope, element, attr, ngModelCtrl) {
            var REGEXP = scope.pattern;
            var lastValidViewValue;

            activate();

            //
            // Private methods
            //

            /**
             * Constructor method
             */
            function activate() {
                $timeout(function () {
                    lastValidViewValue = ngModelCtrl.$viewValue;
                });

                ngModelCtrl.$parsers.unshift(checkForDigits);
            }

            /**
             * Checks whether entered value is valid
             * @param {string} viewValue - entered view value
             * @returns {string} the last valid entered value
             */
            function checkForDigits(viewValue) {
                if (attr.onlyValidCharacters) {
                    if (REGEXP.test(viewValue)) {

                        // Saves as valid view value if it's a not empty string
                        lastValidViewValue = viewValue === '' ? '' : Number(viewValue);
                    } else {

                        // Renders the last valid input in the field
                        ngModelCtrl.$viewValue = lastValidViewValue;
                        ngModelCtrl.$commitViewValue();
                        ngModelCtrl.$render();
                    }
                    return lastValidViewValue;
                } else {
                    return viewValue;
                }
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls').directive('igzNgScrollbarsMethods', igzNgScrollbarsMethods);

    function igzNgScrollbarsMethods() {
        return {
            restrict: 'A',
            link: link
        };

        function link(scope, element, attr) {
            activate();

            /**
             * Constructor method
             */
            function activate() {
                scope.$on('ng-scrollbars-methods_scroll-to', scrollToTarget);
            }

            /**
             * Scrolls to specified element (selected by id) inside ng-scrollbars container
             * Used in broadcast
             * @param {Object} event - broadcast event
             * @param {Object} data - broadcast data
             */
            function scrollToTarget(event, data) {

                // Check if current directive was demanded
                if (attr.igzNgScrollbarsMethods === data.scrollContainerName) {
                    element.mCustomScrollbar('scrollTo', '#' + data.target);
                }
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    igzResizableRowCells.$inject = ['$rootScope', '$timeout', 'lodash'];
    angular.module('iguazio.dashboard-controls').directive('igzResizableRowCells', igzResizableRowCells);

    function igzResizableRowCells($rootScope, $timeout, lodash) {
        return {
            restrict: 'A',
            link: link
        };

        function link(scope, element) {
            activate();

            //
            // Private methods
            //

            /**
             * Constructor
             */
            function activate() {
                scope.$on('resize-cells', resizeCells);
                scope.$on('autofit-col', autoFitColumn);

                $timeout(function () {
                    $rootScope.$broadcast('reload-columns');
                });
            }

            /**
             * Checks width of cells column auto-fit
             * @param {Object} event - broadcast event
             * @param {Object} data - information about column name
             */
            function autoFitColumn(event, data) {
                var currentCell = element.find('.' + data.colClass)[0];

                if (!lodash.isNil(currentCell)) {
                    var currentWidth = currentCell.offsetWidth;

                    // temporary set auto width to get data for auto-fit
                    currentCell.style.width = 'auto';
                    var newWidth = currentCell.offsetWidth;
                    currentCell.style.width = currentWidth + 'px';

                    if (newWidth > currentWidth) {
                        var colDifference = newWidth - currentWidth + 2;

                        if (angular.isFunction(data.callbackFunction)) {
                            data.callbackFunction(colDifference);
                        }
                    }
                }
            }

            /**
             * Resize cells according to igz-resize-table-column directive move
             * @param {Object} event - broadcast event
             * @param {Object} data - information about column name and size
             */
            function resizeCells(event, data) {

                // search for cell which should be resized
                var currentCell = element.find('.' + data.colClass)[0];
                if (!lodash.isNil(currentCell)) {
                    var nextCell = currentCell.nextElementSibling;

                    // set new value for cells width
                    currentCell.style.width = data.columnWidth;
                    nextCell.style.width = data.nextColumnWidth;
                }
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    igzResizableTableColumn.$inject = ['$document', '$rootScope', '$timeout', '$window', 'lodash'];
    angular.module('iguazio.dashboard-controls').directive('igzResizableTableColumn', igzResizableTableColumn);

    function igzResizableTableColumn($document, $rootScope, $timeout, $window, lodash) {
        IgzResizeTableController.$inject = ['$element', '$scope'];

        return {
            restrict: 'A',
            replace: true,
            scope: {
                colClass: '@'
            },
            template: '<div class="resize-block" data-ng-mousedown="resizeTable.onMouseDown($event)" data-ng-click="resizeTable.onClick($event)" data-ng-dblclick="resizeTable.onDoubleClick($event)"></div>',
            controller: IgzResizeTableController,
            controllerAs: 'resizeTable',
            bindToController: true
        };

        function IgzResizeTableController($element, $scope) {
            var vm = this;

            vm.minWidth = 100;
            vm.startPosition = 0;

            vm.onMouseDown = onMouseDown;
            vm.onClick = onClick;
            vm.onDoubleClick = onDoubleClick;

            activate();

            //
            // Public methods
            //

            /**
             * Prevents click propagation
             * @param {Object} event
             */
            function onClick(event) {
                event.stopPropagation();
            }

            /**
             * Prevents click propagation
             * @param {Object} event
             */
            function onDoubleClick(event) {

                // set min width for selected column
                if (vm.columnHeadMinWidth < vm.columnHeadWidth) {
                    var colDifference = vm.columnHeadMinWidth - vm.columnHeadWidth;
                    resizeColumn(colDifference);
                }

                // set width of the column to fit the content
                $rootScope.$broadcast('autofit-col', { colClass: vm.colClass, callbackFunction: resizeColumn });
            }

            /**
             * On mouse down handler
             * @param {Object} event
             */
            function onMouseDown(event) {

                // prevent default dragging of selected content
                event.preventDefault();
                event.stopPropagation();

                // saves start position of resize
                vm.startPosition = event.clientX;

                // adds event listeners
                $document.on('mousemove', onMouseMove);
                $document.on('mouseup', onMouseUp);

                return false;
            }

            //
            // Private methods
            //

            /**
             * Constructor
             */
            function activate() {

                // set header widths of the resizing columns
                $timeout(initColumnsWidths);

                angular.element($window).on('resize', reloadColumns);
                $scope.$on('reload-columns', reloadColumns);
                $scope.$on('$destroy', destructor);
            }

            /**
             * Destructor method
             */
            function destructor() {
                angular.element($window).off('resize', reloadColumns);
            }

            /**
             * On mouse move handler
             * @param {Object} event
             */
            function onMouseMove(event) {
                var colDifference = event.clientX - vm.startPosition;
                vm.startPosition = event.clientX;
                resetColumnsWidths();
                resizeColumn(colDifference);
            }

            /**
             * On mouse up handlers
             * @param {Object} event
             */
            function onMouseUp(event) {

                // detaches even listeners
                $document.off('mousemove', onMouseMove);
                $document.off('mouseup', onMouseUp);

                // prevent default dragging of selected content
                event.preventDefault();
                event.stopPropagation();

                $rootScope.$broadcast('resize-tags-cells');
            }

            /**
             * Reloads column cells in the table according to column width
             */
            function reloadColumns() {
                if (!lodash.isNil(vm.nextBlock)) {
                    $timeout(function () {
                        resetColumnsWidths();

                        $rootScope.$broadcast('resize-cells', { colClass: vm.colClass, columnWidth: vm.columnHeadWidth + 'px', nextColumnWidth: vm.nextBlockWidth + 'px' });
                    });
                }
            }

            /**
             * Initialises columns and their min width
             */
            function initColumnsWidths() {

                // get block which will be resized
                vm.columnHead = $element[0].parentElement;
                vm.columnHeadMinWidth = vm.minWidth;
                if (vm.columnHead.offsetWidth > 0) {
                    vm.columnHeadMinWidth = lodash.min([vm.columnHead.offsetWidth, vm.minWidth]);
                }

                // get parent container of the header
                vm.parentBlock = vm.columnHead.parentElement;

                // get block which is next to resizing block
                vm.nextBlock = vm.columnHead.nextElementSibling;
                vm.nextBlockMinWidth = vm.minWidth;
                if (!lodash.isNil(vm.nextBlock) && vm.nextBlock.offsetWidth > 0) {
                    vm.nextBlockMinWidth = lodash.min([vm.nextBlock.offsetWidth, vm.minWidth]);
                }
                resetColumnsWidths();
            }

            /**
             * Resets columns widths
             */
            function resetColumnsWidths() {
                vm.columnHeadWidth = vm.columnHead.offsetWidth;
                vm.parentBlockWidth = vm.parentBlock.offsetWidth;
                if (!lodash.isNil(vm.nextBlock)) {
                    vm.nextBlockWidth = vm.nextBlock.offsetWidth;
                }
            }

            /**
             * Resize cells in the table rows according to column width
             * @param {Object} data - information about column name and difference
             */
            function resizeColumn(colDifference) {
                if (!lodash.isNil(vm.nextBlock)) {

                    // calculate new width for the block which need to be resized
                    var maxColumnHeadDifference = vm.columnHeadWidth - vm.columnHeadMinWidth;

                    // calculate new width for the  block which is next to resizing block
                    var maxNextBlockDifference = vm.nextBlockWidth - vm.nextBlockMinWidth;

                    // calculate maximum resizing value of columns
                    var newDifference = 0;
                    if (colDifference > 0 && maxNextBlockDifference > 0) {
                        newDifference = lodash.min([colDifference, maxNextBlockDifference]);
                    } else if (colDifference < 0 && maxColumnHeadDifference > 0) {
                        newDifference = lodash.max([colDifference, -maxColumnHeadDifference]);
                    }

                    if (newDifference !== 0) {
                        vm.columnHeadWidth = vm.columnHeadWidth + newDifference;
                        vm.nextBlockWidth = vm.nextBlockWidth - newDifference;

                        setElementWidth(vm.columnHead, vm.columnHeadWidth);
                        setElementWidth(vm.nextBlock, vm.nextBlockWidth);

                        $rootScope.$broadcast('resize-cells', {
                            colClass: vm.colClass,
                            columnWidth: vm.columnHeadWidth + 'px',
                            nextColumnWidth: vm.nextBlockWidth + 'px'
                        });
                        $rootScope.$broadcast('resize-size-cells');
                    }
                }
            }

            /**
             * Sets header element width in percentage
             * @param {Object} element - element object
             * @param {number} widthInPixels - new width value
             */
            function setElementWidth(element, widthInPixels) {
                element.style.width = widthInPixels / vm.parentBlockWidth * 100 + '%';
            }
        }
    }
})();
'use strict';

(function () {
    'use strict';

    /*
     * Watch window resizing event to set new window dimensions,
     * and broadcast the event to the app (use in html tag)
     */

    igzWatchWindowResize.$inject = ['$window', '$timeout', '$rootScope', 'WindowDimensionsService'];
    angular.module('iguazio.dashboard-controls').directive('igzWatchWindowResize', igzWatchWindowResize);

    function igzWatchWindowResize($window, $timeout, $rootScope, WindowDimensionsService) {
        return {
            link: link
        };

        function link() {
            activate();

            function activate() {
                var resizing;

                // On window resize...
                angular.element($window).on('resize', function () {

                    // Reset timeout
                    $timeout.cancel(resizing);
                    WindowDimensionsService.removeOverflow();

                    // Add a timeout to not call the resizing function every pixel
                    resizing = $timeout(function () {
                        getDimensions();
                    }, 300);
                });
            }

            // Get window's dimensions
            function getDimensions() {

                // Namespacing events with name of directive + event to avoid collisions
                // http://stackoverflow.com/questions/23272169/what-is-the-best-way-to-bind-to-a-global-event-in-a-angularjs-directive
                $rootScope.$broadcast('igzWatchWindowResize::resize', {
                    height: WindowDimensionsService.height(),
                    width: WindowDimensionsService.width()
                });
            }
        }
    }
})();
(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('action-checkbox/action-checkbox.tpl.html',
    '<div class="action-checkbox"><div class="check-item igz-icon-checkbox-unchecked" data-ng-class="{\'igz-icon-checkbox-checked\': $ctrl.item.ui.checked}" data-ng-click="$ctrl.onCheck($event)" data-ng-dblclick="$event.stopPropagation()"></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('action-checkbox-all/action-checkbox-all.tpl.html',
    '<div class="action-checkbox-all"><div class="check-item" data-ng-class="{\'igz-icon-checkbox-checked\': $ctrl.allItemsChecked,\n' +
    '                        \'igz-icon-checkbox-checked-few\': $ctrl.checkedItemsCount > 0 && !$ctrl.allItemsChecked,\n' +
    '                        \'igz-icon-checkbox-unchecked\': $ctrl.checkedItemsCount === 0}" data-ng-click="$ctrl.onCheckAll()"></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('action-item/action-item.tpl.html',
    '<div class="igz-action-item" data-ng-class="{\'inactive\': !$ctrl.action.active,\n' +
    '     \'subtemplate-show\': $ctrl.action.subTemplateProps.isShown,\n' +
    '     \'ng-hide\': !$ctrl.isItemVisible($ctrl.action),\n' +
    '     \'divider\': $ctrl.action.id === \'divider\'}" data-ng-click="$ctrl.onClickAction($event)" data-ng-if="$ctrl.template !== \'additional\'" data-igz-capability-enforcer="{{$ctrl.action.capability}}"><div data-tooltip="{{$ctrl.action.label}}" data-tooltip-popup-delay="1000" data-tooltip-placement="bottom"><div data-ng-if="$ctrl.action.id === \'upload\'" data-ngf-select data-ngf-multiple="true" data-ngf-change="$ctrl.onFilesDropped($files)"><div class="action-icon {{$ctrl.action.icon}}"></div><div class="action-label">{{$ctrl.action.label}}</div></div><div data-ng-if="$ctrl.action.id !== \'upload\'"><div class="action-icon {{$ctrl.action.icon}}" data-ng-style="$ctrl.action.iconColor && {\'color\': $ctrl.action.iconColor}"></div><div class="action-label">{{$ctrl.action.label}}</div><igz-action-item-subtemplate class="action-subtemplate igz-component" data-ng-if="$ctrl.action.template" data-ng-show="$ctrl.action.subTemplateProps.isShown" action="$ctrl.action" data-ng-click="$event.stopPropagation()"></igz-action-item-subtemplate></div></div></div><li data-ng-if="$ctrl.template === \'additional\'" data-ng-click="$ctrl.onClickAction($event)"><div class="action-icon {{$ctrl.action.icon}}" data-ng-style="$ctrl.action.iconColor && {\'color\': $ctrl.action.iconColor}"></div><div class="action-label">{{$ctrl.action.label}}</div><igz-action-item-subtemplate class="action-subtemplate igz-component" data-ng-if="$ctrl.action.template" data-ng-show="$ctrl.action.subTemplateProps.isShown" action="$ctrl.action" data-ng-click="$event.stopPropagation()"></igz-action-item-subtemplate></li>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('action-panel/action-panel.tpl.html',
    '<div class="igz-action-panel" data-igz-right-click data-ng-show="$ctrl.isActionPanelShown()"><div class="actions-list clearfix" data-ng-show="$ctrl.mainActions.length > 0 || $ctrl.remainingActions.length > 0"><igz-action-item data-ng-repeat="action in $ctrl.mainActions" data-action="action"></igz-action-item><igz-action-item-more data-ng-if="$ctrl.remainingActions.length !== 0" data-actions="$ctrl.remainingActions"><div class="transclude-container" data-ng-transclude></div></igz-action-item-more></div><div class="actions-list empty" data-ng-show="$ctrl.mainActions.length === 0 && $ctrl.remainingActions.length === 0">(No actions)</div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('action-menu/action-menu.tpl.html',
    '<div class="igz-action-menu" data-ng-if="$ctrl.isVisible()"><div class="menu-button igz-icon-context-menu" data-ng-class="{active: $ctrl.isMenuShown}" data-ng-click="$ctrl.toggleMenu($event)"></div><div class="menu-dropdown" data-ng-if="$ctrl.isMenuShown"><div class="actions-list" data-ng-click="$ctrl.toggleMenu($event)"><igz-action-item data-ng-repeat="action in $ctrl.actions" data-action="action"></igz-action-item></div><div class="shortcuts-list" data-ng-if="$ctrl.shortcuts && $ctrl.shortcuts.length > 0" data-ng-class="{\'first-block\': $ctrl.actions.length === 0}"><div class="shortcuts-header">Shortcuts</div><div class="shortcuts-item" data-ng-repeat="shortcut in $ctrl.shortcuts" data-ng-click="$ctrl.showDetails($event, shortcut.state)" data-igz-capability-enforcer="{{shortcut.capability}}">{{shortcut.label}}</div></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('actions-panes/actions-panes.tpl.html',
    '<div class="actions-bar-left actions-panes-block"><div class="igz-action-panel"><div class="actions-list"><div class="igz-action-item" data-ng-if="$ctrl.isShowFilterActionIcon()" data-tooltip="Filter" data-tooltip-append-to-body="true" data-tooltip-placement="bottom" data-tooltip-popup-delay="1000" data-ng-click="$ctrl.filtersToggleMethod()"><div class="action-icon igz-icon-filter"></div><span data-ng-if="$ctrl.filtersCounter" class="filter-counter">{{$ctrl.filtersCounter}}</span></div><div class="igz-action-item last-item" data-ng-class="{inactive: (!$ctrl.isInfoPaneOpened && !$ctrl.infoPaneToggleMethod) || $ctrl.infoPaneDisable}" data-ng-if="$ctrl.closeInfoPane || $ctrl.infoPaneToggleMethod" data-tooltip="Info pane" data-tooltip-append-to-body="true" data-tooltip-placement="bottom" data-tooltip-popup-delay="1000" data-ng-click="$ctrl.callToggleMethod()"><div class="action-icon igz-icon-info-round"></div></div></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('breadcrumbs-dropdown/breadcrumbs-dropdown.tpl.html',
    '<div class="breadcrumbs-dropdown dropdown" data-ng-class="{\'open\': $ctrl.showDropdownList}"><span class="breadcrumb-toggle" data-ng-click="$ctrl.showDropdown()">{{$ctrl.title}}<span class="igz-icon-dropdown"></span></span><div class="dropdown-menu"><div class="search-input"><input type="text" placeholder="{{$ctrl.placeholder}}" data-ng-model="$ctrl.searchText"><span class="igz-icon-search"></span></div><ul class="dropdown-list" data-ng-scrollbars><li data-ng-repeat="item in $ctrl.itemsList | filter: $ctrl.searchText"><a class="item-name" data-ng-click="$ctrl.showDetails($event, item)">{{item.name}}</a><span class="igz-icon-tick" data-ng-show="$ctrl.title === item.name"></span></li></ul></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('container-wizard-number-input/container-wizard-number-input.tpl.html',
    '<div class="container-wizard-number-input" data-ng-class="[{\'invalid\': $ctrl.checkInvalidation()},\n' +
    '                    {\'pristine\': !$ctrl.numberInputChanged},\n' +
    '                    {\'disabled\': $ctrl.isDisabled}]"><div class="additional-left-block"><span class="prefix-unit" data-ng-show="$ctrl.isShownUnit($ctrl.prefixUnit)">{{$ctrl.prefixUnit}}</span></div><input class="input-field additional-right-padding field" data-ng-class="{\'additional-left-padding\': $ctrl.isShownUnit($ctrl.prefixUnit)}" type="text" name="{{$ctrl.inputName}}" data-ng-model="$ctrl.currentValue" data-ng-model-options="{allowInvalid: true}" data-money min="{{$ctrl.minValue}}" max="{{$ctrl.maxValue}}" placeholder="{{$ctrl.placeholder}}" data-precision="{{$ctrl.precision}}" data-ng-focus="$ctrl.inputFocused=true" data-ng-blur="$ctrl.onBlurInput()" data-ng-change="$ctrl.onChangeInput()" data-ng-disabled="$ctrl.isDisabled" data-igz-validate-elevation data-compare-val="$ctrl.validationValue" data-compare-val-unit="$ctrl.validationValueUnit.power" data-current-val-unit="$ctrl.currentValueUnit.power"><span class="suffix-unit" data-ng-show="$ctrl.isShownUnit($ctrl.suffixUnit)">{{$ctrl.suffixUnit}}</span><div class="arrow-block"><span class="igz-icon-dropup" data-ng-click="$ctrl.isDisabled || $ctrl.increaseValue()"></span><span class="igz-icon-dropdown" data-ng-click="$ctrl.isDisabled || $ctrl.decreaseValue()"></span></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('default-dropdown/default-dropdown.tpl.html',
    '<div class="default-dropdown" data-ng-class="{\'dropdown-input-invalid\': $ctrl.isShowDropdownError($ctrl.formObject, $ctrl.inputName),\n' +
    '                     \'dropdown-input-disabled\': $ctrl.isDisabled,\n' +
    '                     \'dropdown-input-opened\': $ctrl.isDropdownContainerShown}"><div class="default-dropdown-field" tabindex="0" data-ng-click="$ctrl.readOnly || $ctrl.toggleDropdown($event)" data-ng-keydown="$ctrl.onDropDownKeydown($event)" data-tooltip="{{$ctrl.isDropdownContainerShown ? \'\' : $ctrl.typedValue}}" data-tooltip-append-to-body="true" data-tooltip-placement="top" data-tooltip-popup-delay="300" data-ng-class="{placeholder: $ctrl.isPlaceholderClass(),\n' +
    '                         disabled: $ctrl.isDisabled,\n' +
    '                         readonly: $ctrl.readOnly}"><div class="dropdown-selected-item"><div data-ng-if="$ctrl.showSelectedItem().icon.name" data-ng-class="{\'custom-color\': $ctrl.dropdownType === \'priority\'}" class="dropdown-icon {{$ctrl.getIcon($ctrl.showSelectedItem()).name}}"></div><div data-ng-if="$ctrl.showSelectedItem().badge" data-ng-class="{\'custom-color\': $ctrl.dropdownType === \'badges-dropdown\'}" class="{{$ctrl.showSelectedItem().badge.class}}">{{$ctrl.showSelectedItem().badge.value}}</div><input type="text" class="input-name text-ellipsis" data-ng-class="{\'non-editable\': !$ctrl.enableTyping && !$ctrl.isDisabled, capitalized: $ctrl.isCapitalized}" data-ng-model="$ctrl.typedValue" data-ng-change="$ctrl.onChangeTypingInput()" data-ng-readonly="!$ctrl.enableTyping" data-ng-required="$ctrl.checkIsRequired()" data-ng-disabled="$ctrl.isDisabled || !$ctrl.enableTyping" data-ng-pattern="$ctrl.matchPattern" name="{{$ctrl.inputName}}" placeholder="{{$ctrl.placeholder}}"><span data-ng-if="$ctrl.getDescription($ctrl.showSelectedItem().description)" class="description">{{$ctrl.getDescription($ctrl.showSelectedItem().description)}}</span></div><div class="dropdown-arrow" data-ng-if="!$ctrl.readOnly"><span class="igz-icon-dropdown" data-ng-class="{\'rotate-arrow\': $ctrl.isDropUp}"></span></div></div><div class="default-dropdown-container" tabindex="-1" data-ng-if="$ctrl.isDropdownContainerShown" data-ng-style="{\'top\': $ctrl.topPosition}" data-ng-scrollbars><ul class="list" tabindex="-1"><li class="list-item" tabindex="0" data-ng-repeat="item in $ctrl.getValuesArray() track by $index" data-ng-click="$ctrl.selectItem(item)" data-ng-keydown="$ctrl.onItemKeydown($event, item)" data-ng-show="item.visible" data-tooltip="{{$ctrl.getTooltip(item)}}" data-tooltip-placement="left" data-tooltip-append-to-body="true"><div class="list-item-block"><div data-ng-if="$ctrl.getIcon(item).name" data-ng-class="{\'custom-color\': $ctrl.dropdownType === \'priority\'}" class="dropdown-icon {{$ctrl.getIcon(item).name}}"></div><div data-ng-if="item.badge" data-ng-class="{\'custom-color\': $ctrl.dropdownType === \'badges-dropdown\'}" class="{{item.badge.class}}">{{item.badge.value}}</div><div class="list-item-label"><span class="list-item-name" data-ng-class="{\'capitalized\': $ctrl.isCapitalized}">{{$ctrl.getName(item)}}</span><span data-ng-show="$ctrl.getDescription(item)" class="description">{{$ctrl.getDescription(item)}}</span></div></div><div class="igz-col-20 igz-icon-tick selected-item-icon" data-ng-show="$ctrl.isItemSelected(item) && !$ctrl.isPagination"></div></li></ul><div class="add-button-wrapper" tabindex="0" data-ng-if="$ctrl.bottomButtonCallback"><a href="#" class="add-button" data-ng-click="$ctrl.bottomButtonCallback()">{{ $ctrl.bottomButtonText }}</a></div><div class="transclude-container align-items-center" data-ng-if="$ctrl.isTranscludePassed" data-ng-transclude></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('navigation-tabs/navigation-tabs.tpl.html',
    '<div class="igz-navigation-tabs clearfix"><div class="navigation-tab" data-ng-repeat="item in $ctrl.tabItems" data-ui-sref="{{item.uiRoute}}" data-ui-sref-active="active" data-igz-capability-enforcer="{{item.capability}}">{{item.tabName | uppercase}}</div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('search-input/search-input.tpl.html',
    '<div data-ng-class="{\'search-input\': $ctrl.searchType === \'infoPage\', \'search-input-actions-bar\': $ctrl.searchType === \'actionsBar\'}"><input type="text" class="container-search-input" placeholder="{{$ctrl.placeholder}}" data-ng-keydown="$ctrl.onPressEnter($event)" data-igz-input-blur-on-enter data-ng-model="$ctrl.searchQuery" data-ng-model-options="{ debounce: { \'default\': 500, \'blur\': 0 } }"><span class="igz-icon-search"></span><span class="clear-button igz-icon-close" data-ng-show="$ctrl.searchQuery" data-ng-click="$ctrl.clearInputField()"></span></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('slider-input-block/slider-input-block.tpl.html',
    '<div class="igz-slider-input-block clearfix"><div class="igz-slider-input-title igz-col-50"><div class="igz-slider-input-title-text"><i data-ng-if="$ctrl.sliderConfig.iconType" data-ng-class="($ctrl.sliderConfig.iconType | lowercase)"></i>{{$ctrl.sliderConfig.name}}&nbsp;<i data-ng-if="$ctrl.sliderConfig.labelHelpIcon" class="igz-icon-help-round"></i></div></div><div class="igz-col-16"></div><div class="igz-slider-input-current-value igz-col-18"><div class="igz-slider-input-current-value-text">{{$ctrl.sliderConfig.valueLabel}}</div></div><div class="igz-slider-input-units-dropdown igz-col-16" data-ng-if="$ctrl.measureUnits"><igz-default-dropdown data-values-array="$ctrl.measureUnits" data-selected-item="$ctrl.selectedItem" data-item-select-callback="$ctrl.changeTrafficUnit(item)"></igz-default-dropdown></div><div class="igz-slider-input-rz-slider igz-col-100"><rzslider class="rzslider" data-rz-slider-model="$ctrl.sliderConfig.value" data-rz-slider-options="$ctrl.sliderConfig.options"></rzslider></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('sort-dropdown/sort-dropdown.tpl.html',
    '<div class="igz-browser-sort-dropdown dropdown" data-dropdown data-is-open="$ctrl.isOpen"><div class="igz-action-item" data-dropdown-toggle><span class="action-icon igz-icon-sort"></span></div><ul class="dropdown-menu dropdown-list" data-ng-if="$ctrl.isOpen"><li class="dropdown-menu-item" data-ng-repeat="option in $ctrl.sortOptions" data-ng-click="$ctrl.toggleSortingOrder(option)"><span class="item-name" data-ng-class="$ctrl.getItemClass(option.active)">{{option.label}}</span><span class="igz-icon-sort-{{option.desc ? \'down\' : \'up\'}}" data-ng-show="option.active"></span></li></ul></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('splash-screen/splash-screen.tpl.html',
    '<div class="splash-screen" data-ng-hide="!$ctrl.isSplashShowed.value"><div class="loading-splash-screen" data-ng-if="$ctrl.isLoading"><div class="splash-logo-wrapper"><div class="loader-fading-circle"><div class="loader-circle1 loader-circle"></div><div class="loader-circle2 loader-circle"></div><div class="loader-circle3 loader-circle"></div><div class="loader-circle4 loader-circle"></div><div class="loader-circle5 loader-circle"></div><div class="loader-circle6 loader-circle"></div><div class="loader-circle7 loader-circle"></div><div class="loader-circle8 loader-circle"></div><div class="loader-circle9 loader-circle"></div><div class="loader-circle10 loader-circle"></div><div class="loader-circle11 loader-circle"></div><div class="loader-circle12 loader-circle"></div></div></div><div class="loading-text">{{$ctrl.textToDisplay}}</div></div><div class="alert-splash-screen" data-ng-if="$ctrl.isAlertShowing"><div class="header"></div><div class="notification-text">{{$ctrl.alertText}}</div><div class="buttons"><div class="refresh-button" data-ng-click="$ctrl.refreshPage()"><span class="igz-icon-refresh"></span>Refresh</div></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('validating-input-field/validating-input-field.tpl.html',
    '<div class="validating-input-field" data-ng-class="{\'focused\': $ctrl.inputFocused, \'with-counter\': $ctrl.validationMaxLength && $ctrl.isCounterVisible()}"><div data-ng-if="$ctrl.fieldType === \'input\'"><div class="input-counter" data-ng-class="{\'invalid\': $ctrl.getRemainingSymbolsCounter() < 0}" data-ng-if="!$ctrl.onlyValidCharacters || $ctrl.isCounterVisible()">{{$ctrl.getRemainingSymbolsCounter()}}</div><div data-ng-hide="$ctrl.inputFocused || $ctrl.formObject[$ctrl.inputName].$viewValue" class="input-placeholder" data-ng-class="{\'with-icon\': $ctrl.inputIcon}">{{$ctrl.placeholderText}}</div><input class="input-field field" tabindex="0" data-ng-class="{\'invalid\': $ctrl.isFieldInvalid(),\n' +
    '                               \'with-icon\': $ctrl.inputIcon}" name="{{$ctrl.inputName}}" data-ng-readonly="$ctrl.readOnly" data-ng-model="$ctrl.data" data-ng-model-options="$ctrl.inputModelOptions" data-ng-required="$ctrl.validationIsRequired === \'true\'" data-ng-maxlength="$ctrl.validationMaxLength" data-ng-pattern="$ctrl.validationPattern" data-ng-focus="$ctrl.focusInput()" data-ng-blur="$ctrl.unfocusInput()" data-ng-change="$ctrl.updateInputValue()" data-ng-disabled="$ctrl.isDisabled" data-ng-keydown="$ctrl.keyDown($event)" data-igz-input-only-valid-characters="$ctrl.validationPattern" data-only-valid-characters="{{$ctrl.onlyValidCharacters}}" spellcheck="{{$ctrl.spellcheck}}" maxlength="{{$ctrl.onlyValidCharacters ? $ctrl.validationMaxLength : null}}" data-igz-input-blur-on-enter><span data-ng-if="$ctrl.inputIcon" class="input-icon {{$ctrl.inputIcon}}"></span><span class="clear-button igz-icon-close" data-ng-show="$ctrl.data && $ctrl.isClearIcon" data-ng-click="$ctrl.clearInputField()"></span></div><div data-ng-if="$ctrl.fieldType === \'textarea\'"><div class="textarea-counter" data-ng-class="{\'invalid\': $ctrl.getRemainingSymbolsCounter() < 0}" data-ng-if="!$ctrl.onlyValidCharacters || $ctrl.isCounterVisible()">{{$ctrl.getRemainingSymbolsCounter()}}</div><div data-ng-hide="$ctrl.inputFocused || $ctrl.formObject[$ctrl.inputName].$viewValue" class="textarea-placeholder">{{$ctrl.placeholderText}}</div><textarea class="textarea-field field" tabindex="0" data-ng-class="{\'invalid\': $ctrl.isFieldInvalid()}" name="{{$ctrl.inputName}}" data-ng-model="$ctrl.data" data-ng-required="$ctrl.validationIsRequired === \'true\'" data-ng-maxlength="$ctrl.validationMaxLength" data-ng-pattern="$ctrl.validationPattern" data-ng-focus="$ctrl.focusInput()" data-ng-blur="$ctrl.unfocusInput()" data-ng-change="$ctrl.updateInputValue()" spellcheck="{{$ctrl.spellcheck}}" data-igz-input-blur-on-enter></textarea></div><div data-ng-if="$ctrl.fieldType === \'password\'"><div data-ng-hide="$ctrl.inputFocused || $ctrl.formObject[$ctrl.inputName].$viewValue" class="input-placeholder">{{$ctrl.placeholderText}}</div><input class="input-field field" tabindex="0" data-igz-validate-password-confirmation="$ctrl.compareInputValue" type="password" name="{{$ctrl.inputName}}" data-ng-model="$ctrl.data" data-ng-model-options="$ctrl.inputModelOptions" data-ng-required="$ctrl.validationIsRequired === \'true\'" data-ng-maxlength="$ctrl.validationMaxLength" data-ng-pattern="$ctrl.validationPattern" data-ng-focus="$ctrl.focusInput()" data-ng-blur="$ctrl.unfocusInput()" data-ng-change="$ctrl.updateInputValue()" data-igz-input-blur-on-enter></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('action-item/action-item-more/action-item-more.tpl.html',
    '<div class="igz-action-item" data-ng-class="{\'subtemplate-show\': $ctrl.isDropdownShown}"><div data-tooltip="More options" data-tooltip-popup-delay="1000" data-tooltip-placement="bottom"><div class="action-icon igz-icon-context-menu" data-ng-click="$ctrl.toggleTemplate()"></div></div><div class="item-dropdown-menu igz-component" data-ng-show="$ctrl.isDropdownShown"><ul class="item-dropdown-menu-list"><igz-action-item data-ng-repeat="action in $ctrl.actions" data-action="action" data-template="additional" data-ng-click="action.template ? \'\' : $ctrl.toggleTemplate()"></igz-action-item></ul><div class="transclude-container" data-ng-transclude></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('action-item/action-item-refresh/action-item-refresh.tpl.html',
    '<div class="igz-action-item" data-tooltip="Refresh" data-tooltip-append-to-body="true" data-tooltip-placement="bottom" data-tooltip-popup-delay="1000" data-ng-click="$ctrl.refresh()"><div class="action-icon igz-icon-refresh"></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('info-page/info-page-actions-bar/info-page-actions-bar.tpl.html',
    '<div class="igz-info-page-actions-bar" data-ng-class="{\'filters-opened\' : $ctrl.isFiltersShowed, \'info-pane-opened\' : $ctrl.isInfoPaneShowed, \'upper-pane-opened\' : $ctrl.isUpperPaneShowed}"><div data-ng-transclude></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('info-page/info-page-content/info-page-content.tpl.html',
    '<div class="igz-info-page-content-wrapper" data-ng-class="{\'info-pane-opened\' : $ctrl.isInfoPaneShowed, \'filters-opened\' : $ctrl.isFiltersShowed, \'upper-pane-opened\' : $ctrl.isUpperPaneShowed}"><div data-ng-if="$ctrl.scrolled !== false" class="igz-scrollable-container horizontal" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollConfigHorizontal"><div class="igz-info-page-content"><div data-ng-transclude></div></div></div><div data-ng-if="$ctrl.scrolled === false"><div class="igz-info-page-content"><div data-ng-transclude></div></div></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('iguazio.dashboard-controls.templates');
} catch (e) {
  module = angular.module('iguazio.dashboard-controls.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('info-page/info-page-filters/info-page-filters.tpl.html',
    '<div class="info-page-filters-wrapper"><div class="info-page-filters" data-ng-show="$ctrl.isFiltersShowed" data-ng-keyup="$ctrl.onApplyFilters($event)"><div class="info-page-filters-title">Filter</div><div class="close-button igz-icon-close" data-ng-click="$ctrl.changeStateCallback({newVal: false})" data-ng-show="$ctrl.changeStateCallback"></div><div class="info-page-filters-body" data-ng-class="{\'buttons-shown\' : $ctrl.isShowFooterButtons()}" data-ng-scrollbars data-ng-scrollbars-config="$ctrl.scrollbarConfig"><div data-ng-transclude></div></div><div class="info-page-filters-footer" data-ng-if="$ctrl.isShowFooterButtons()"><button class="igz-button-just-text" tabindex="0" data-ng-click="$ctrl.onResetFilters()" data-ng-keydown="$ctrl.onResetFilters($event)" data-ng-if="$ctrl.resetFilters">Reset</button><button class="igz-button-primary" tabindex="0" data-ng-click="$ctrl.onApplyFilters()" data-ng-keydown="$ctrl.onApplyFilters($event)" data-ng-if="$ctrl.applyFilters">Apply</button></div></div></div>');
}]);
})();
