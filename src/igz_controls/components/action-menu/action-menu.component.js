(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzActionMenu', {
            bindings: {
                actions: '<',
                shortcuts: '<',
                onFireAction: '<?',
                onClickShortcut: '<?',
                isMenuShown: '<?',
                iconClass: '@?',
                listClass: '<?',
                tooltipEnabled: '<?',
                tooltipText: '@?'
            },
            templateUrl: 'igz_controls/components/action-menu/action-menu.tpl.html',
            controller: IgzActionMenuController
        });

    function IgzActionMenuController($element, $document, $i18next, $rootScope, $scope, $window, $timeout, i18next, lodash,
                                     ConfigService, PreventDropdownCutOffService) {
        var ctrl = this;
        var lng = i18next.language;
        var MENU_ROW_HEIGHT = 38;
        var MENU_HEIGHT_OVERHEAD = 20;

        ctrl.isMenuShown = false;
        ctrl.preventDropdownCutOff = null;

        ctrl.$onInit = onInit;
        ctrl.$postLink = postLink;
        ctrl.$onDestroy = onDestroy;
        ctrl.$onChanges = onChanges;

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
            ctrl.iconClass = lodash.defaultTo(ctrl.iconClass, 'igz-icon-context-menu');

            $scope.$on('close-all-action-menus', closeActionMenu);
        }

        /**
         * On changes hook method
         * @param {Object} changes
         */
        function onChanges(changes) {
            var actions = lodash.get(changes, 'actions.currentValue');
            var shortcuts = lodash.get(changes, 'shortcuts.currentValue');
            var iconClass = lodash.get(changes, 'iconClass.currentValue');

            if (angular.isDefined(actions)) {
                ctrl.actions = lodash.chain(actions)
                    .filter(function (action) {
                        return !lodash.has(action, 'visible') || action.visible;
                    })
                    .map(function (action) {
                        if (!angular.isFunction(action.handler)) {
                            action.handler = defaultAction;

                            if (action.id === 'delete' && angular.isUndefined(action.confirm)) {
                                action.confirm = {
                                    message: $i18next.t('common:DELETE_SELECTED_ITEM_CONFIRM', {lng: lng}),
                                    yesLabel: $i18next.t('common:YES_DELETE', {lng: lng}),
                                    noLabel: $i18next.t('common:CANCEL', {lng: lng}),
                                    type: 'critical_alert'
                                };
                            }
                        }

                        return action;
                    })
                    .value();
            }

            if (angular.isDefined(shortcuts)) {
                ctrl.shortcuts = lodash.filter(shortcuts, function (shortcut) {
                    return !lodash.has(shortcut, 'visible') || shortcut.visible;
                });
            }
        }

        /**
         * Destructor
         */
        function onDestroy() {
            detachDocumentEvent();
        }

        /**
         * Post linking method
         */
        function postLink() {
            $scope.$on('igz-browser-context-menu_show', showMenu);
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
                $timeout(function () {
                    showMenu(event);
                });
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
         * Calculates the positioning of the context menu according to screen limitations
         * @param {number} coord - the Y coodrinate of the position where the user clicked
         * @param {number} itemListSize - the number of items on the context menu
         */
        function calculateBoundingBox(coord, itemListSize) {
            var windowHeight = $window.innerHeight;
            var parentalBlock = $document.find('.menu-dropdown')[0];
            var menuTotalHeight = MENU_ROW_HEIGHT * itemListSize + MENU_HEIGHT_OVERHEAD;

            if (windowHeight - coord < menuTotalHeight - 5) {
                parentalBlock.classList.add('upward-menu');
            }
            angular.element('.menu-dropdown').css('visibility', 'visible');
        }

        /**
         * Shows the menu at a given position
         * @param {Event} event - click event
         */
        function showMenu(event) {
            var visibleItemsQuantity;
            var contextMenuMousePositionY;
            // gets mouse coordinates
            $timeout(function () {
                visibleItemsQuantity = lodash.filter(ctrl.actions, ['visible', true]).length
                if (angular.isDefined(event)) {
                    contextMenuMousePositionY = event.clientY;
                }
                calculateBoundingBox(contextMenuMousePositionY, visibleItemsQuantity);
            });
        }

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
}());
