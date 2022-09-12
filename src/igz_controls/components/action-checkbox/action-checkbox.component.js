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
        .component('igzActionCheckbox', {
            bindings: {
                item: '<',
                itemType: '@?',
                onClickCallback: '&?'
            },
            templateUrl: 'igz_controls/components/action-checkbox/action-checkbox.tpl.html',
            controller: IgzActionCheckbox
        });

    function IgzActionCheckbox($scope, $rootScope, lodash) {
        var ctrl = this;

        ctrl.$onInit = onInit;

        ctrl.onCheck = onCheck;

        //
        // Hook methods
        //

        /**
         * Constructor method
         */
        function onInit() {
            $scope.$on('action-checkbox-all_check-all', toggleCheckedAll);
        }

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

            $rootScope.$broadcast('action-checkbox_item-checked', {
                item: ctrl.item,
                itemType: !lodash.isEmpty(ctrl.itemType) ? ctrl.itemType : null,
                checked: ctrl.item.ui.checked
            });
        }

        //
        // Private methods
        //

        /**
         * Triggers on Check all button clicked
         * @param {Object} event
         * @param {Object} data
         */
        function toggleCheckedAll(event, data) {
            var isTypeValid = lodash.isNil(data.itemsType) || data.itemsType === ctrl.itemType;

            if (ctrl.item.ui.checked !== data.checked && isTypeValid) {
                ctrl.item.ui.checked = !ctrl.item.ui.checked;
            }

            if (angular.isFunction(ctrl.onClickCallback) && isTypeValid) {
                ctrl.onClickCallback();
            }
        }
    }
}());
