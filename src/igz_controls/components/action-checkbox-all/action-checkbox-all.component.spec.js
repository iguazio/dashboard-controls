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
describe('igzActionCheckboxAll component:', function () {
    var $componentController;
    var $rootScope;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
        });

        var bindings = {
            itemsCount: 10,
            checkedItemsCount: 4
        };

        ctrl = $componentController('igzActionCheckboxAll', null, bindings);
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        ctrl = null;
    });

    describe('onCheckAll(): ', function () {
        it('Check all broadcast should be sent:', function () {
            spyOn($rootScope, '$broadcast');

            ctrl.onCheckAll();
            expect(ctrl.checkedItemsCount).toBe(10);
            expect($rootScope.$broadcast).toHaveBeenCalledWith('action-checkbox-all_check-all', {
                checked: true,
                checkedCount: 10,
                itemsType: null
            });

            ctrl.onCheckAll();
            expect(ctrl.checkedItemsCount).toBe(0);
            expect($rootScope.$broadcast).toHaveBeenCalledWith('action-checkbox-all_check-all', {
                checked: false,
                checkedCount: 0,
                itemsType: null
            });
        });
    });

});
