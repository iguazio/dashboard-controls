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
        .component('igzActionItem', {
            bindings: {
                action: '<',
                actions: '<?',
                template: '@',
                onFilesDropped: '<?'
            },
            templateUrl: 'igz_controls/components/action-item/action-item.tpl.html',
            controller: IgzActionItem
        });

    function IgzActionItem($document, $element, $rootScope, $scope , $timeout, lodash, DialogsService) {
        var ctrl = this;

        ctrl.$onInit = onInit();
        ctrl.$onDestroy = onDestroy();

        ctrl.getIconClass = getIconClass;
        ctrl.getTooltipText = getTooltipText;
        ctrl.isItemVisible = isItemVisible;
        ctrl.onClickAction = onClickAction;

        //
        // Hook methods
        //

        /**
         * Initialization method
         */
        function onInit() {
            $timeout(function () {
                lodash.defaults(ctrl.action, {
                    visible: true
                });
            });
        }

        /**
         * Destructor method
         */
        function onDestroy() {
            if (angular.isDefined(ctrl.action) && angular.isDefined(ctrl.action.template)) {
                detachDocumentEvent();
            }
        }

        //
        // Public methods
        //

        /**
         * Gets icon css class
         * @returns {string}
         */
        function getIconClass() {
            return ctrl.action.icon ? ctrl.action.icon                                                :
                                      ctrl.actions && lodash.some(ctrl.actions, 'icon') ? 'icon-placeholder' : '';
        }

        function getTooltipText() {
            return ctrl.action.label + (lodash.isEmpty(ctrl.action.tooltip) ? '' : ' - ' + ctrl.action.tooltip);
        }

        /**
         * Checks if the action item should be shown
         * @param {Object} action
         * @returns {boolean}
         */
        function isItemVisible(action) {
            return lodash.get(action, 'visible', true);
        }

        /**
         * Handles mouse click on action item
         * @param {MouseEvent} event
         */
        function onClickAction(event) {
            if (ctrl.action.active) {

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

            DialogsService.confirm(message, ctrl.action.confirm.yesLabel, ctrl.action.confirm.noLabel, ctrl.action.confirm.type)
                .then(function () {
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
}());
