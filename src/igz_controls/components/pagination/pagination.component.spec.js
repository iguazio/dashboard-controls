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
describe('igzPagination component:', function () {
    var $componentController;
    var $rootScope;
    var $timeout;
    var LocalStorageService;
    var ctrl;

    beforeEach(function () {
        module('iguazio.dashboard-controls');

        inject(function (_$componentController_, _$rootScope_, _$timeout_, _LocalStorageService_) {
            $componentController = _$componentController_;
            $rootScope = _$rootScope_;
            $timeout = _$timeout_;
            LocalStorageService = _LocalStorageService_;
        });

        var updateDataOnPageChange = angular.noop;
        var pageData = {
            page: 0,
            size: 10,
            total: 10
        };
        var bindings = {
            entityName: 'anyEntityName',
            pageData: pageData,
            paginationCallback: updateDataOnPageChange
        };

        ctrl = $componentController('igzPagination', null, bindings);
    });

    afterEach(function () {
        $componentController = null;
        $rootScope = null;
        $timeout = null;
        LocalStorageService = null;
        ctrl = null;
    });

    describe('onPerPageChanged():', function () {
        it('should call goToPage with 1 as argument', function () {
            spyOn(ctrl, 'goToPage');

            ctrl.onPerPageChanged(10);

            expect(ctrl.goToPage).toHaveBeenCalledWith(0);
        });

        it('should call LocalStorageService.setItem()', function () {
            spyOn(LocalStorageService, 'setItem');

            ctrl.onPerPageChanged({id: 20}, true);

            expect(LocalStorageService.setItem).toHaveBeenCalledWith('itemsPerPage', 'anyEntityName', 20);
        });
    });

    describe('goToPage():', function () {
        it('should return false ', function () {
            expect(ctrl.goToPage('...')).toBeFalsy();
        });

        it('should set passed value to ctrl.page', function () {
            ctrl.goToPage(1);
            expect(ctrl.page).toBe(1);
        });

        it('should call paginationCallback if goToPage was called with valid value', function () {
            spyOn(ctrl, 'paginationCallback');
            ctrl.goToPage(1);
            expect(ctrl.paginationCallback).toHaveBeenCalled();
        });
    });

    describe('jumpToPage():', function () {
        it('should call goToPage with jumpPage as argument if jumpPage less or equal pagesTotal', function () {
            ctrl.jumpPage = '5';

            spyOn(ctrl, 'goToPage');
            ctrl.jumpToPage();
            $timeout.flush();

            // 1 is subtracted from ctrl.jumpPage because it begins from 1 but not 0
            expect(ctrl.goToPage).toHaveBeenCalledWith(4);
        });

        it('should set to the jumpPage new value to be equal page if jumpPage higher than pagesTotal', function () {
            ctrl.page = 3;
            ctrl.jumpPage = '12';

            ctrl.jumpToPage();
            $timeout.flush();

            expect(ctrl.jumpPage).toBe('4');
        });
    });

    describe('goToPrevPage():', function () {
        it('should call goToPage with passed pagesTotal as argument if page equal 0', function () {
            ctrl.page = 0;

            spyOn(ctrl, 'goToPage');
            ctrl.goToPrevPage();
            expect(ctrl.goToPage).toHaveBeenCalledWith(9);
        });

        it('should call goToPage with passed page - 1 as argument in any case exept page will be equal 1', function () {
            ctrl.page = 3;

            spyOn(ctrl, 'goToPage');
            ctrl.goToPrevPage();
            expect(ctrl.goToPage).toHaveBeenCalledWith(2);
        });
    });

    describe('goToNextPage():', function () {
        it('should call goToPage with zero index of pages array as argument if page will be equal pagesTotal', function () {
            ctrl.page = 9;

            spyOn(ctrl, 'goToPage');
            ctrl.goToNextPage();
            expect(ctrl.goToPage).toHaveBeenCalledWith(0);
        });

        it('should call goToPage with page + 1 as argument in any case exept page will be equal pagesTotal', function () {
            ctrl.page = 8;

            spyOn(ctrl, 'goToPage');
            ctrl.goToNextPage();
            expect(ctrl.goToPage).toHaveBeenCalledWith(9);
        })
    })
});
