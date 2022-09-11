/*
Copyright 2018 Iguazio Systems Ltd.
Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.
In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/
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
                tooltipEnabled: '<?',
                tooltipText: '@?'
            },
            templateUrl: 'igz_controls/components/action-menu/action-menu.tpl.html',
            controller: IgzActionMenuController
        });

    function IgzActionMenuController($element, $document, $i18next, $rootScope, $scope, $timeout, $window, i18next,
                                     lodash, ConfigService, PreventDropdownCutOffService) {
        var ctrl = this;
        var lng = i18next.language;

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
                showMenu();
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
         * Shows the dropdown. If there is not enough space from below,
         * adds 'upward-menu' class to open the dropdown from above
         */
        function showMenu() {
            $timeout(function () {
                var windowHeight = $window.innerHeight;
                var menu = $document.find('.menu-dropdown')[0];
                var menuTotalHeight = menu.clientHeight;
                var menuPosition = menu.getBoundingClientRect();
                var menuHighestPoint = menuPosition.top;
                var menuLowestPoint = menuPosition.bottom;
                var menuWrapper = menu.closest('.igz-scrollable-container');

                if (menuWrapper) {
                    windowHeight = menuWrapper.getBoundingClientRect().bottom;
                    menuHighestPoint -= menuWrapper.getBoundingClientRect().top;
                }

                if (windowHeight - menuLowestPoint < 0 && menuHighestPoint > menuTotalHeight) {
                    menu.classList.add('upward-menu');
                }

                angular.element('.menu-dropdown').css('visibility', 'visible');
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
