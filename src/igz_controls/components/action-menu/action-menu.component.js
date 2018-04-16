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
                listClass: '<?'
            },
            templateUrl: 'igz_controls/components/action-menu/action-menu.tpl.html',
            controller: IgzActionMenuController
        });

    function IgzActionMenuController($scope, $element, $document, $rootScope, $timeout, lodash, ConfigService,
                                     PreventDropdownCutOffService) {
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
                return !lodash.has(action, 'visible') || action.visible;
            });
            ctrl.shortcuts = lodash.filter(ctrl.shortcuts, function (shortcut) {
                return !lodash.has(shortcut, 'visible') || shortcut.visible;
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

            ctrl.iconClass = lodash.defaultTo(ctrl.icon, 'igz-icon-context-menu');

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

                if (angular.isDefined(ctrl.listClass)) {
                    checkOpeningSide(ctrl.listClass);
                } else {
                    $timeout(function () {
                        angular.element('.menu-dropdown').css('visibility', 'visible');
                    });
                }
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

        /**
         * Checks how to open drop-down menu in key-value list
         * @param {string} elementClass - class of parental block of key-value list
         */
        function checkOpeningSide(elementClass) {
            var parentalBlock = $(document).find('.' + elementClass)[0];
            var parentalRect = parentalBlock.getBoundingClientRect();
            var dropdown;
            var dropdownBottom;

            $timeout(function () {
                dropdown = angular.element($element).find('.menu-dropdown')[0];
                dropdownBottom = dropdown.getBoundingClientRect().bottom;
                dropdown = angular.element(dropdown);
            });

            if (lodash.includes(elementClass, 'scrollable')) {
                var parentalHeight = parentalBlock.clientHeight;
                var parentalTop = parentalRect.top;

                $timeout(function () {
                    (dropdownBottom - parentalTop) > parentalHeight ? dropdown.addClass('upward-menu') : dropdown.css({'visibility': 'visible'});

                    angular.element('.' + elementClass + ' .mCSB_container').css({'height': 'auto'});
                });
            } else {
                var parentalBottom = parentalRect.bottom;

                $timeout(function () {
                    dropdownBottom > parentalBottom ? dropdown.addClass('upward-menu') : dropdown.css({'visibility': 'visible'});
                });
            }
        }
    }
}());
