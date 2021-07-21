(function () {
    'use strict';

    angular.module('iguazio.dashboard-controls')
        .component('igzActionCheckboxAll', {
            bindings: {
                itemsCountOriginal: '<itemsCount',
                itemsType: '@?',
                checkedItemsCount: '<?',
                onCheckChange: '&?'
            },
            templateUrl: 'igz_controls/components/action-checkbox-all/action-checkbox-all.tpl.html',
            controller: IgzActionCheckboxAllController
        });

    function IgzActionCheckboxAllController($scope, $rootScope, lodash) {
        var ctrl = this;

        ctrl.allItemsChecked = false;

        ctrl.$onInit = onInit;
        ctrl.$onChanges = onChanges;
        ctrl.$onDestroy = onDestroy;

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

        /**
         * Destructor method
         */
        function onDestroy() {
            ctrl.checkedItemsCount = 0;

            $rootScope.$broadcast('action-checkbox-all_checked-items-count-change', {
                checkedCount: ctrl.checkedItemsCount
            });
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
                checkedCount: ctrl.checkedItemsCount,
                itemsType: !lodash.isEmpty(ctrl.itemsType) ? ctrl.itemsType : null
            });

            if (angular.isFunction(ctrl.onCheckChange)) {
                ctrl.onCheckChange({checkedCount: ctrl.checkedItemsCount});
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

            testAllItemsChecked();

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

            $rootScope.$broadcast('action-checkbox-all_checked-items-count-change', {
                checkedCount: ctrl.checkedItemsCount
            });
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
                ctrl.onCheckChange({checkedCount: ctrl.checkedItemsCount});
            }
        }

        /**
         * Updates items count and toggle allItemsChecked flag
         */
        function testAllItemsChecked() {
            ctrl.allItemsChecked = ctrl.itemsCount > 0 && ctrl.checkedItemsCount === ctrl.itemsCount;
        }
    }
}());
